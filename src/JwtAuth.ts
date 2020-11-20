import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';

import { ObjectStore, HttpError, PasswordAuth, PasswordHash } from '@tesseractcollective/serverless-toolbox';
import HasuraUserApi from './HasuraUserApi';

export interface User {
  id: string;
  email: string;
}

const ticketTimeToLive = 1000 * 60 * 60 * 24; // 24 hours

export interface VerifyTicket {
  ticket: string,
  expires: number,
  verified: boolean,
}

export interface UserPassword {
  id: string;
  userId: string;
  hash: PasswordHash,
  emailVerify?: VerifyTicket,
  mobileVerify?: VerifyTicket, 
  passwordResetTicket?: VerifyTicket,
}

// TODO: import from ./tools/ObjectStore
// interface Action {
//   type: string;
//   payload?: { [key: string]: any };
//   meta?: { [key: string]: any };
//   error?: boolean;
// }
// type Reducer<T> = (state: T, action: Action) => T;

const emailOrPasswordError = new HttpError(400, 'incorrect email or password');

export default class JwtHasuraAuth {
  private readonly passwordAuth = new PasswordAuth();
  private readonly passwordStore: ObjectStore<UserPassword>;
  private readonly minPasswordLength: number;
  private readonly hasuraUserApi?: HasuraUserApi;
  readonly timeToLive: number;
  readonly revokable: boolean;
  readonly jwtSecret: string;

  constructor(
    store: ObjectStore<UserPassword>,
    jwtSecret: string,
    minPasswordLength: number = 10,
    hasuraUserApi?: HasuraUserApi,
  ) {
    this.passwordStore = store;
    this.timeToLive = -1;
    this.revokable = false;
    this.jwtSecret = jwtSecret;
    this.minPasswordLength = minPasswordLength;
    this.hasuraUserApi = hasuraUserApi;
  }

  /**
   * Create a new user and an email verification ticket.
   * @param email User account email.
   * @param password Account password.
   */
  async createUser(email: string, password: string): Promise<UserPassword> {
    const existingUserPassword = await this.passwordStore.get(email);
    if (existingUserPassword) {
      if ((existingUserPassword.emailVerify === undefined || existingUserPassword.emailVerify.verified === true)) {
        return Promise.reject(new HttpError(409, 'email already exists'));
      } else if (existingUserPassword.emailVerify.verified === false) {
        await this.deleteUser(email).catch(() => {}); // delete existing unverified user before creating another.
      }
    }
    if (password.length < this.minPasswordLength) {
      return Promise.reject(new HttpError(400, `password must be ${this.minPasswordLength} characters or longer`));
    }

    let userId = nanoid();
    if (this.hasuraUserApi) {
      const hasuraUser = await this.hasuraUserApi.createUserWithEmail(email);
      userId = hasuraUser.id;
    }
    
    const hash = await this.passwordAuth.createHash(password);
    const data: UserPassword = {
      id: email,
      userId: userId,
      hash,
      emailVerify: { 
        ticket: nanoid(),
        expires: Date.now() + ticketTimeToLive,
        verified: false,
      }
    }
    return this.passwordStore.put(email, data)
    .then(() => data)
    .catch(err => Promise.reject('error saving user to database'));
  }

  /**
   * Delete user account & account password records.
   * @param email User account email.
   */
  async deleteUser(email: string): Promise<any> {
    const existingUserPassword = await this.passwordStore.get(email);
    if (!existingUserPassword) {
      return Promise.reject(new HttpError(404, 'User not found'));
    }
    let userResponse: any;

    if (this.hasuraUserApi) {
      try {
        const userResponse = await this.hasuraUserApi.deleteUserById(existingUserPassword.userId);
      } catch(error) {
        console.log("error deleting user from Hasura: " + JSON.stringify(error))
        if (error.statusCode !== 404) { // Swallow 404 to allow deleting password if user does not exist in user store.
          throw new HttpError(500, 'error deleting user, please try again later');
        }
      }
    }
    
    return await this.passwordStore.delete(email);
  }

  async updatePassword(email: string, password: string): Promise<UserPassword> {
    const userPassword = await this.passwordStore.get(email);
    if (!userPassword) {
      return Promise.reject(new HttpError(404, 'email does not exist'));
    }
    if (password.length < this.minPasswordLength) {
      return Promise.reject(new HttpError(400, `password must be ${this.minPasswordLength} characters or longer`));
    }
    delete userPassword.passwordResetTicket;
    userPassword.hash = await this.passwordAuth.createHash(password);
    await this.passwordStore.put(email, userPassword);
    return userPassword;
  }

  async removePasswordResetTicket(email: string): Promise<UserPassword> {
    const userPassword = await this.passwordStore.get(email);
    if (!userPassword) {
      return Promise.reject('no user found to delete password reset ticket');
    }
    delete userPassword.passwordResetTicket;
    return this.passwordStore.put(email, userPassword);
  }

  /**
   * Add a new email verification ticket, replacing any old ones, refreshing the expiration date.
   * @param email User account email.
   */
  async addEmailVerifyTicket(email: string): Promise<VerifyTicket> {
    let user = await this.passwordStore.get(email);
    if (user) {
      user.emailVerify = { 
        ticket: nanoid(),
        expires: Date.now() + ticketTimeToLive,
        verified: false,
      }
      await this.passwordStore.put(email, user);
      return user.emailVerify;
    } else {
      return Promise.reject('Error creating email verification ticket');
    }
  }

  /**
   * Verify email address with a ticket.
   * @param email User account email.
   * @param ticket Email verification ticket value.
   */
  async verifyEmail(email: string, ticket: string): Promise<UserPassword>{
    try {
      let user = await this.passwordStore.get(email);
      if (user && user.emailVerify && user.emailVerify.ticket === ticket && !user.emailVerify.verified) {
        if (user.emailVerify.expires > Date.now()) {
          user.emailVerify.verified = true;
          return this.passwordStore.put(email, user);
        } else {
          Promise.reject('Ticket has expired, please initiate the email verification process again.');
        }
      }
    } catch (error) {
      return Promise.reject(`Error verifying email ${email}. Please try again.`)
    }
    return Promise.reject('Unable to verify email. Either the user account does not exist or the email has already been verified.');
  }

  /**
   * Add a new password reset ticket, replacing any old ones, refreshing expiration date.
   * @param email User account email.
   */
  async addPasswordResetTicket(email: string): Promise<VerifyTicket> {
    let user = await this.passwordStore.get(email);
    console.log("User state before reducer");
    console.log(JSON.stringify(user));
    if (user) {
      user.passwordResetTicket = { 
        ticket: nanoid(),
        expires: Date.now() + ticketTimeToLive,
        verified: false,
      }
      await this.passwordStore.put(email, user);
      return user.passwordResetTicket;
    } else {
      return Promise.reject('Error creating password reset ticket');
    }
  }

  /**
   * Test to see if user exists according to the password store.
   * @param email User account email.
   */
  async userExists(email: string): Promise<boolean> {
    const record = await this.passwordStore.get(email);
    return !!record;
  }

  async getUserPassword(email: string): Promise<UserPassword | undefined> {
    return this.passwordStore.get(email);
  }

  private async getUserAndUserPassword(email: string): Promise<{ user: User, userPassword: UserPassword }> {
    const userPassword = await this.getUserPassword(email);
    if (!userPassword) {
      return Promise.reject(emailOrPasswordError);
    }

    let user = {
      id: userPassword.userId,
      email: userPassword.id,
    };
    if (this.hasuraUserApi) {
      user = await this.hasuraUserApi.getUserById(userPassword.userId);
      if (!user) {
        return Promise.reject(emailOrPasswordError);
      }
    }

    return { user, userPassword };
  }

  /**
   * Gets user.
   * @param email User account email.
   */
  async getUserWithEmail(email: string): Promise<User> {
    const { user } = await this.getUserAndUserPassword(email);
    return user;
  }

  /**
   * Gets user if password is correct.
   * @param email User account email.
   * @param password Account password.
   */
  async getUserWithEmailPassword(email: string, password: string): Promise<User> {
    const { user, userPassword } = await this.getUserAndUserPassword(email);
    const isValid = await this.passwordAuth.verifyHash(userPassword.hash, password);
    if (!isValid) {
      return Promise.reject(emailOrPasswordError);
    }
    return user;
  }

  /**
   * Generate new JWT for use with Hasura.
   * @param jwtClaimsNamespace 
   * @param allowedRoles 
   * @param role 
   * @param ownerId 
   * @param grantId 
   */
  createHasuraToken(jwtClaimsNamespace: string, allowedRoles: string[], role: string, ownerId: string, grantId?: string) {
    const jwtData = {
      sub: ownerId,
      iat: Date.now() / 1000,
      [jwtClaimsNamespace]: {
        'x-hasura-allowed-roles': allowedRoles,
        'x-hasura-default-role': role,
        'x-hasura-owner-id': ownerId,
        'x-hasura-grant-id': grantId,
      }
    }
    const options = this.timeToLive > 0 ? { expiresIn: this.timeToLive } : undefined;
    return jwt.sign(jwtData, this.jwtSecret, options);
  }
}

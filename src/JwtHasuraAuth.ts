import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';

import { ObjectStore, HttpError, PasswordAuth, PasswordHash } from '@tesseractcollective/serverless-toolbox';
import UserApi, { User } from './UserApi';


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
  private readonly api: UserApi;
  private readonly minPasswordLength: number;
  readonly timeToLive: number;
  readonly revokable: boolean;
  readonly jwtSecret: string;

  constructor(
    store: ObjectStore<UserPassword>,
    api: UserApi,
    jwtSecret: string,
    minPasswordLength: number = 10
  ) {
    this.passwordStore = store;
    this.timeToLive = -1;
    this.revokable = false;
    this.api = api;
    this.jwtSecret = jwtSecret;
    this.minPasswordLength = minPasswordLength;
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

    const userSvcUser = await this.api.createUserWithEmail(email);
    const hash = await this.passwordAuth.createHash(password);
    const data: UserPassword = {
      id: email,
      userId: userSvcUser.id,
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
    let userResp: any;
    try {
      const userResp = await this.api.deleteUserById(existingUserPassword.userId);
    } catch(error) {
      console.log("error deleting user from Hasura: " + JSON.stringify(error))
      if (error.statusCode !== 404) { // Swallow 404 to allow deleting password if user does not exist in user store.
        throw new HttpError(500, 'error deleting user, please try again later');
      }
    }
    const passwordResp = await this.passwordStore.delete(email);
    return Promise.all([userResp, passwordResp]);
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
    let user = await this.getUserPlain(email);
    if (user) {
      user.emailVerify = { 
        ticket: nanoid(),
        expires: Date.now() + ticketTimeToLive,
        verified: false,
      }
      let dbResponse = await this.passwordStore.put(email, user);
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
    // let action = {
    //   type: 'ADD_PASSWORD_RESET_TICKET',
    //   payload: verifyTicket 
    // }
    // const userPasswordTicketReducer = (state: UserPassword, action: Action) => {
    //   if (action.payload) {

    //   }
    //   state.passwordResetTicket = {action.payload}; 
    // }

    let user = await this.getUserPlain(email);
    console.log("User state before reducer");
    console.log(JSON.stringify(user));
    if (user) {
      user.passwordResetTicket = { 
        ticket: nanoid(),
        expires: Date.now() + ticketTimeToLive,
        verified: false,
      }
      console.log("User state after reducer");
      console.log(JSON.stringify(user));
      // let user = await this.passwordStore.updateState(email, action, reducer)
      let dbResponse = await this.passwordStore.put(email, user);
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

  async getUserPlain(email: string): Promise<UserPassword | undefined> {
    return this.passwordStore.get(email);
  }

  /**
   * Gets user if password is correct.
   * @param email User account email.
   * @param password Account password.
   */
  async getUser(email: string, password: string): Promise<User> {
    const userPassword = await this.passwordStore.get(email);
    if (!userPassword) {
      return Promise.reject(emailOrPasswordError);
    }

    const isValid = await this.passwordAuth.verifyHash(userPassword.hash, password);
    if (!isValid) {
      return Promise.reject(emailOrPasswordError);
    }

    const user = await this.api.getUserById(userPassword.userId);
    if (!user) {
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

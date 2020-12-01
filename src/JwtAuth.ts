import { nanoid, customAlphabet } from 'nanoid';
import jwt from 'jsonwebtoken';

import { ObjectStore, HttpError, PasswordAuth, PasswordHash } from '@tesseractcollective/serverless-toolbox';
import HasuraUserApi from './HasuraUserApi';

export interface User {
  id: string;
  email: string;
  role: string;
}

const nanoIdTextCode = customAlphabet('0123456789', 6);

const defaultTimeToLive = 1000 * 60 * 60 * 24; // 24 hours

export interface VerifyTicket {
  ticket: string,
  expires: number,
  verified: boolean,
}

export interface UserPassword {
  id: string;
  userId: string;
  hash: PasswordHash;
  role: string;
  mobile?: string;
  emailVerify?: VerifyTicket;
  mobileVerify?: VerifyTicket; 
  passwordResetTicket?: VerifyTicket;
}

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
  async createUser(email: string, password: string, timeToLive: number = defaultTimeToLive): Promise<UserPassword> {
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
    let role = 'user';
    if (this.hasuraUserApi) {
      const hasuraUser = await this.hasuraUserApi.createUserWithEmail(email);
      userId = hasuraUser.id;
    }
    
    const hash = await this.passwordAuth.createHash(password);
    const data: UserPassword = {
      id: email,
      userId: userId,
      hash,
      role,
      emailVerify: { 
        ticket: nanoid(),
        expires: Date.now() + timeToLive,
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

    if (this.hasuraUserApi) {
      try {
        await this.hasuraUserApi.deleteUserById(existingUserPassword.userId);
      } catch(error) {
        console.log("error deleting user from Hasura: " + JSON.stringify(error))
        if (error.statusCode !== 404) { // Swallow 404 to allow deleting password if user does not exist in user store.
          throw new HttpError(500, 'error deleting user, please try again later');
        }
      }
    }
    
    return await this.passwordStore.delete(email);
  }

  ticketNotVerified(ticket: string, verifyTicket: VerifyTicket) {
    return verifyTicket?.ticket === ticket && verifyTicket?.verified !== true;
  }

  ticketNotExpired(verifyTicket: VerifyTicket) {
    return verifyTicket?.expires || 0 > Date.now();
  }

  async updatePassword(email: string, password: string, ticket: string): Promise<UserPassword> {
    const userPassword = await this.passwordStore.get(email);
    if (!userPassword) {
      return Promise.reject(new HttpError(404, 'email does not exist'));
    }

    if (userPassword.passwordResetTicket && this.ticketNotVerified(ticket, userPassword.passwordResetTicket)) {
      if (this.ticketNotExpired(userPassword.passwordResetTicket)) {
        if (password.length < this.minPasswordLength) {
          return Promise.reject(new HttpError(400, `password must be ${this.minPasswordLength} characters or longer`));
        }
        delete userPassword.passwordResetTicket;
        userPassword.hash = await this.passwordAuth.createHash(password);
        await this.passwordStore.put(email, userPassword);
        return userPassword;
      } else {
        delete userPassword.passwordResetTicket;
        await this.passwordStore.put(email, userPassword);
        throw new HttpError(400, 'Your password reset ticket has expired. Please start the password reset process again.');
      }
    } 
    throw new HttpError(400, 'An error occured, please start the password reset process again.');
  }

  /**
   * Add a new email verification ticket, replacing any old ones, refreshing the expiration date.
   * @param email User account email.
   */
  async addEmailVerifyTicket(email: string, timeToLive: number = defaultTimeToLive): Promise<VerifyTicket> {
    let user = await this.passwordStore.get(email);
    if (user) {
      user.emailVerify = { 
        ticket: nanoid(),
        expires: Date.now() + timeToLive,
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
      if (user?.emailVerify && this.ticketNotVerified(ticket, user.emailVerify)) {
        if (this.ticketNotExpired(user.emailVerify)) {
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
  async addPasswordResetTicket(email: string, timeToLive: number = defaultTimeToLive): Promise<VerifyTicket> {
    let user = await this.passwordStore.get(email);
    console.log("User state before reducer");
    console.log(JSON.stringify(user));
    if (user) {
      user.passwordResetTicket = { 
        ticket: nanoid(),
        expires: Date.now() + timeToLive,
        verified: false,
      }
      await this.passwordStore.put(email, user);
      return user.passwordResetTicket;
    } else {
      return Promise.reject('Error creating password reset ticket');
    }
  }

  /**
   * Add a new mobile ticket, replacing any old ones, refreshing expiration date.
   * @param email User account email.
   * @param mobile User account mobile number.
   */
  async addMobile(email: string, mobile: string, timeToLive: number = defaultTimeToLive): Promise<VerifyTicket> {
    const user = await this.passwordStore.get(email);
    if (user) {
      const mobileVerify = { 
        ticket: nanoIdTextCode(),
        expires: Date.now() + timeToLive,
        verified: false,
      }
      const newUser = { ...user, mobileVerify, mobile }
      await this.passwordStore.put(email, newUser);
      return mobileVerify;
    } else {
      return Promise.reject('Error creating password reset ticket');
    }
  }

  /**
   * Verify mobile number with a ticket.
   * @param email User account email.
   * @param ticket Mobile verification ticket value.
   * @param mobile User mobile number.
   */
  async verifyMobile(email: string, ticket: string, mobile: string): Promise<UserPassword>{
    try {
      let user = await this.passwordStore.get(email);
      if (user?.mobileVerify && this.ticketNotVerified(ticket, user.mobileVerify) && mobile === user.mobile) {
        if (this.ticketNotExpired(user.mobileVerify)) {
          user.mobileVerify.verified = true;
          return this.passwordStore.put(email, user);
        } else {
          Promise.reject('Ticket has expired, please initiate the mobile verification process again.');
        }
      }
    } catch (error) {
      return Promise.reject(`Error verifying mobile ${mobile}. Please try again.`)
    }
    return Promise.reject('Unable to verify mobile number. Either the user account does not exist or the mobile number has already been verified.');
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
      role: userPassword.role,
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
   * Gets user if jwt is correct.
   * @param token JWT.
   */
  async getUserWithJwt(token: string): Promise<User> {
    const decoded = this.verifyJwt(token);
    const { user } = await this.getUserAndUserPassword(decoded.email);
    return user;
  }

  verifyJwt(token: string): any {
    const decoded = jwt.verify(token, this.jwtSecret);
    return decoded;
  }

  createJwt(user: User) {
    const jwtData = {
      sub: user.id,
      email: user.email,
      iat: Date.now() / 1000,
    }
    const options = this.timeToLive > 0 ? { expiresIn: this.timeToLive } : undefined;
    return jwt.sign(jwtData, this.jwtSecret, options);
  }

  /**
   * Gets user if password is correct.
   * @param email User account email.
   * @param password Account password.
   */
  async createJwtWithEmailPassword(email: string, password: string): Promise<string> {
    const { user, userPassword } = await this.getUserAndUserPassword(email);
    if (this.hasuraUserApi) {

    }
    return this.createJwt(user);
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

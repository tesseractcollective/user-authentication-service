import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';

import { ObjectStore, HttpError, HasuraUserApi, HasuraUserBase, PasswordAuth, PasswordHash, log } from './tools';

const ticketTimeToLive = 1000 * 60 * 24; // 24 hours

export interface VerifyTicket {
  ticket: string,
  value: string,
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

export default class JwtHasuraAuth<T extends HasuraUserBase> {
  private readonly passwordAuth = new PasswordAuth();
  private readonly passwordStore: ObjectStore<UserPassword>;
  private readonly api: HasuraUserApi<T>;
  private readonly minPasswordLength: number;
  readonly timeToLive: number;
  readonly revokable: boolean;
  readonly jwtSecret: string;

  constructor(
    store: ObjectStore<UserPassword>,
    api: HasuraUserApi<T>,
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
   * @param email Email for account.
   * @param password Password for account.
   */
  async createUser(email: string, password: string): Promise<T> {
    const existingUserPassword = await this.passwordStore.get(email);
    if (existingUserPassword && (existingUserPassword.emailVerify === undefined || existingUserPassword.emailVerify.verified === true) ) {
      return Promise.reject(new HttpError(409, 'email already exists'));
    }
    if (password.length < this.minPasswordLength) {
      return Promise.reject(new HttpError(400, `password must be ${this.minPasswordLength} or more characters long`));
    }

    const user = await this.api.createUserWithEmail(email);
    const hash = await this.passwordAuth.createHash(password);
    const data: UserPassword = {
      id: email,
      userId: user.id,
      hash,
      emailVerify: { 
        ticket: nanoid(),
        value: email,
        expires: Date.now() + ticketTimeToLive,
        verified: false,
      }
    }
    await this.passwordStore.put(email, data);
    return user;
  }

  async updatePassword(email: string, password: string): Promise<UserPassword> {
    const userPassword = await this.passwordStore.get(email);
    if (!userPassword) {
      return Promise.reject(new HttpError(404, 'email does not exist'));
    }
    if (password.length < this.minPasswordLength) {
      return Promise.reject(new HttpError(400, `password must be ${this.minPasswordLength} or more characters long`));
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
      console.log("TICKET TTL IS: " + ticketTimeToLive)
      user.passwordResetTicket = { 
        ticket: nanoid(),
        value: email,
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

  async verifyEmail(email: string, ticket: string): Promise<boolean> {
    const userPassword = await this.passwordStore.get(email);
    if (!userPassword) {
      return Promise.reject(new HttpError(401, 'email already exists'));
    }

    return Promise.reject('not implemented');
  }

  /**
   * Test to see if user exists according to the password store.
   * @param email Id of user account.
   */
  async userExists(email: string): Promise<boolean> {
    const record = await this.passwordStore.get(email);
    return !!record;
  }

  async getUserPlain(email: string): Promise<UserPassword | undefined> {
    const record = await this.passwordStore.get(email);
    return record;
  }

  /**
   * Gets user if password is correct.
   * @param email Id of user account.
   * @param password Plaintext password to hash.
   */
  async getUser(email: string, password: string): Promise<T> {
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

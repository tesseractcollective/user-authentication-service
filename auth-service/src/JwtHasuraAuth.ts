import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid'
import { ObjectStore, HttpError, HasuraUserApi, HasuraUserBase, PasswordAuth, PasswordHash } from './tools';

const ticketTimeToLive = 1000 * 15;

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
}

export default class JwtHasuraAuth<T extends HasuraUserBase> {
  private readonly passwordAuth = new PasswordAuth();
  private readonly passwordStore: ObjectStore<UserPassword>;
  private readonly api: HasuraUserApi<T>;
  private readonly minPasswordLength: number;
  readonly timeToLive: number;
  readonly revokable: boolean;
  readonly jwtKey: string;
  readonly jwtDataCreator: (user: T) => { [key: string]: any };

  constructor(
    store: ObjectStore<UserPassword>,
    api: HasuraUserApi<T>,
    minPasswordLength: number = 10
  ) {
    this.passwordStore = store;
    this.timeToLive = -1;
    this.revokable = false;
    this.api = api;
    this.minPasswordLength = minPasswordLength;
  }

  async createUser(email: string, password: string): Promise<T> {
    const existingUserPassword = await this.passwordStore.get(email);
    if (existingUserPassword && (existingUserPassword.emailVerify === undefined || existingUserPassword.emailVerify.verified === true) ) {
      return Promise.reject(new HttpError(401, 'email already exists'));
    }
    if (password.length < this.minPasswordLength) {
      return Promise.reject(new HttpError(401, `password must be ${this.minPasswordLength} or more characters long`));
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

  async verifyEmail(email: string, ticket: string): Promise<boolean> {
    const userPassword = await this.passwordStore.get(email);
    if (!userPassword) {
      return Promise.reject(new HttpError(401, 'email already exists'));
    }
  }

  async getUser(email: string, password: string): Promise<T> {
    const userPassword = await this.passwordStore.get(email);
    if (!userPassword) {
      return Promise.reject(new HttpError(400, 'incorrect id or password'));
    }

    const isValid = await this.passwordAuth.verifyHash(userPassword.hash, password);
    if (!isValid) {
      return Promise.reject(new HttpError(400, 'incorrect id or password'));
    }

    const user = await this.api.getUserById(userPassword.userId);
    return user;
  }
}

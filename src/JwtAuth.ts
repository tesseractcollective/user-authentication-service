import { nanoid, customAlphabet } from 'nanoid';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

import { ObjectStore, HttpError, PasswordAuth, PasswordHash, log } from '@tesseractcollective/serverless-toolbox';

export interface User {
  id: string;
  email: string;
  role: string;
  mobile?: string;
  emailVerified: boolean;
  mobileVerified: boolean;
}

export interface TicketBox {
  ticket: string;
}

export interface UserIdBox {
  userId: string;
}

const emailOrPasswordError = new HttpError(400, 'incorrect email or password');
const nanoidTextCodeCreator = customAlphabet('0123456789', 6);

export default class JwtAuth {
  private readonly passwordAuth = new PasswordAuth();
  private readonly passwordStore: ObjectStore<PasswordHash>;
  private readonly expiringTicketStore: ObjectStore<TicketBox>;
  private readonly emailMapStore: ObjectStore<UserIdBox>;
  private readonly userStore: ObjectStore<User>;
  private readonly minPasswordLength: number;
  
  readonly timeToLive: number;
  readonly revokable: boolean;
  readonly jwtSecret: string;

  constructor(
    passwordStore: ObjectStore<PasswordHash>,
    expiringTicketStore: ObjectStore<TicketBox>,
    emailMapStore: ObjectStore<UserIdBox>,
    userStore: ObjectStore<User>,
    jwtSecret: string,
    minPasswordLength: number = 10,
  ) {
    this.passwordStore = passwordStore;
    this.expiringTicketStore = expiringTicketStore;
    this.emailMapStore = emailMapStore;
    this.userStore = userStore;
    this.timeToLive = -1;
    this.revokable = false;
    this.jwtSecret = jwtSecret;
    this.minPasswordLength = minPasswordLength;
  }

  /**
   * Create a new user and an email verification ticket.
   * @param email User account email.
   * @param password Account password.
   */
  async createUser(email: string, password: string, role: string): Promise<User> {
    let userId = await this.getUserIdForEmail(email);
    if (userId) {
      return Promise.reject(new HttpError(409, 'user already exists'));
    }
    if (password.length < this.minPasswordLength) {
      return Promise.reject(new HttpError(400, `password must be ${this.minPasswordLength} characters or longer`));
    }

    userId = uuidv4();

    const user: User = {
      id: userId,
      email,
      role,
      emailVerified: false,
      mobileVerified: false,
    };
    const hash = await this.passwordAuth.createHash(password);

    return Promise.all([
      this.userStore.put(userId, user),
      this.emailMapStore.put(email, { userId: userId }),
      this.passwordStore.put(userId, hash)
    ])
    .then(() => user)
    .catch(err => Promise.reject(new HttpError(500, 'error saving user to database')));    
  }

  /**
   * Gets user.
   * @param email User account email.
   */
  async getUser(id: string): Promise<User | undefined> {
    return this.userStore.get(id);
  }

  /**
   * Gets user.
   * @param email User account email.
   */
  async getUserWithEmail(email: string): Promise<User | undefined> {
    const userId = await this.getUserIdForEmail(email);
    if (userId) {
      return this.getUser(userId);
    }
  }

  /**
   * Gets user if password is correct.
   * @param email User account email.
   * @param password Account password.
   */
  async getUserWithEmailPassword(email: string, password: string): Promise<User | undefined> {
    const user = await this.getUserWithEmail(email);
    if (user) {
      const passwordHash = await this.passwordStore.get(user.id);
      if (passwordHash) {
        const isValid = await this.passwordAuth.verifyHash(passwordHash, password);
        if (isValid) {
          return user;
        }
      }
    }
    return Promise.reject(emailOrPasswordError);
  }

  /**
   * Delete user account & account password records.
   * @param email User account email.
   */
  async deleteUser(email: string): Promise<any> {
    const userId = await this.getUserIdForEmail(email);
    if (!userId) {
      return Promise.reject(new HttpError(404, 'User not found'));
    }
    const promises = [
      this.userStore.delete(userId),
      this.passwordStore.delete(userId),
    ];
    const user = await this.userStore.get(userId);
    if (user) {
      promises.push(this.emailMapStore.delete(user.email))
    }

    return Promise.all(promises);
  }

  async updatePassword(email: string, password: string, ticket: string): Promise<void> {
    const userId = await this.getUserIdForEmail(email);
    if (!userId) {
      return Promise.reject(new HttpError(404, 'email does not exist'));
    }
    const ticketId = `${userId}/passwordReset`;
    const ticketVerified = await this.verifyTicket(ticketId, ticket);
    if (ticketVerified) {
      if (password.length < this.minPasswordLength) {
        return Promise.reject(new HttpError(400, `password must be ${this.minPasswordLength} characters or longer`));
      }
      await this.expiringTicketStore.delete(ticketId);
      const hash = await this.passwordAuth.createHash(password);
      await this.passwordStore.put(userId, hash);
      return;
    }
    return Promise.reject(new HttpError(400, 'Your password reset ticket has expired. Please start the password reset process again.'));
  }

  /**
   * Add a new email verification ticket, replacing any old ones, refreshing the expiration date.
   * @param email User account email.
   */
  async addEmailVerifyTicket(email: string): Promise<string> {
    try {
      const userId = await this.getUserIdForEmail(email);
      if (userId) {
        const ticketId = `${userId}/${email}`;
        const ticket = nanoid();
        await this.expiringTicketStore.put(ticketId, { ticket });
        return ticket;
      } 
    } catch(error) {
      log.error(error);
    }

    return Promise.reject(new HttpError(400, 'Error creating email verification ticket'));
  }

  /**
   * Verify email address with a ticket.
   * @param email User account email.
   * @param ticket Email verification ticket value.
   */
  async verifyEmail(email: string, ticket: string): Promise<User> {
    try {
      const userId = await this.getUserIdForEmail(email);
      if (userId) {
        const ticketId = `${userId}/${email}`;
        const verified = await this.verifyTicket(ticketId, ticket);
        if (verified) {
          const user = await this.userStore.get(userId);
          if (user) {
            user.emailVerified = true;
            await this.userStore.put(userId, user);
            return user;
          }
        } else {
          return Promise.reject(new HttpError(400, 'Ticket has expired, please initiate the email verification process again.'));
        }
      }
    } catch (error) {
      return Promise.reject(new HttpError(400, `Error verifying email ${email}. Please try again.`))
    }
    return Promise.reject(new HttpError(400, 'Unable to verify email. Either the user account does not exist or the email has already been verified.'));
  }

  /**
   * Add a new password reset ticket, replacing any old ones, refreshing expiration date.
   * @param email User account email.
   */
  async addPasswordResetTicket(email: string): Promise<string> {
    try {
      const userId = await this.getUserIdForEmail(email);
      if (userId) {
        const ticketId = `${userId}/passwordReset`;
        const ticket = nanoid();
        await this.expiringTicketStore.put(ticketId, { ticket });
        return ticket;
      }
    } catch(error) {
      log.error(error);
    }
    return Promise.reject(new HttpError(400, 'Error creating password reset ticket'));
  }

  /**
   * Add a new mobile ticket, replacing any old ones, refreshing expiration date.
   * @param email User account email.
   * @param mobile User account mobile number.
   */
  async addMobile(email: string, mobile: string): Promise<string | undefined> {
    try {
      const userId = await this.getUserIdForEmail(email);
      if (userId) {
        const user = await this.userStore.get(userId);
        if (user) {
          if (user.mobile === mobile && user.mobileVerified) {
            return;
          }
          const ticketId = `${userId}/${mobile}`;
          const ticket = nanoidTextCodeCreator();
          await this.expiringTicketStore.put(ticketId, { ticket });
          const newUser = {
            ...user,
            mobile,
            mobileVerified: false,
          }
          await this.userStore.put(userId, newUser);
          return ticket;
        }
      }
    } catch(error) {
      log.error(error);
    }
    return Promise.reject(new HttpError(400, 'Error creating password reset ticket'));
  }

  /**
   * Verify mobile number with a ticket.
   * @param email User account email.
   * @param ticket Mobile verification ticket value.
   * @param mobile User mobile number.
   */
  async verifyMobile(email: string, ticket: string, mobile: string): Promise<User> {
    try {
      const userId = await this.getUserIdForEmail(email);
      if (userId) {
        const ticketId = `${userId}/${mobile}`;
        const verified = await this.verifyTicket(ticketId, ticket);
        if (verified) {
          const user = await this.userStore.get(userId);
          if (user) {
            user.mobileVerified = true;
            await this.userStore.put(userId, user);
            return user;
          }
        } else {
          return Promise.reject(new HttpError(400, 'Ticket has expired, please initiate the mobile verification process again.'));
        }
      }
    } catch (error) {
      log.error(error);
      return Promise.reject(new HttpError(400, `Error verifying mobile ${mobile}. Please try again.`))
    }
    return Promise.reject(new HttpError(400, 'Unable to verify mobile number. Either the user account does not exist or the mobile number has already been verified.'));
  }

  private async getUserIdForEmail(email: string): Promise<string | undefined> {
    return this.emailMapStore.get(email).then(box => box?.userId);
  }

  /**
   * Gets user if jwt is correct.
   * @param token JWT.
   */
  async getUserWithJwt(token: string): Promise<User | undefined> {
    const decoded = this.verifyJwt(token);
    return this.getUser(decoded.sub);
  }

  private verifyJwt(token: string): any {
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
  async createJwtWithEmailPassword(email: string, password: string): Promise<string | undefined> {
    try {
      const user = await this.getUserWithEmailPassword(email, password);
      if (user) {
        return this.createJwt(user);
      }
    } catch(error) {
      log.error(error);
    }
    return Promise.reject(emailOrPasswordError);
  }

  private async verifyTicket(id: string, ticket: string): Promise<boolean> {
    const cachedTicket = await this.expiringTicketStore.get(id);
    if (cachedTicket?.ticket === ticket) {
      return true;
    }
    return false;
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

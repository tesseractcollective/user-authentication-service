import { Router, NextFunction, Request, Response } from 'express';
import { HttpError, HasuraUserBase } from './tools';
import JwtHasuraAuth, { VerifyTicket } from './JwtHasuraAuth';
import AWS, { SES } from 'aws-sdk';
import { passwordResetTemplate, emailVerificationTemplate, emailAlreadyVerifiedTemplate } from './tools/email';

// HTML Standard: https://html.spec.whatwg.org/multipage/input.html#valid-e-mail-address
const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

export default class AuthRouter<T extends HasuraUserBase> {
  readonly auth: JwtHasuraAuth<T>;
  readonly router = Router();
  readonly allowedOrigins: string;

  constructor(auth: JwtHasuraAuth<T>, allowedOrigins: string = '*') {
    this.auth = auth;
    this.allowedOrigins = allowedOrigins;
    this.setupRoutes();
  }

  validate<T>(object: { [key: string]: any }, key: string, type: string, test?: (value: any) => boolean): T {
    const value = object[key];
    if (!value) {
      throw new HttpError(400, `${key} required`);
    }
    if (typeof value !== type) {
      throw new HttpError(400, `${key} should be type ${type}, not ${typeof value}`);
    }
    if (test && !test(value)) {
      throw new HttpError(400, `invalid ${key}`);
    }
    return value;
  } 

  setupRoutes() {
    this.router.use((request: Request, response: Response, next: NextFunction) => {
      response.header('Access-Control-Allow-Origin', this.allowedOrigins);
      next();
    });
    this.router.post('/register', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const email = this.validate<string>(request.body, 'email', 'string', emailRegex.test.bind(emailRegex)).toLowerCase();
        const password = this.validate<string>(request.body, 'password', 'string');
        const user = await this.auth.createUser(email, password);
        if (user) {
          const ticket = await this.auth.addEmailVerifyTicket(email);
          // build link for email
          const env = process.env.STAGE;
          const stage = env !== undefined && ['dev', 'stg'].includes(env) ? `/${env}` : '';
          const tokenLink = `${request.protocol}://${request.headers.host}${stage}/auth/email-verify/verify?ticket=${ticket.ticket}&email=${email}`;
          let params = emailVerificationTemplate(email, tokenLink);
          await new AWS.SES().sendEmail(params).promise()
            .then(data => console.log(`Email verification email for ${email} sent successfully. MessageId: ${data.MessageId}`))
            .catch(err => console.error('Unable to send verification email ' + err, err.stack));
        } else {
          console.log(`User email ${email} does not exist, no email verification email sent.`);
        }
        response.status(201).json({'id': user.userId, 'email': user.id});
      } catch (error) {
        next(error);
      }
    });
    this.router.post('/login', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const email = this.validate<string>(request.body, 'email', 'string', emailRegex.test.bind(emailRegex)).toLowerCase();
        const password = this.validate<string>(request.body, 'password', 'string');

        // TODO: get role and permissions from user to get the namespace and service roles
        const user = await this.auth.getUser(email, password);
        const nameSpace = '';
        const allowedRoles = [''];
        const role = '';
        const token = this.auth.createHasuraToken(nameSpace, allowedRoles, role, user.id);

        response.json({ token, user });
      } catch (error) {
        next(error);
      }
    });
    this.router.post('/email-verify/request', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const email = this.validate<string>(request.body, 'email', 'string', emailRegex.test.bind(emailRegex)).toLowerCase();
        let user = await this.auth.getUserPlain(email);
        if (user) {
          let params: SES.Types.SendEmailRequest;
          if (user.emailVerify?.verified !== true) {
            const ticket = await this.auth.addEmailVerifyTicket(email);
            // build link for email
            const env = process.env.STAGE;
            const stage = env !== undefined && ['dev', 'stg'].includes(env) ? `/${env}` : '';
            const tokenLink = `${request.protocol}://${request.headers.host}${stage}/auth/email-verify/verify?ticket=${ticket.ticket}&email=${email}`;
            params = emailVerificationTemplate(email, tokenLink);
          } else {
            params = emailAlreadyVerifiedTemplate(email)
          }
          await new AWS.SES().sendEmail(params).promise()
            .then(data => console.log(`Email verification email for ${email} sent successfully. MessageId: ${data.MessageId}`))
            .catch(err => {
              console.error(err, err.stack);
              throw new HttpError(500, 'Unable to send email verification email, please try again.');
            })
        } else {
          console.log(`User email ${email} does not exist, no email verification email sent.`);
        }
        response.send();
      } catch (error) {
        next(error)
      }
    });
    this.router.get('/email-verify/verify', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const email = this.validate<string>(request.query, 'email', 'string', emailRegex.test.bind(emailRegex)).toLowerCase();
        const ticket = this.validate<string>(request.query, 'ticket', 'string');
        await this.auth.verifyEmail(email, ticket)
        .then(data => {
          console.log(`Email: ${email} verified successfully`)
          response.sendFile(__dirname + '/views/emailVerify.html')
        })
        .catch(err => {throw new HttpError(400, err.message)});
      } catch (error) {
        next(error)
      }
    });
    this.router.post('/token/refresh', async (request: Request, response: Response, next: NextFunction) => {
    });
    this.router.delete('/user/', async (request: Request, response: Response, next: NextFunction) => {
      // TODO modify to not call hasura
      try {
        const email = this.validate<string>(request.query, 'email', 'string', emailRegex.test.bind(emailRegex)).toLowerCase();
        await this.auth.deleteUser(email)
        .catch(err => {
          console.error(`Error deleting a user: ${err}`)
          throw new HttpError(500, 'Error deleting user, please try again later.')
        });
        response.send();
      } catch (error) {
        next(error);
      }
    });
    this.router.post('/change-password/request', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const email = this.validate<string>(request.body, 'email', 'string', emailRegex.test.bind(emailRegex)).toLowerCase();
        let userExists = await this.auth.userExists(email)
        if (userExists) {
          let ticket: VerifyTicket = await this.auth.addPasswordResetTicket(email);
          // build link for email
          const env = process.env.STAGE;
          const stage = env !== undefined && ['dev', 'stg'].includes(env) ? `/${env}` : '';
          const tokenLink = `${request.protocol}://${request.headers.host}${stage}/auth/change-password?ticket=${ticket.ticket}&email=${email}`;
          const params = passwordResetTemplate(email, tokenLink);
          await new AWS.SES().sendEmail(params).promise()
            .then(data => console.log(`Password reset email for ${email} sent successfully. MessageId: ${data.MessageId}`))
            .catch(err => {
              console.error(err, err.stack);
              throw new HttpError(500, 'Unable to send password reset email, please try again.');
            })
        } else {
          console.log(`User email ${email} does not exist, no password reset email sent.`);
        }
        response.send();
      } catch (error) {
        next(error)
      }
    });
    this.router.get('/change-password', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const email = this.validate<string>(request.query, 'email', 'string', emailRegex.test.bind(emailRegex));
        const ticket = this.validate<string>(request.query, 'ticket', 'string');
        response.sendFile(__dirname + '/views/passwordReset.html')
      } catch (error) {
        next(error)
      }
    });
    this.router.post('/change-password/verify', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const email = this.validate<string>(request.body, 'email', 'string', emailRegex.test.bind(emailRegex)).toLowerCase();
        const ticket = this.validate<string>(request.body, 'ticket', 'string');
        const password = this.validate<string>(request.body, 'password', 'string');
        let user = await this.auth.getUserPlain(email);
        if (user && user.passwordResetTicket) {
          if (user.passwordResetTicket.expires < Date.now()) {
            console.log(`The expiration date of ${user.passwordResetTicket.expires} is older than today: ${Date.now()}`);
            this.auth.removePasswordResetTicket(email)
            throw new HttpError(400, 'Your password reset ticket has expired. Please start the password reset process again.');
          } else if (user.passwordResetTicket.ticket === ticket) {
            try {
              await this.auth.updatePassword(email, password);
              response.status(204).send();
            } catch (error) {
              throw error;
            }
          }
        } else {
          throw new HttpError(400, 'An error occured, please start the password reset process again.');
        }
      } catch (error) {
        next(error)
      }
    });
    // with Twilio later
    this.router.post('/mobile-verify/request', async (request: Request, response: Response, next: NextFunction) => {
    });
    this.router.post('/mobile-verify/verify', async (request: Request, response: Response, next: NextFunction) => {
    });
    
  }
}

import { Router, NextFunction, Request, Response } from 'express';
import { middleware as openApiValidator } from 'express-openapi-validator';
import { ExpiringObjectStore, HttpError, JwtAuth, SesEmail, SnsSms, User } from "@tesseractcollective/serverless-toolbox";

import { passwordResetTemplate, emailVerificationTemplate, emailAlreadyVerifiedTemplate, EmailData } from './emailTemplates';

export default class AuthRouter {
  readonly auth: JwtAuth;
  readonly pkceStore: ExpiringObjectStore<any>
  readonly router = Router();
  readonly allowedOrigins: string;
  readonly senderName: string;
  readonly email: SesEmail;
  readonly sms: SnsSms;
  readonly ticketTimeToLiveSeconds: number;

  constructor(auth: JwtAuth, pkceStore: ExpiringObjectStore<any>, senderEmail: string, senderName: string, ticketTimeToLiveSeconds = 360, allowedOrigins: string = '*') {
    this.auth = auth;
    this.pkceStore = pkceStore;
    this.senderName = senderName;
    this.ticketTimeToLiveSeconds = ticketTimeToLiveSeconds;
    this.allowedOrigins = allowedOrigins;
    this.email = new SesEmail(senderEmail, senderName);
    this.sms = new SnsSms(senderName);
    this.setupRoutes();
  }

  setupRoutes() {
    this.router.use(
      openApiValidator({ apiSpec: `${__dirname}/../docs/schema.yaml` })
    );
    this.router.use((request: Request, response: Response, next: NextFunction) => {
      response.header('Access-Control-Allow-Origin', this.allowedOrigins);
      next();
    });
    
    this.router.post('/register', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const { email, password } = request.body;
        const { user, token } = await this.auth.createUser(email, password, 'user');
        const ticket = await this.auth.addEmailVerifyTicket(email, this.ticketTimeToLiveSeconds);
        const emailVerifyLink = this.createVerifyLink(request, ticket, email, 'email');
        const emailData = emailVerificationTemplate(emailVerifyLink, this.senderName);
        await this.email.sendEmail(email, emailData.subject, emailData.htmlMessage);
        response.status(201).json({ user, token });
      } catch (error) {
        next(error);
      }
    });

    this.router.post('/login', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const { email, password } = request.body;
        const user = await this.auth.getUserWithEmailPassword(email, password);
        const token = this.auth.createJwt(user);
        response.json({ user, token });
      } catch (error) {
        next(error);
      }
    });

    this.router.get('/user-info', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const user = await this.getAuthUser(request);
        response.json({ user });
      } catch (error) {
        next(error);
      }
    });

    this.router.post('/email-verify/request', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const { email } = request.body;
        const user = await this.auth.getUserWithEmail(email);
        let emailData: EmailData;
        if (user.emailVerified !== true) {
          const ticket = await this.auth.addEmailVerifyTicket(email, this.ticketTimeToLiveSeconds);
          const emailVerifyLink = this.createVerifyLink(request, ticket, email, 'email');
          emailData = emailVerificationTemplate(emailVerifyLink, this.senderName);
        } else {
          emailData = emailAlreadyVerifiedTemplate(this.senderName);
        }
        await this.email.sendEmail(email, emailData.subject, emailData.htmlMessage);
        response.send();
      } catch (error) {
        next(error)
      }
    });

    this.router.get('/email-verify/verify', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const { email, ticket } = request.query;
        await this.auth.verifyEmail(email as string, ticket as string);
        response.sendFile(__dirname + '/views/emailVerify.html')
      } catch (error) {
        next(error)
      }
    });

    this.router.post('/token/refresh', async (request: Request, response: Response, next: NextFunction) => {
    });

    this.router.post('/change-password/request', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const { email } = request.body;
        const ticket = await this.auth.addPasswordResetTicket(email, this.ticketTimeToLiveSeconds);
        const verifyLink = this.createVerifyLink(request, ticket, email, 'password');
        const emailData = passwordResetTemplate(verifyLink, this.senderName);
        await this.email.sendEmail(email, emailData.subject, emailData.htmlMessage);
        response.send();
      } catch (error) {
        next(error)
      }
    });

    this.router.get('/change-password', async (request: Request, response: Response, next: NextFunction) => {
      try {
        response.sendFile(__dirname + '/views/passwordReset.html');
      } catch (error) {
        next(error)
      }
    });

    this.router.post('/change-password/verify', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const { email, ticket, password } = request.body;
        await this.auth.updatePassword(email, password, ticket);
        response.status(204).send();
      } catch (error) {
        next(error)
      }
    });
    this.router.post('/mobile-verify/request', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const { mobile } = request.body;
        const user = await this.getAuthUser(request);
        const ticket = await this.auth.addMobile(user.id, mobile, this.ticketTimeToLiveSeconds);
        const message = `${this.senderName} mobile verification code: ${ticket}`;
        await this.sms.sendSms(mobile, message);
        response.send();
      } catch (error) {
        next(error)
      }
    });
    this.router.post('/mobile-verify/verify', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const { ticket } = request.body;
        const user = await this.getAuthUser(request);
        await this.auth.verifyMobile(user.id, ticket);
        response.send();
      } catch (error) {
        next(error)
      }
    });
    this.router.use((error: any, request: Request, response: Response, next: NextFunction) => {
      if (error.status) {
        error.statusCode = error.status;
      }
      next(error);
    });
  }

  private async getAuthUser(request: Request): Promise<User> {
    try {
      const authorization = request.headers.authorization;
      if (authorization) {
        const token = authorization.replace("Bearer ", "");
        const user = await this.auth.getUserWithJwt(token);
        if (user) {
          return user;
        }
      }
    } catch(error) {} 
    return Promise.reject(new HttpError(401, 'unauthorized'));
  }

  private createVerifyLink(request: Request, ticket: string, email: string, type: 'email' | 'password') {
    const subPath = (type: string): string => {
      switch(type) {
        case 'email': return 'email-verify/verify';
        case 'password': 
        default:
          return 'change-password';
      }
    }
    const stage = process.env.STAGE;
    const stagePath = stage !== undefined && ['dev', 'stg'].includes(stage) ? `/${stage}` : '';
    return `${request.protocol}://${request.headers.host}${stagePath}/auth/${subPath(type)}?ticket=${encodeURIComponent(ticket)}&email=${encodeURIComponent(email)}`;
  }

  // PKCE

  // Store session state in DynamoDB, what should be the key? 
  // code_challenge for steps 1 & 2
  // code for steps 2 & 3

  // 1. /authorize (Authorization Code Request + Code Challenge)

  // 2. /login/authorization (login UI for PKCE flow)

  // 3. /oath/token (Endpoint to retrieve tokens, ID Token and Access Token, given an authorization code)

  // Example of login request
  // https://identity.theellipsis.exchange/login?
  // state=hKFo2SBwVGdxaWhPZGpXcXlVT19JR2tlQXZ1TVBJVU5rTHlseqFupWxvZ2luo3RpZNkgM29XTnBDV2lkekFMdWZ6Vm1kXzJnVWRSZ084TGxPRjajY2lk2SAxOFg3Y2pEUzFpa2FpM3dBczlLSDRpV2VjVTcxWnB2VQ
  // &client=18X7cjDS1ikai3wAs9KH4iWecU71ZpvU
  // &protocol=oauth2
  // &redirect_uri=https%3A%2F%2Fportal.theellipsis.exchange
  // &audience=https%3A%2F%2Fidentity.theellipsis.exchange
  // &scope=openid%20profile%20email
  // &response_type=code
  // &response_mode=query
  // &nonce=aE9GYUNncml3MkQ4STVwZEp5SVFBLTJ1SDE4UnhaVUxwSC5RSUI0bTE4MQ%3D%3D
  // &code_challenge=SLL4eo6Aq04QzLfNJ3bd0boQeuPDK2-ZZ__AF4WRbIk
  // &code_challenge_method=S256
  // &auth0Client=eyJuYW1lIjoiQGF1dGgwL2F1dGgwLWFuZ3VsYXIiLCJ2ZXJzaW9uIjoiMS42LjAifQ%3D%3D
}

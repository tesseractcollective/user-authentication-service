import { Router, NextFunction, Request, Response } from 'express';
import { HttpError, HasuraUserBase } from './tools';
import JwtHasuraAuth from './JwtHasuraAuth';

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
        const email = this.validate<string>(request.body, 'email', 'string', emailRegex.test);
        const password = this.validate<string>(request.body, 'password', 'string');
        const validEmail = String(email).toLowerCase();
        const result = await this.auth.addPassword(validEmail, password);
        response.json(result);
      } catch (error) {
        next(error);
      }
    });
    this.router.post('/login', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const email = this.validate<string>(request.body, 'email', 'string', emailRegex.test);
        const password = this.validate<string>(request.body, 'password', 'string');
        const validEmail = String(email).toLowerCase();
        const result = await this.auth.verifyPassword(validEmail, password);
        response.json(result);
      } catch (error) {
        next(error);
      }
    });
    this.router.post('/logout', async (request: Request, response: Response, next: NextFunction) => {
      // TODO: delete refresh tokens
    });
    this.router.post('/activate', async (request: Request, response: Response, next: NextFunction) => {
      
    });
    this.router.post('/token/refresh', async (request: Request, response: Response, next: NextFunction) => {
    });
    this.router.post('/token/revoke', async (request: Request, response: Response, next: NextFunction) => {
    });
    this.router.post('/delete', async (request: Request, response: Response, next: NextFunction) => {
    });
    this.router.post('/change-password', async (request: Request, response: Response, next: NextFunction) => {
    });
    this.router.post('/change-password/request', async (request: Request, response: Response, next: NextFunction) => {
    });
    this.router.post('/change-password/change', async (request: Request, response: Response, next: NextFunction) => {
    });
    this.router.post('/mobile-verify/request', async (request: Request, response: Response, next: NextFunction) => {
    });
    this.router.post('/mobile-verify/verify', async (request: Request, response: Response, next: NextFunction) => {
    });
    
  }
}

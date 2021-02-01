import { Router, NextFunction, Request, Response } from 'express';
import { middleware as openApiValidator } from 'express-openapi-validator';
import { HttpError, JwtAuth, ObjectStore, PasswordHash, User } from "@tesseractcollective/serverless-toolbox";
import * as uuid from 'uuid';

export default class AdminRouter {
  readonly auth: JwtAuth;
  readonly router = Router();
  readonly allowedOrigins: string;

  constructor(auth: JwtAuth, allowedOrigins: string = '*') {
    this.auth = auth;
    this.setupRoutes();
    this.allowedOrigins = allowedOrigins;
  }

  setupRoutes() {
    // this.router.use(
    //   openApiValidator({ apiSpec: `${__dirname}/../docs/schema.yaml` })
    // );
    this.router.use((request: Request, response: Response, next: NextFunction) => {
      response.header('Access-Control-Allow-Origin', this.allowedOrigins);
      next();
    });
    
    this.router.get('/users/:id', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const id = request.params.id;
        const user = await this.auth.getUser(id);
        await this.fetchPasswordHashIfRequested(request, user);
        return response.json(user || null);
      } catch (error) {
        next(error);
      }
    });

    this.router.get('/user-by-email/:email', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const email = request.params.email;
        const user = await this.auth.getUserWithEmail(email);
        await this.fetchPasswordHashIfRequested(request, user);
        return response.json(user || null);
      } catch (error) {
        next(error);
      }
    });

    this.router.post('/users', async (request: Request, response: Response, next: NextFunction) => {
      try {
        console.log('body', JSON.stringify(request.body));
        const user = request.body;
        if (!user.email) {
          throw new HttpError(400, 'email required');
        }
        const existingUser = await this.auth.getUserWithEmail(user.email)
          .catch(() => {});
        if (existingUser) {
          throw new HttpError(400, 'user already exists');
        }
        const newUser: User = {
          id: uuid.v4(),
          email: user.email,
          emailVerified: false,
          mobile: undefined,
          mobileVerified: false,
          role: 'user',
          ...user,
        }
        console.log('user', JSON.stringify(newUser));
        await this.auth.putUser(newUser, this.getPasswordHashFromQueryString(request));
        response.json(newUser);
      } catch (error) {
        next(error);
      }
    });

    this.router.put('/users/:id', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const user = request.body;
        await this.auth.putUser(user, this.getPasswordHashFromQueryString(request));
        response.json(user);
      } catch (error) {
        next(error);
      }
    });

    this.router.delete('/users/:id', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const id = request.params.id;
        await this.auth.deleteUser(id);
        response.json({ id });
      } catch (error) {
        next(error);
      }
    });
  }

  async fetchPasswordHashIfRequested(request: Request, user?: User) {
    const addPasswordHash = request.query['passwordHash'];
    if (addPasswordHash === 'true' && user) {
      const passwordHash = await this.auth.getUserPasswordHash(user.id);
      user.passwordHash = passwordHash;
    }
  }

  getPasswordHashFromQueryString(request: Request): PasswordHash | undefined {
    const hash = request.query['hash'] as string;
    const salt = request.query['salt'] as string;
    if (hash && salt) {
      return { hash, salt }
    }
  }
}

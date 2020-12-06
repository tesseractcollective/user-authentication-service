import { Router, NextFunction, Request, Response } from 'express';
import {
  HttpError,
  log,
  JwtAuth
} from '@tesseractcollective/serverless-toolbox';
import {
  HasuraTriggerPayload,
  validateHasuraTriggerPayload,
  hasuraPayloadMatches,
} from '@tesseractcollective/hasura-toolbox';

export default class BaseRouter {
  private readonly jwtAuth: JwtAuth;
  readonly router = Router();

  constructor(jwtAuth: JwtAuth) {
    this.setupRoutes();
  }

  async handleEvent(payload: HasuraTriggerPayload): Promise<void> {
    try {
      validateHasuraTriggerPayload(payload);
    } catch (error) {
      return Promise.reject(new HttpError(400, error.message));
    }

    if (hasuraPayloadMatches(payload, 'DELETE', 'public', 'users')) {
      const user = payload.event.data.old;
      log.info(`deleting user ${user.email} ${user.id}`);
      await this.jwtAuth.deleteUser(user.email);
    } else {
      return Promise.reject(new HttpError(400, `unsupported ${payload.event.op} ${payload.table.schema} ${payload.table.name}`));
    }
  }

  setupRoutes() {
    this.router.post('/', async (request: Request, response: Response, next: NextFunction) => {
      try {
        const payload: HasuraTriggerPayload = request.body;
        await this.handleEvent(payload);
        response.json({ id: payload.id });
      } catch (error) {
        next(error);
      }
    });
  }
}

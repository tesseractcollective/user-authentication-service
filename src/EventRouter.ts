import { Router, NextFunction, Request, Response } from 'express';
import { UserPassword } from './JwtAuth';
import {
  HttpError,
  ObjectStore,
  log
} from '@tesseractcollective/serverless-toolbox';

import {
  HasuraTriggerPayload,
  validateHasuraTriggerPayload,
  hasuraPayloadMatches,
} from '@tesseractcollective/hasura-toolbox';


export default class BaseRouter {
  private readonly passwordStore: ObjectStore<UserPassword>;
  readonly router = Router();

  constructor(passwordStore: ObjectStore<UserPassword>) {
    this.passwordStore = passwordStore;
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
      const userPassword = await this.passwordStore.get(user.email);
      if (userPassword?.userId !== user.id) {
        throw new HttpError(400, `invalid persistedPassword ${JSON.stringify(userPassword)}`);
      }
      log.info(`deleting user ${user.email} ${user.id}`);
      await this.passwordStore.delete(user.email);
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

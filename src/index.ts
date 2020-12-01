import 'source-map-support/register';

import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import {
  ApiGatewayExpress,
  getEnvVar,
  log,
  DynamoDbObjectStore,
} from '@tesseractcollective/serverless-toolbox';

import EventRouter from './EventRouter';
import JwtAuth, { UserPassword } from './JwtAuth';
import AuthRouter from './AuthRouter';

// HasuraUserApi is only used if env vars are set
import HasuraUserApi from './HasuraUserApi';

const hasuraUrl = process.env['HASURA_URL'];
const hasuraAdminSecret = process.env['HASURA_ADMIN_SECRET'];
let api: HasuraUserApi | undefined;
if (hasuraUrl && hasuraAdminSecret) {
  api = new HasuraUserApi(hasuraUrl, hasuraAdminSecret);
}

const region = getEnvVar('REGION');
const jwtSecret = getEnvVar('JWT_SECRET');
const passwordTable = getEnvVar('PASSWORD_TABLE');

const passwordStore = new DynamoDbObjectStore<UserPassword>(passwordTable, region);
const auth = new JwtAuth(passwordStore, jwtSecret, 10, api);

const authRouter = new AuthRouter(auth);
const apiGatewayExpressAuth = new ApiGatewayExpress({ '(/dev)?/auth/': authRouter.router });

const eventRouter = new EventRouter(passwordStore);
const apiGatewayExpressEvent = new ApiGatewayExpress({ '(/dev)?/event/': eventRouter.router });

export function authHandler(event: APIGatewayProxyEvent, context: Context) {
  log.logApiGatewayEvent(event, { onlyWhenDebug: true });
  apiGatewayExpressAuth.handler(event, context);
}

export function eventHandler(event: APIGatewayProxyEvent, context: Context) {
  log.logApiGatewayEvent(event, { onlyWhenDebug: true });
  apiGatewayExpressEvent.handler(event, context);
}

import "source-map-support/register";

import { APIGatewayProxyEvent, Context } from "aws-lambda";
import {
  ApiGatewayExpress,
  getEnvVar,
  log,
  DynamoDbExpiringObjectStore,
  DynamoDbObjectStore,
  PasswordHash,
  JwtAuth,
  JwtConfiguration,
  JwtData,
  User,
  UserIdBox,
} from "@tesseractcollective/serverless-toolbox";

import EventRouter from "./EventRouter";
import AuthRouter from "./AuthRouter";
import OAuth2Router from "./oauth2/OAuth2Router";

// HasuraUserApi is only used if env vars are set
import HasuraUserApi from "./HasuraUserApi";

const hasuraUrl = process.env["HASURA_URL"];
const hasuraAdminSecret = process.env["HASURA_ADMIN_SECRET"];
let api: HasuraUserApi | undefined;
if (hasuraUrl && hasuraAdminSecret) {
  api = new HasuraUserApi(hasuraUrl, hasuraAdminSecret); // eslint-disable-line
}

const region = getEnvVar("REGION");
const jwtSecret = getEnvVar("JWT_SECRET");
const passwordTable = getEnvVar("PASSWORD_TABLE");
const userTable = getEnvVar("USER_TABLE");
const cacheTable = getEnvVar("CACHE_TABLE");

const passwordStore = new DynamoDbObjectStore<PasswordHash>(
  passwordTable,
  region
);
const expiringTicketStore = new DynamoDbExpiringObjectStore<any>(
  cacheTable,
  region
);
const emailMapStore = new DynamoDbObjectStore<UserIdBox>(cacheTable, region);
const userStore = new DynamoDbObjectStore<User>(userTable, region);
const jwtConfig: JwtConfiguration = (user: User): JwtData => {
  return {
    sub: user.id,
    iat: Date.now() / 1000,
  };
};
const auth = new JwtAuth(
  passwordStore,
  expiringTicketStore,
  emailMapStore,
  userStore,
  jwtSecret,
  jwtConfig
);

const authRouter = new AuthRouter(
  auth,
  "info@tesseractcollective.com",
  "Tesseract"
);
const apiGatewayExpressAuth = new ApiGatewayExpress({
  "(/dev)?/auth/": authRouter.router,
});

const eventRouter = new EventRouter(auth);
const apiGatewayExpressEvent = new ApiGatewayExpress({
  "(/dev)?/event/": eventRouter.router,
});

const oauthRouter = new OAuth2Router(auth);
const apiGatewayExpressOAuth = new ApiGatewayExpress({
  "(/dev)?/oauth/": oauthRouter.router,
});

export function authHandler(event: APIGatewayProxyEvent, context: Context) {
  log.logApiGatewayEvent(event, { onlyWhenDebug: true });
  apiGatewayExpressAuth.handler(event, context);
}

export function eventHandler(event: APIGatewayProxyEvent, context: Context) {
  log.logApiGatewayEvent(event, { onlyWhenDebug: true });
  apiGatewayExpressEvent.handler(event, context);
}

export function oauthHandler(event: APIGatewayProxyEvent, context: Context) {
  log.logApiGatewayEvent(event, { onlyWhenDebug: true });
  apiGatewayExpressOAuth.handler(event, context);
}

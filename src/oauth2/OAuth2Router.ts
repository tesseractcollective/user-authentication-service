import { json, urlencoded } from "body-parser";
import express, { Router } from "express";

import {
  handleExpressResponse,
  handleExpressError,
  responseFromExpress,
  requestFromExpress,
} from "@jmondi/oauth2-server/dist/adapters/express";

import {
  AuthorizationServer,
  DateInterval,
  JwtService,
} from "@jmondi/oauth2-server";
import UserAuthServiceOAuth2ClientRepository from "./repositories/ClientRepository";
import DynamoObjectDBStore from "@tesseractcollective/serverless-toolbox/dist/objectStore/DynamoDbObjectStore";
import Client from "./entities/Client";
import AuthCode from "./entities/AuthCode";
import UserAuthServiceOAuth2AuthCodeRepository from "./repositories/AuthCodeRepository";
import TokenRepository from "./repositories/TokenRepository";
import Token from "./entities/Token";
import ScopeRepository from "./repositories/ScopeRepository";
import Scope from "./entities/Scope";
import { UserRepository, UserStore } from "./repositories/UserRepository";
import { getEnvVar, JwtAuth } from "@tesseractcollective/serverless-toolbox";

const REGION = getEnvVar("REGION");
const CLIENT_TABLE = getEnvVar("CLIENT_TABLE");
const TOKEN_TABLE = getEnvVar("TOKEN_TABLE");
const AUTH_CODE_TABLE = getEnvVar("AUTH_CODE_TABLE");
const SCOPE_TABLE = getEnvVar("SCOPE_TABLE");
const JWT_SECRET = getEnvVar("JWT_SECRET");

export default class OAuth2Router {
  readonly router = Router();

  authorizationServer: AuthorizationServer;
  auth: JwtAuth;

  constructor(jwtAuth: JwtAuth) {
    this.auth = jwtAuth;

    const clientStore = new DynamoObjectDBStore<Client>(CLIENT_TABLE, REGION);

    const authCodeStore = new DynamoObjectDBStore<AuthCode>(
      AUTH_CODE_TABLE,
      REGION
    );

    const tokenStore = new DynamoObjectDBStore<Token>(TOKEN_TABLE, REGION);

    const scopeStore = new DynamoObjectDBStore<Scope>(SCOPE_TABLE, REGION);

    const userStore = new UserStore("user-table", REGION);

    const clientRepository = new UserAuthServiceOAuth2ClientRepository(
      clientStore
    );

    const authCodeRepository = new UserAuthServiceOAuth2AuthCodeRepository(
      authCodeStore
    );

    const accessTokenRepository = new TokenRepository(tokenStore);

    const scopeRepository = new ScopeRepository(scopeStore);

    const userRepository = new UserRepository(userStore);

    this.authorizationServer = new AuthorizationServer(
      authCodeRepository,
      clientRepository,
      accessTokenRepository,
      scopeRepository,
      userRepository,
      new JwtService(JWT_SECRET)
    );

    this.authorizationServer.enableGrantTypes(
      ["authorization_code", new DateInterval("15m")],
      "refresh_token"
    );
  }

  getIsAuthorizationApprovedFromSession() {
    return true;
  }

  setupRoutes() {
    this.router.use(json());
    this.router.use(urlencoded({ extended: false }));

    this.router.post(
      "/token",
      async (req: express.Request, res: express.Response) => {
        const request = requestFromExpress(req);
        const response = responseFromExpress(res);
        try {
          const oauthResponse =
            await this.authorizationServer.respondToAccessTokenRequest(
              request,
              response
            );
          return handleExpressResponse(res, oauthResponse);
        } catch (e) {
          handleExpressError(e, res);
          return;
        }
      }
    );

    this.router.get(
      "/authorize",
      async (req: express.Request, res: express.Response) => {
        const request = requestFromExpress(req);

        try {
          const authRequest =
            await this.authorizationServer.validateAuthorizationRequest(
              request
            );

          if (!req.user) {
            res.sendStatus(403);
            return;
          }
          // After login, the user should be redirected back with user in the session.
          // You will need to manage the authorization query on the round trip.
          // The auth request object can be serialized and saved into a user's session.

          // Once the user has logged in set the user on the AuthorizationRequest
          authRequest.user = req.user;

          // Once the user has approved or denied the client update the status
          // (true = approved, false = denied)
          authRequest.isAuthorizationApproved =
            this.getIsAuthorizationApprovedFromSession();

          // If the user has not approved the client's authorization request,
          // the user should be redirected to the approval screen.
          if (!authRequest.isAuthorizationApproved) {
            // This form will ask the user to approve the client and the scopes requested.
            // "Do you authorize Jason to: read contacts? write contacts?"
            res.redirect("/scopes");
            return;
          }

          // At this point the user has approved the client for authorization.
          // Any last authorization requests such as Two Factor Authentication (2FA) can happen here.

          // Redirect back to redirect_uri with `code` and `state` as url query params.
          const oauthResponse =
            await this.authorizationServer.completeAuthorizationRequest(
              authRequest
            );
          return handleExpressResponse(res, oauthResponse);
        } catch (e) {
          handleExpressError(e, res);
        }
      }
    );
  }
}

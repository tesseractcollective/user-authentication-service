import { Router, Request, Response } from "express";

import {
  handleExpressResponse,
  handleExpressError,
  responseFromExpress,
  requestFromExpress,
} from "@jmondi/oauth2-server/dist/adapters/express";

import { AuthorizationServer, DateInterval } from "@jmondi/oauth2-server";
import UserAuthServiceOAuth2ClientRepository from "./repositories/OAuth2ClientRepository";
import DynamoObjectDBStore from "@tesseractcollective/serverless-toolbox/dist/objectStore/DynamoDbObjectStore";
import Client from "./entities/Client";
import AuthCode from "./entities/AuthCode";
import UserAuthServiceOAuth2AuthCodeRepository from "./repositories/AuthCodeRepository";

export default class OAuth2Router {
  readonly router = Router();

  authorizationServer: AuthorizationServer;

  constructor() {
    const clientStore = new DynamoObjectDBStore<Client>(
      "oauth2_client_repository",
      "east-2"
    );

    const authCodeStore = new DynamoObjectDBStore<AuthCode>(
      "oauth2_auth_code_repository",
      "east-2"
    );

    const clientRepository = new UserAuthServiceOAuth2ClientRepository(
      clientStore
    );

    const authCodeRepository = new UserAuthServiceOAuth2AuthCodeRepository(
      authCodeStore
    );

    const accessTokenStore = new AccessTokenStore(
      "oauth2_access_token_repisotory",
      "east-2"
    );

    const accessTokenRepository =
      new UserAUthServiceOAuth2AccessTokenRepository(accessTokenStore);

    this.authorizationServer = new AuthorizationServer(
      authCodeRepository,
      clientRepository,
      accessTokenRepository,
      scopeRepository,
      userRepository,
      new JwtService("secret-key") // TODO: Replace this since we already have JWT Service.
    );

    this.authorizationServer.enableGrantTypes(
      ["authorization_code", new DateInterval("15m")],
      "refresh_token"
    );
  }

  setupRoutes() {
    this.router.post("/token", async (req: Request, res: Response) => {
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
        return false;
      }
    });
  }
}
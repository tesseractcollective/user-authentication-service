import {
  DateInterval,
  generateRandomToken,
  OAuthClient,
  OAuthScope,
  OAuthToken,
  OAuthTokenRepository,
  OAuthUser,
} from "@jmondi/oauth2-server";
import { ObjectStore } from "@tesseractcollective/serverless-toolbox";
import Token from "../entities/Token";

export default class TokenRepository implements OAuthTokenRepository {
  constructor(private readonly tokenStore: ObjectStore<Token>) {
    this.tokenStore = tokenStore;
  }

  async issueToken(
    client: OAuthClient,
    scopes: OAuthScope[],
    user?: OAuthUser | null
  ): Promise<Token> {
    const token = new Token();
    token.accessToken = generateRandomToken();
    token.accessTokenExpiresAt = new DateInterval("2h").getEndDate();
    token.client = client;
    token.user = user;
    token.scopes = [];
    scopes.forEach((scope) => token.scopes.push(scope));
    return token;
  }

  async issueRefreshToken(accessToken: Token): Promise<OAuthToken> {
    accessToken.refreshToken = generateRandomToken();
    accessToken.refreshTokenExpiresAt = new DateInterval("2h").getEndDate();
    return await this.tokenStore.put(accessToken.accessToken, accessToken);
  }

  async persist(accessToken: Token): Promise<void> {
    await this.tokenStore.put(accessToken.accessToken, accessToken);
  }

  async revoke(accessToken: Token): Promise<void> {
    accessToken.revoke();
    await this.tokenStore.put(accessToken.accessToken, accessToken);
  }

  async isRefreshTokenRevoked(refreshToken: Token): Promise<boolean> {
    return Date.now() > (refreshToken.refreshTokenExpiresAt?.getTime() ?? 0);
  }

  async getByRefreshToken(_refreshTokenToken: string): Promise<OAuthToken> {
    // TODO: query by refresh token value, find out how to do it.
    return new Token();
  }
}

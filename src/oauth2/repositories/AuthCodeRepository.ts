import {
  DateInterval,
  OAuthAuthCodeRepository,
  generateRandomToken,
  OAuthAuthCode,
  OAuthClient,
  OAuthScope,
  OAuthUser,
} from "@jmondi/oauth2-server";
import { ObjectStore } from "@tesseractcollective/serverless-toolbox";
import AuthCode from "../entities/AuthCode";

export default class AuthCodeRepository implements OAuthAuthCodeRepository {
  authCodeStore: ObjectStore<AuthCode>;

  constructor(authCodeStore: ObjectStore<AuthCode>) {
    this.authCodeStore = authCodeStore;
  }

  async getByIdentifier(authCodeCode: string): Promise<AuthCode> {
    const authCodeResult = await this.authCodeStore.get(authCodeCode);
    if (!authCodeResult) {
      throw new Error(`Unable to find auth code ${authCodeCode}`);
    }
    return authCodeResult;
  }

  issueAuthCode(
    client: OAuthClient,
    user: OAuthUser | undefined,
    scopes: OAuthScope[]
  ): OAuthAuthCode {
    const authCode = new AuthCode();
    authCode.code = generateRandomToken();
    authCode.expiresAt = new DateInterval("15m").getEndDate();
    authCode.client = client;
    authCode.user = user;
    authCode.scopes = [];
    scopes.forEach((scope) => authCode.scopes.push(scope));
    return authCode;
  }

  async persist(authCode: AuthCode): Promise<void> {
    await this.authCodeStore.put(authCode.code, authCode);
  }

  async isRevoked(authCodeCode: string): Promise<boolean> {
    const authCode = await this.getByIdentifier(authCodeCode);
    return authCode.isExpired;
  }

  async revoke(authCodeCode: string): Promise<void> {
    const authCode = await this.getByIdentifier(authCodeCode);
    authCode.revoke();
    await this.authCodeStore.put(authCode.code, authCode);
  }
}

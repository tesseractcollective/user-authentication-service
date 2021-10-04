import {
  CodeChallengeMethod,
  OAuthAuthCode,
  OAuthClient,
  OAuthScope,
  OAuthUser,
} from "@jmondi/oauth2-server";

export default class AuthCode implements OAuthAuthCode {
  code: string;
  redirectUri?: string | null | undefined;
  codeChallenge?: string | null | undefined;
  codeChallengeMethod?: CodeChallengeMethod | null | undefined;
  expiresAt: Date;
  user?: OAuthUser | null | undefined;
  client: OAuthClient;
  scopes: OAuthScope[];

  revoke() {
    this.expiresAt = new Date(0);
  }

  get isExpired(): boolean {
    console.log(new Date(), this.expiresAt);
    return new Date() > this.expiresAt;
  }
}

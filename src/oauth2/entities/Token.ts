import {
  OAuthClient,
  OAuthScope,
  OAuthToken,
  OAuthUser,
} from "@jmondi/oauth2-server";

export default class Token implements OAuthToken {
  accessToken: string;
  accessTokenExpiresAt: Date;
  refreshToken?: string | null | undefined;
  refreshTokenExpiresAt?: Date | null | undefined;
  client: OAuthClient;
  user?: OAuthUser | null | undefined;
  scopes: OAuthScope[];

  get isRevoked(): boolean {
    return Date.now() > this.accessTokenExpiresAt.getTime();
  }

  revoke(): void {
    this.accessTokenExpiresAt = new Date(0);
    this.refreshTokenExpiresAt = new Date(0);
  }
}

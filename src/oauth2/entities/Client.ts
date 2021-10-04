import {
  GrantIdentifier,
  OAuthClient,
  OAuthScope,
} from "@jmondi/oauth2-server";

export default class Client implements OAuthClient {
  id: string;

  name: string;

  secret?: string | null | undefined;

  redirectUris: string[];

  allowedGrants: GrantIdentifier[];

  scopes: OAuthScope[];
}

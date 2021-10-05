import { OAuthUser, OAuthUserIdentifier } from "@jmondi/oauth2-server";

export default class User implements OAuthUser {
  id: OAuthUserIdentifier;
  firstName: string;
  lastName: string;
  email: string;
}

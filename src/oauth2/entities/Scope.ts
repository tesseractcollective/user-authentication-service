import { OAuthScope } from "@jmondi/oauth2-server";

export default class Scope implements OAuthScope {
  name: string;

  description?: string;
}

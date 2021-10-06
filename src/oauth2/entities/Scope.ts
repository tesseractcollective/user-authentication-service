import { OAuthScope } from "@jmondi/oauth2-server";

export default class Scope implements OAuthScope {
  id: string;

  name: string;

  description?: string;
}

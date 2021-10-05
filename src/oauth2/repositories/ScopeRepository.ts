import {
  GrantIdentifier,
  OAuthClient,
  OAuthScope,
  OAuthScopeRepository,
  OAuthUserIdentifier,
} from "@jmondi/oauth2-server";
import { ObjectStore } from "@tesseractcollective/serverless-toolbox";

import Scope from "../entities/Scope";

export default class ScopeRepository implements OAuthScopeRepository {
  scopeStore: ObjectStore<Scope>;

  constructor(scopeStore: ObjectStore<Scope>) {
    this.scopeStore = scopeStore;
  }

  async getAllByIdentifiers(_scopeNames: string[]): Promise<Scope[]> {
    return [new Scope()]; // TODO: Implement query with DynamoDB
  }

  async finalize(
    scopes: Scope[],
    _identifier: GrantIdentifier,
    _client: OAuthClient,
    _user_id?: OAuthUserIdentifier
  ): Promise<OAuthScope[]> {
    return scopes;
  }
}

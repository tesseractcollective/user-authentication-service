import {
  ExtraAccessTokenFields,
  GrantIdentifier,
  OAuthClient,
  OAuthUser,
  OAuthUserIdentifier,
  OAuthUserRepository,
} from "@jmondi/oauth2-server";
import { ObjectStore } from "@tesseractcollective/serverless-toolbox";

import User from "../entities/User";

export class UserRepository implements OAuthUserRepository {
  userStore: ObjectStore<User>;

  constructor(userStore: ObjectStore<User>) {
    this.userStore = userStore;
  }

  async getUserByCredentials(
    identifier: OAuthUserIdentifier,
    _password?: string,
    _grantType?: GrantIdentifier,
    _client?: OAuthClient
  ): Promise<OAuthUser | undefined> {
    const user = await this.userStore.get(identifier.toString());
    // TODO: verity password and if user is allowed to use grant, etc...
    return user;
  }

  async extraAccessTokenFields(
    user: User
  ): Promise<ExtraAccessTokenFields | undefined> {
    return { mail: user.email, name: `${user.firstName} ${user.lastName}` };
  }
}

import { v4 as uuidv4 } from "uuid";
import {
  ExtraAccessTokenFields,
  GrantIdentifier,
  OAuthClient,
  OAuthUser,
  OAuthUserIdentifier,
  OAuthUserRepository,
} from "@jmondi/oauth2-server";
import { ObjectStore, User } from "@tesseractcollective/serverless-toolbox";

export class UserStore implements ObjectStore<User> {
  table: string;
  region: string;

  constructor(table: string, region: string) {
    this.table = table;
    this.region = region;
  }

  static mockedUsers: User[] = [
    {
      id: uuidv4(),
      email: "mock@mail.com",
      role: "admin",
      emailVerified: false,
      mobileVerified: false,
    },
    {
      id: uuidv4(),
      email: "mock2@mail.com",
      role: "admin",
      emailVerified: false,
      mobileVerified: false,
    },
    {
      id: uuidv4(),
      email: "mock3@mail.com",
      role: "user",
      emailVerified: false,
      mobileVerified: false,
    },
    {
      id: uuidv4(),
      email: "mock4@mail.com",
      role: "user",
      emailVerified: false,
      mobileVerified: false,
    },
  ];

  async get(id: string): Promise<User | undefined> {
    return UserStore.mockedUsers.find((user) => user.id === id);
  }

  async put(id: string, item: User): Promise<User> {
    const foundUserIndex = UserStore.mockedUsers.findIndex(
      (user) => user.id === id
    );
    if (foundUserIndex) {
      UserStore.mockedUsers[foundUserIndex] = item;
    }
    throw new Error(`User with id=${id} not found.`);
  }

  async delete(id: string): Promise<void> {
    const foundUserIndex = UserStore.mockedUsers.findIndex(
      (user) => user.id === id
    );
    if (foundUserIndex) {
      UserStore.mockedUsers.splice(foundUserIndex, 1);
    }
    throw new Error(`User with id=${id} not found`);
  }
}

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

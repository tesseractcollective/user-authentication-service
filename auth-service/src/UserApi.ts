import fetch from 'node-fetch';
import { HasuraApi, HasuraUserApi, HasuraUserBase } from './tools';

export interface User extends HasuraUserBase {
  id: string;
  email: string;
  role: string;
}

export default class UserApi implements HasuraUserApi<User> {
  private readonly hasuraApi: HasuraApi;
  constructor(url: string, token: string) {
    this.hasuraApi = new HasuraApi(fetch, url, token, true);
  }

  async createUserWithEmail(email: string): Promise<User> {
    const mutation = `mutation createUser($email: String) {
      insert_user_one(object: {email: $email}) {
        id
        email
      }
    }`;
    const payload = { query: mutation, variables: { email } };

    return this.hasuraApi.executeHasuraQuery(payload, 'insert_user_one');
  }

  async getUserById(id: string): Promise<User> {
    const query = `query getUser($id: uuid!) {
      user_by_pk(id:$id) {
        id
        email
      }
    }`;
    const payload = { query, variables: { id } };

    return this.hasuraApi.executeHasuraQuery(payload, 'user_by_pk');
  }
}

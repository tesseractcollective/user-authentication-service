import fetch from 'node-fetch';
import { HasuraApi, HasuraUserApi, HasuraUserBase } from '@tesseractcollective/hasura-toolbox';

export interface HasuraUser extends HasuraUserBase {
  id: string;
  email: string;
  role: string;
}

export default class UserApi implements HasuraUserApi<HasuraUser> {
  private readonly hasuraApi: HasuraApi;
  constructor(url: string, token: string) {
    this.hasuraApi = new HasuraApi(fetch, url, token, true);
  }

  async createUserWithEmail(email: string): Promise<HasuraUser> {
    const mutation = `mutation createUser($email: String) {
      insert_user_one(object: {email: $email}) {
        id
        email
      }
    }`;
    const payload = { query: mutation, variables: { email } };

    return this.hasuraApi.executeHasuraQuery(payload, 'insert_user_one');
  }

  async deleteUserById(id: string): Promise<HasuraUser> {
    const mutation = `mutation deleteUser($id: uuid!) {
      delete_user_by_pk(id: $id) {
        id
        email
      }
    }`
    const payload = { query: mutation, variables: { id } };

    return this.hasuraApi.executeHasuraQuery(payload, 'delete_user_by_pk');
  }

  async getUserById(id: string): Promise<HasuraUser> {
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

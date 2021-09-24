import fetch from 'node-fetch';
import { HasuraApi } from '@tesseractcollective/hasura-toolbox';
import { User } from '@tesseractcollective/serverless-toolbox';

export default class UserApi {
  private readonly hasuraApi: HasuraApi;
  constructor(url: string, token: string) {
    this.hasuraApi = new HasuraApi(fetch, url, token, true);
  }

  // TODO: upsert
  async createUser(user: User): Promise<User> {
    const mutation = `mutation createUser($id: uuid!, $email: String!, $role: userRoles_enum!, $mobile: String, $emailVerified: Boolean!, $mobileVerified: Boolean) {
      insert_userProfile_one(object: {id: $id, contactInfo: {primaryEmail: $email, mobilePhone: $mobile}, role: $role, emailVerified: $emailVerified, mobileVerified: $mobileVerified }) {
        id
      }
    }`;
    const payload = { query: mutation, variables: user };

    return this.hasuraApi.executeHasuraQuery(payload, 'insert_userProfile_one');
  }

  async updateUser(user: User): Promise<User> {
    const mutation = `mutation updateUser($id: String!, $email: String!, $role: String!, $mobile: String, $emailVerified: Boolean!, $mobileVerified: Boolean) {
      update_user(object: {id: $id, email: $email, role: $role, mobile: $mobile, emailVerified: $emailVerified, mobileVerified: $mobileVerified }) {
        id
      }
    }`;
    const payload = { query: mutation, variables: user };

    return this.hasuraApi.executeHasuraQuery(payload, 'updateuserProfile');
  }

  async deleteUserById(id: string): Promise<User> {
    const mutation = `mutation deleteUser($id: uuid!) {
      deleteuserProfile_by_pk(id: $id) {
        id
      }
    }`
    const payload = { query: mutation, variables: { id } };

    return this.hasuraApi.executeHasuraQuery(payload, 'deleteuserProfile_by_pk');
  }

  async getUserById(id: string): Promise<User> {
    const query = `query getUser($id: uuid!) {
      userProfile_by_pk(id:$id) {
        id
        email
        role
        mobile
        emailVerified
        mobileVerified
      }
    }`;
    const payload = { query, variables: { id } };

    return this.hasuraApi.executeHasuraQuery(payload, 'userProfile_by_pk');
  }
}

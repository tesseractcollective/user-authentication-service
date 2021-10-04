import {
  GrantIdentifier,
  OAuthClient,
  OAuthClientRepository,
} from "@jmondi/oauth2-server";
import { ObjectStore } from "@tesseractcollective/serverless-toolbox";

import Client from "../entities/Client";

export default class UserAuthServiceOAuth2ClientRepository
  implements OAuthClientRepository
{
  clientStore: ObjectStore<Client>;

  constructor(clientStore: ObjectStore<Client>) {
    this.clientStore = clientStore;
  }

  async isClientValid(
    grantType: GrantIdentifier,
    client: OAuthClient,
    clientSecret?: string
  ): Promise<boolean> {
    if (client.secret && client.secret !== clientSecret) {
      return false;
    }
    return client.allowedGrants.includes(grantType);
  }

  async getByIdentifier(clientId: string): Promise<OAuthClient> {
    const clientResult = await this.clientStore.get(clientId);
    if (!clientResult) {
      throw new Error(`Unable to find ${clientId}`); // TODO: Fix problem by using a different error.
    }
    return clientResult;
  }
}

import InvalidOAuth2RequestError from '../../InvalidRequestError';
import { OAuth2Client, OAuth2Request, OAuth2Server, GenerateTokenParams } from './oauth2_request';

export default abstract class BaseGrant {
  responseTypes: Set<string>;

  grantType: symbol;

  request: OAuth2Request;

  oauth2server: OAuth2Server;

  tokenEndpointAuthMethods: Set<string> = new Set(['client_secret_basic']);

  response_types: Set<string>;

  tokenEndpointHttpMethods: Set<string> = new Set(['POST']);

  tokenResponseHeaders = {  
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache'
  }

  checkAuthorizationEndpoint(request: OAuth2Request): boolean {
    return request.responseType in this.response_types;
  }

  validateAuthorizationRedirectUri(request: OAuth2Request, client: OAuth2Client): string {
    if (request.redirectUri) {
      if (!(client.checkRedirectUri(request.redirectUri))) {
        throw new InvalidOAuth2RequestError(`Unable to find redirect uri ${request.redirectUri} is not supported by the client`, request.state)
      }
      return request.redirectUri
    } else {
      const defaultRedirectUri = client.getDefaultRedirectUri();
      if (!defaultRedirectUri) {
        throw new InvalidOAuth2RequestError('Missing "redirect_uri" query parameter', request.state)
      }
      return defaultRedirectUri;
    }
  }

  checkTokenEndpoint(request: OAuth2Request): boolean {
    return (request.responseType in this.tokenEndpointHttpMethods) && (request.grantType === this.grantType);
  }



  generateToken(tokenParams: GenerateTokenParams): any {
    const { grantType, user, scope, expiresIn, includeRefreshToken } = tokenParams;
    let paramGrantType = grantType;
    if (!paramGrantType) {
      paramGrantType = this.grantType;
    }
    return this.oauth2server.generateToken(
      this.request.client,
      {
        user,
        scope,
        expiresIn,
        includeRefreshToken,
        grantType: paramGrantType,
      }
    );
  }

  authenticateTokenEndpointClient(): OAuth2Client {
    /**
     * Tries to authenticate the client with the endpoints for the token
     * client.
     * The tokend endpoint should be a secured endpoint, the client_id
     * somethines is used in the Authorization Basic.
     * */
    const client = this.oauth2server.authenticateClient(this.request, this.tokenEndpointAuthMethods);
    return client;
  }

  saveToken(token) {
    /* saves token to the database */
    this.oauth2server.saveToken(token, this.request);
  }

  validateRequestedScope() {
    const { scope } = this.request;
    const { state } = this.request;
    return this.oauth2server.validateRequestedScope(scope, state);
  }

  client(): OAuth2Client {
    return this.request.client;
  }

  abstract validateAuthorizationRequest();

  abstract validateTokenRequest();

  abstract createTokenResponse();

  abstract createAuthorizationResponse(redirectUri: string, grantUser: any): any;

  validateConsentRequest() {
    return this.validateAuthorizationRequest();
  }

}

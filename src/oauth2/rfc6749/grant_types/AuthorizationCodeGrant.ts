import {  createHash } from "crypto";
import { URL, URLSearchParams } from "url";

import InvalidClientError from "../../errors/InvalidClientError";
import UnauthorizedClientError from "../../errors/UnauthorizedClientError";
import InvalidOAuth2RequestError from "../../InvalidRequestError";
import BaseGrant from "./BaseGrant";
import { OAuth2AuthorizationCode, OAuth2Client, OAuth2Request, OAuth2Server } from "./oauth2_request";

function addQueryParamsToRedirectUri(redirectUri: string, queryParams): string {
  const redirectURL = new URL(redirectUri);
  const urlSearchParams = new URLSearchParams(queryParams);
  urlSearchParams.forEach((value, name) => {
    redirectURL.searchParams.set(name, value);
  });
  return redirectURL.href;
}

type GrantResponse = {
  statusCode: number,
  headers: Record<string, string>,
  token?: string
}

function codeChallengeBase64Encode(value: Buffer) {
  return value.toString('base64').replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function createS256CodeChallenge(codeVerifier: string) {
  const hashBuffer = createHash('sha256').update(codeVerifier).digest();
  return codeChallengeBase64Encode(hashBuffer);
}


function comparePlainCodeChallenge(codeVerifier: string, codeChallenge: string) {
  return codeVerifier === codeChallenge
}


function compareS256CodeChallenge(codeVerifier: string, codeChallenge: string) {
  return createS256CodeChallenge(codeVerifier) === codeChallenge;
}
    

const codeChallengeMethods = {
  plain: comparePlainCodeChallenge,
  'S256': compareS256CodeChallenge
}

export default class AuthorizationCodeGrant extends BaseGrant {
  responseTypes = new Set(['code']);

  grantType = Symbol('authorization_code');

  defaultChallengeMethod = 'S256'

  supportedCodeChallengeMethod = new Set(['plain', 'S256'])

  pkceRequired = false;
  defaultCodeChallengeMethod: any = 'S256';

  /**
   * The authorization code grant type is used to obtain both access tokens and
   * refresh tokens and is optimized for confidential clients.  Since this is a
   * redirection-based flow, the client must be capable of interacting with the
   * resource owner's user-agent (typically a web browser) and capable of
   * receiving incoming requests (via redirection) from the authorization server.
   *
   *  +----------+
   *  | Resource |
   *  |   Owner  |
   *  |          |
   *  +----------+
   *      ^
   *      |
   *      (B)
   *  +----|-----+          Client Identifier      +---------------+
   *  |         -+----(A)-- & Redirection URI ---->|               |
   *  |  User-   |                                 | Authorization |
   *  |  Agent  -+----(B)-- User authenticates --->|     Server    |
   *  |          |                                 |               |
   *  |         -+----(C)-- Authorization Code ---<|               |
   *  +-|----|---+                                 +---------------+
   *  |    |                                         ^      v
   *  (A)  (C)                                        |      |
   *  |    |                                         |      |
   *  ^    v                                         |      |
   *  +---------+                                      |      |
   *  |         |>---(D)-- Authorization Code ---------'      |
   *  |  Client |          & Redirection URI                  |
   *  |         |                                             |
   *  |         |<---(E)----- Access Token -------------------'
   *  +---------+       (w/ Optional Refresh Token)
   *
   *  Note: The lines illustrating steps (A), (B), and (C) are broken into
   *  two parts as they pass through the user-agent.
   * */
  constructor(request: OAuth2Request, oauth2Server: OAuth2Server, pkce = false) { // TODO: Define oauth2 server type.
    super();
    this.request = request;
    this.oauth2server = oauth2Server;
    this.pkceRequired = pkce;
  }


  validateAuthorizationRequest() {
    const request = this.request;
    const clientId = this.request.clientId;
    console.debug(`validating authorization request for ${clientId}`)

    if (!clientId) {
      throw new InvalidClientError("client_id not found in request", request.state)
    }

    const client = this.oauth2server.findClient(clientId)
    if (!client) {
      throw new InvalidClientError(`Unable to find given client_id=${clientId}`, request.state)
    }

    const redirectUri = this.validateAuthorizationRedirectUri(request, client);
    const responseType = this.request.responseType; 

    if (!client.checkResponseType(responseType)) {
      throw new UnauthorizedClientError(`The client is not authorized to use the response type ${responseType}`, request.state, redirectUri);
    }

    try {
      this.request.client = client;
      this.validateRequestedScope();
    } catch (error) {
      error.redirectUri = redirectUri;
      throw error;
    }

    this.validateCodeChallenge();
    this.validateCodeVerifier();

    return redirectUri;
  }


  validateCodeChallenge() {
    const request = this.request
    const challenge = request.data['code_challenge']
    const method = request.data['code_challenge_method']
    
    // guard, assume no pkce if no code challenge.
    if (!challenge && !method) {
      return
    }

    if (!challenge) {
      throw new InvalidOAuth2RequestError('Missing "code_challenge"', this.request.state);
    }
        
    if (method && this.supportedCodeChallengeMethod.has(method)) {
      throw new InvalidOAuth2RequestError('Unsupported "code_challenge_method"', this.request.state);
    }
  }

  createAuthorizationResponse(redirectUri: string, grantUser: any): GrantResponse {
    this.request.user = grantUser;

    const code = this.generateAuthorizationCode();
    this.saveAuthorizationCode(code);
    
    const qparams: any = { code: code };
    if (this.request.state) {
      qparams.state = this.request.state;
    } 
    const uri: string = addQueryParamsToRedirectUri(redirectUri, qparams);
    const headers = { 'Location': uri };

    return { statusCode: 302, headers: headers };
  }

  validateTokenRequest() {
    const client = this.authenticateTokenEndpointClient();
    if (!client.checkGrantType(this.grantType)) {
      throw new UnauthorizedClientError(`client is not authorization to use the grant type ${this.grantType}`, this.request.state, this.request.redirectUri);
    }

    const code = this.request.form['code'];

    if (!code) {
      throw new InvalidOAuth2RequestError('The code is not present in the request', this.request.state);
    }

    const authorizationCode = this.findAuthorizationCode(code, client);

    if (!authorizationCode) {
      throw new InvalidOAuth2RequestError("The code from the request is invalid.", this.request.state);
    }
    
    const redirectUri = this.request.redirectUri;
    const oldRequestUri = authorizationCode.getRedirectUri();

    if (oldRequestUri === redirectUri) {
      throw new InvalidOAuth2RequestError("Invalid redirect_uri parameter in request.", this.request.state);
    }

    this.request.client = client;
    this.request.credential = authorizationCode;
    
    this.validateCodeVerifier();

    return true;
  }

  validateCodeVerifier() {
    const request = this.request
    const verifier = this.request.form['code_verifier']

    // TODO: should we check for auth_method?
    if (this.pkceRequired && !verifier) {
      throw new InvalidOAuth2RequestError('Missing "code_verifier"', this.request.state);
    }

    const authorizationCode = request.credential;
    const challenge = authorizationCode.codeChallenge;
    
    // ignore, it is the normal RFC6749 authorization_code request
    if (!challenge && !verifier) {
      return;
    }

    if (!verifier) {
      throw new InvalidOAuth2RequestError('Missing "code_verifier"', this.request.state);
    }

    if (!this.codeVerifierIsValid(verifier)) {
      throw new InvalidOAuth2RequestError('Missing "code_verifier"', this.request.state);
    }

    // 4.6. Server Verifies code_verifier before Returning the Tokens
    let method = authorizationCode.codeChallengeMethod;
    if (!method) {
      method = this.defaultCodeChallengeMethod
    }

    const challengeFn = codeChallengeMethods[method]

    if (!challengeFn) {
      throw new Error(`Unable to find a method for ${method}`);
    }

    if (!challengeFn(verifier, challenge)) {
      throw new Error("Code challenge failed"); 
    }

    return true;
  }

  codeVerifierIsValid(verifier: string) {
    return verifier.match(/^[a-zA-Z0-9\-._~]{43,128}$/)
  }

  findAuthorizationCode(_code: any, _client: OAuth2Client): OAuth2AuthorizationCode {
    throw new Error("Method not implemented.");
  }
  
  createTokenResponse(): GrantResponse {
    const client = this.request.client;
    const authorizationCode = this.request.credential;

    const user = this.authenticateUser(authorizationCode);

    if (!user) {
      throw new InvalidOAuth2RequestError("Unable to find user", this.request.state);
    }

    this.request.user = user;

    const scope = authorizationCode.getScope();
    const token = this.generateToken({ user, scope, includeRefreshToken: client.checkGrantType('refresh_token') });

    this.saveToken(token);
    this.deleteAuthorizationCode(authorizationCode);

    return { statusCode: 200, token: token, headers: this.tokenResponseHeaders }
  }

  deleteAuthorizationCode(_authorizationCode: OAuth2AuthorizationCode) {
    throw new Error("Method not implemented.");
  }
  
  authenticateUser(_authorizationCode: OAuth2AuthorizationCode): any { // TODO: return an user
    throw new Error("Method not implemented.");
  }

  saveAuthorizationCode(_code: void) {
    throw new Error("Method not implemented.");
  }
  generateAuthorizationCode() {
    throw new Error("Method not implemented.");
  }
}

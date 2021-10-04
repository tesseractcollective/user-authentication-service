export type GenerateTokenParams = {
    user?: any, 
    scope?: any, 
    grantType?: any, 
    expiresIn?: any, 
    includeRefreshToken?: any
};

export interface OAuth2AuthorizationCode {
    getScope();
    getRedirectUri();
}

export interface OAuth2Client {
    checkGrantType(grantType: symbol);
    getDefaultRedirectUri(): string;
    checkRedirectUri(redirectUri: string);
}

export interface OAuth2Request {
    data: Record<string, any>;
    form: any;
    user: any;
    redirectUri: any;
    responseType: string;
    client: OAuth2Client;
    scope: any;
    state: string;
    grantType: symbol;
    clientId: string;
    credential: OAuth2AuthorizationCode;
}

export interface OAuth2Server {
    findClient(clientId: string);

    generateToken(
        client: OAuth2Client,
        tokenParams: GenerateTokenParams
    ): any;

    authenticateClient(
        request: OAuth2Request,
        tokendEndpointAuthMethods: Set<string>): OAuth2Client;

    saveToken(
        token,
        request: OAuth2Request): void;

    validateRequestedScope(scope, state);
}

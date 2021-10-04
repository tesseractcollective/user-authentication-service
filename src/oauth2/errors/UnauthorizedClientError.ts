import OAuth2Error from "./OAuth2Error";

export default class UnauthorizedClientError extends OAuth2Error {
    redirectUri: string;

    constructor(message, requestState, redirectUri) {
        super(message, requestState);
        this.redirectUri = redirectUri;
    }
    
}
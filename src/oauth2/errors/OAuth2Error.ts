export default class OAuth2Error extends Error {
    requestState: string;

    constructor(message: string, requestState: string) {
        super(message);
        this.requestState = requestState;
    }
}

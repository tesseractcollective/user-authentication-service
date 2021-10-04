export default class InvalidOAuth2RequestError extends Error {
    // identifier that helps guide between requests.
    requestState: string;

    constructor(message, requestState) {
        super(message);
        this.requestState = requestState;
    }
}
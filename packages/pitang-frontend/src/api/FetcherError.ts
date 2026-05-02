export default class FetcherError extends Error {
    info?: any;
    status?: number;

    constructor(message: string) {
        super(message);
        this.name = 'FetcherError';
    }
}
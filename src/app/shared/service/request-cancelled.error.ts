/** A deliberate cancellation is not a connection or analysis failure. */
export class RequestCancelledError extends Error {
  constructor() {
    super('Request cancelled');
    this.name = 'RequestCancelledError';
  }
}

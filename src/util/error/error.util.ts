export enum ErrorCodes {
  INVALID_OR_EXPIRED_TOKEN = 1,
  FAILED_EMAIL_SEND = 2,
}

export class CustomError extends Error {
  code: ErrorCodes;
  meta: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCodes,
    meta?: Record<string, unknown>
  ) {
    super(message);
    this.code = code;
    this.meta = meta || {};
  }
}

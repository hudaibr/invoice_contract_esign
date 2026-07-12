export class EsignError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "EsignError";
  }
}

export class TokenExpiredError extends EsignError {
  constructor() {
    super("Signing link has expired", "TOKEN_EXPIRED");
  }
}

export class TokenAlreadyUsedError extends EsignError {
  constructor() {
    super("Signing link has already been used", "TOKEN_USED");
  }
}

export class InvalidTokenError extends EsignError {
  constructor() {
    super("Invalid signing link", "INVALID_TOKEN");
  }
}

export class ContractCancelledError extends EsignError {
  constructor() {
    super("Contract has been cancelled", "CONTRACT_CANCELLED");
  }
}

export class AlreadySignedError extends EsignError {
  constructor() {
    super("Contract has already been signed", "ALREADY_SIGNED");
  }
}

export class InvalidStateTransitionError extends EsignError {
  constructor(from: string, to: string) {
    super(`Cannot transition from ${from} to ${to}`, "INVALID_STATE");
  }
}

export class StorageError extends EsignError {
  constructor(message: string) {
    super(`Storage error: ${message}`, "STORAGE_ERROR");
  }
}

export class EmailError extends EsignError {
  constructor(message: string) {
    super(`Email error: ${message}`, "EMAIL_ERROR");
  }
}

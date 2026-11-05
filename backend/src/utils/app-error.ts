export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  BAD_REQUEST = 'BAD_REQUEST',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN'
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCode.INTERNAL_SERVER_ERROR,
    details?: unknown
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message: string, code: ErrorCode = ErrorCode.BAD_REQUEST, details?: unknown) {
    return new AppError(message, 400, code, details);
  }

  static unauthenticated(message: string = 'Authentication required', details?: unknown) {
    return new AppError(message, 401, ErrorCode.UNAUTHENTICATED, details);
  }

  static forbidden(message: string = 'Access denied: insufficient permissions', details?: unknown) {
    return new AppError(message, 403, ErrorCode.FORBIDDEN, details);
  }

  static notFound(message: string = 'Resource not found', details?: unknown) {
    return new AppError(message, 404, ErrorCode.NOT_FOUND, details);
  }

  static conflict(message: string, details?: unknown) {
    return new AppError(message, 409, ErrorCode.CONFLICT, details);
  }

  static internal(message: string = 'An unexpected server error occurred', details?: unknown) {
    return new AppError(message, 500, ErrorCode.INTERNAL_SERVER_ERROR, details);
  }
}

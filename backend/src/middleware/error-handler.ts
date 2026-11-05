import { Request, Response, NextFunction } from 'express';
import { AppError, ErrorCode } from '../utils/app-error';
import { ApiResponse } from '../utils/api-response';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Operational errors created by the app
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ err, path: req.path, method: req.method }, err.message);
    } else {
      logger.warn({ path: req.path, method: req.method, code: err.code }, err.message);
    }

    ApiResponse.error(res, err.message, err.statusCode, err.code, err.details);
    return;
  }

  // Handle Prisma Known Request Errors
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaErr = err as any;
    if (prismaErr.code === 'P2002') {
      const target = (prismaErr.meta?.target as string[])?.join(', ') || 'field';
      ApiResponse.error(
        res,
        `A record with this ${target} already exists.`,
        409,
        ErrorCode.CONFLICT,
        prismaErr.meta
      );
      return;
    }
    if (prismaErr.code === 'P2025') {
      ApiResponse.error(res, 'Requested resource was not found.', 404, ErrorCode.NOT_FOUND);
      return;
    }
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    ApiResponse.error(res, 'Invalid authentication token.', 401, ErrorCode.INVALID_TOKEN);
    return;
  }
  if (err.name === 'TokenExpiredError') {
    ApiResponse.error(res, 'Authentication token has expired.', 401, ErrorCode.TOKEN_EXPIRED);
    return;
  }

  // Handle JSON syntax error
  if (err instanceof SyntaxError && 'body' in err) {
    ApiResponse.error(res, 'Malformed JSON in request payload.', 400, ErrorCode.BAD_REQUEST);
    return;
  }

  // Unexpected unhandled errors
  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        name: err.name
      },
      path: req.path,
      method: req.method
    },
    '🔥 Unhandled server error'
  );

  const message =
    env.NODE_ENV === 'production'
      ? 'An internal server error occurred.'
      : err.message || 'Internal server error';

  ApiResponse.error(
    res,
    message,
    500,
    ErrorCode.INTERNAL_SERVER_ERROR,
    env.NODE_ENV === 'development' ? { stack: err.stack } : undefined
  );
}

import { Request, Response } from 'express';
import { ApiResponse } from '../utils/api-response';
import { ErrorCode } from '../utils/app-error';

export function notFoundHandler(req: Request, res: Response): void {
  ApiResponse.error(
    res,
    `Cannot ${req.method} ${req.originalUrl}. Route not found on TeamFlow API.`,
    404,
    ErrorCode.NOT_FOUND
  );
}

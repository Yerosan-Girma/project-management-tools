import { Response } from 'express';
import { ErrorCode } from './app-error';

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    code: ErrorCode | string;
    details?: unknown;
  };
}

export class ApiResponse {
  static success<T>(
    res: Response,
    message: string = 'Operation completed successfully',
    data: T = {} as T,
    statusCode: number = 200,
    meta?: Record<string, unknown>
  ): Response {
    const payload: ApiSuccessResponse<T> = {
      success: true,
      message,
      data,
      ...(meta && { meta })
    };
    return res.status(statusCode).json(payload);
  }

  static created<T>(
    res: Response,
    message: string = 'Resource created successfully',
    data: T = {} as T,
    meta?: Record<string, unknown>
  ): Response {
    return ApiResponse.success(res, message, data, 201, meta);
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    code: ErrorCode | string = ErrorCode.INTERNAL_SERVER_ERROR,
    details?: unknown
  ): Response {
    const payload: ApiErrorResponse = {
      success: false,
      message,
      error: {
        code,
        details: details ?? []
      }
    };
    return res.status(statusCode).json(payload);
  }
}

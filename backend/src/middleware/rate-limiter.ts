import rateLimit from 'express-rate-limit';
import { ApiResponse } from '../utils/api-response';
import { ErrorCode } from '../utils/app-error';

// Standard rate limiter for all general API endpoints
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(
      res,
      'Too many requests from this IP. Please try again after 15 minutes.',
      429,
      ErrorCode.RATE_LIMIT_EXCEEDED
    );
  }
});

// Stricter rate limiter for authentication routes (login, register, forgot-password)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    ApiResponse.error(
      res,
      'Too many authentication attempts. Please try again after 15 minutes.',
      429,
      ErrorCode.RATE_LIMIT_EXCEEDED
    );
  }
});

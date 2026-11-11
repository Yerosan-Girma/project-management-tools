import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { AppError, ErrorCode } from '../utils/app-error';
import { AuthenticatedUser } from '../types/express';
import { UserStatus } from '../constants/status';

export interface JwtAccessTokenPayload {
  userId: string;
  email: string;
  role: string;
  sessionId?: string;
  iat?: number;
  exp?: number;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // Check Authorization header: Bearer <token>
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.accessToken) {
      // Fallback to HttpOnly cookie if present
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw AppError.unauthenticated('Authentication token missing. Please sign in.');
    }

    // Verify JWT
    let decoded: JwtAccessTokenPayload;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessTokenPayload;
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Access token has expired. Please refresh your session.', 401, ErrorCode.TOKEN_EXPIRED);
      }
      throw new AppError('Invalid access token.', 401, ErrorCode.INVALID_TOKEN);
    }

    const userId = decoded.userId || (decoded as any).id;
    if (!userId) {
      throw new AppError('Invalid access token payload.', 401, ErrorCode.INVALID_TOKEN);
    }

    // Check User in database
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        platformRole: true,
        status: true,
        emailVerifiedAt: true,
        deletedAt: true
      }
    });

    if (!user || user.deletedAt) {
      throw AppError.unauthenticated('User account no longer exists.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AppError('Account has been suspended. Please contact support.', 403, ErrorCode.FORBIDDEN);
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new AppError('Account is inactive.', 403, ErrorCode.FORBIDDEN);
    }

    const authUser: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.platformRole as any,
      emailVerifiedAt: user.emailVerifiedAt,
      sessionId: decoded.sessionId
    };

    req.user = authUser;
    next();
  } catch (error) {
    next(error);
  }
}

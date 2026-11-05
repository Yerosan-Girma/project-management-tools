import { Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { JwtAccessTokenPayload } from '../middleware/authenticate';
import { AuthenticatedUser } from '../types/express';
import { UserStatus } from '../constants/status';

export interface AuthenticatedSocket extends Socket {
  user?: AuthenticatedUser;
}

export async function socketAuthMiddleware(
  socket: AuthenticatedSocket,
  next: (err?: Error) => void
): Promise<void> {
  try {
    let token = socket.handshake.auth?.token;

    if (!token && socket.handshake.headers.authorization) {
      const parts = socket.handshake.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token && socket.handshake.query?.token) {
      token = socket.handshake.query.token as string;
    }

    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    let decoded: JwtAccessTokenPayload;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtAccessTokenPayload;
    } catch {
      return next(new Error('Authentication error: Invalid or expired token'));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
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

    if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
      return next(new Error('Authentication error: User inactive or not found'));
    }

    socket.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.platformRole as any,
      emailVerifiedAt: user.emailVerifiedAt
    };

    next();
  } catch (error: any) {
    next(new Error(`Authentication failed: ${error.message}`));
  }
}

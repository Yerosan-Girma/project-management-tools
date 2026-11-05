import crypto from 'crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { AuthRepository } from './auth.repository';
import { env } from '../../config/env';
import { AppError, ErrorCode } from '../../utils/app-error';
import { UserStatus } from '../../constants/status';
import { sendEmail } from '../../config/email';
import { logger } from '../../utils/logger';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
  ResetPasswordInput
} from './auth.schema';

export class AuthService {
  constructor(private readonly authRepo: AuthRepository = new AuthRepository()) {}

  // Hash password using Argon2id
  async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4
    });
  }

  // Verify password using Argon2id
  async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  // Hash arbitrary secret token (refresh token, reset token, verification token) using SHA-256
  hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Generate short-lived JWT access token
  generateAccessToken(user: { id: string; email: string; platformRole: string }, sessionId?: string): string {
    return jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.platformRole,
        sessionId
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as any }
    );
  }

  // Generate cryptographically random refresh token
  generateRawRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  // Register a new user
  async register(input: RegisterInput, ip?: string, userAgent?: string) {
    const existing = await this.authRepo.findUserByEmail(input.email);
    if (existing) {
      throw AppError.conflict('An account with this email address already exists.');
    }

    const passwordHash = await this.hashPassword(input.password);
    const user = await this.authRepo.createUser({
      name: input.name,
      email: input.email,
      passwordHash
    });

    // Create session & tokens
    const rawRefreshToken = this.generateRawRefreshToken();
    const tokenHash = this.hashToken(rawRefreshToken);
    const family = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const session = await this.authRepo.createRefreshToken({
      tokenHash,
      userId: user.id,
      family,
      expiresAt,
      ipAddress: ip,
      userAgent
    });

    const accessToken = this.generateAccessToken(user, session.id);

    // Create Email Verification Token
    const rawVerifyToken = crypto.randomBytes(32).toString('hex');
    await this.authRepo.createEmailVerificationToken({
      tokenHash: this.hashToken(rawVerifyToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    // Non-blocking email sending
    const verifyUrl = `${env.FRONTEND_URL}/verify-email?token=${rawVerifyToken}`;
    sendEmail({
      to: user.email,
      subject: 'Verify your TeamFlow account',
      html: `
        <h2>Welcome to TeamFlow, ${user.name}!</h2>
        <p>Please click the link below to verify your email address:</p>
        <p><a href="${verifyUrl}">${verifyUrl}</a></p>
        <p>This link expires in 24 hours.</p>
      `
    }).catch((err) => logger.warn(`Email send failed: ${err.message}`));

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        platformRole: user.platformRole,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt
      },
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresIn: env.ACCESS_TOKEN_EXPIRES_IN
      }
    };
  }

  // Login
  async login(input: LoginInput, ip?: string, userAgent?: string) {
    const user = await this.authRepo.findUserByEmail(input.email);
    if (!user) {
      throw AppError.unauthenticated('Invalid email or password.');
    }

    const isValidPassword = await this.verifyPassword(user.passwordHash, input.password);
    if (!isValidPassword) {
      throw AppError.unauthenticated('Invalid email or password.');
    }

    if (user.status === UserStatus.SUSPENDED) {
      throw new AppError('Your account has been suspended. Please contact support.', 403, ErrorCode.FORBIDDEN);
    }

    // Issue tokens
    const rawRefreshToken = this.generateRawRefreshToken();
    const tokenHash = this.hashToken(rawRefreshToken);
    const family = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const session = await this.authRepo.createRefreshToken({
      tokenHash,
      userId: user.id,
      family,
      expiresAt,
      ipAddress: ip,
      userAgent
    });

    const accessToken = this.generateAccessToken(user, session.id);

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        platformRole: user.platformRole,
        status: user.status,
        emailVerifiedAt: user.emailVerifiedAt,
        createdAt: user.createdAt
      },
      tokens: {
        accessToken,
        refreshToken: rawRefreshToken,
        expiresIn: env.ACCESS_TOKEN_EXPIRES_IN
      }
    };
  }

  // Refresh tokens with rotation and reuse detection
  async refreshTokens(rawRefreshToken: string, ip?: string, userAgent?: string) {
    if (!rawRefreshToken) {
      throw AppError.unauthenticated('Refresh token missing.');
    }

    const tokenHash = this.hashToken(rawRefreshToken);
    const existingToken = await this.authRepo.findRefreshTokenByHash(tokenHash);

    if (!existingToken) {
      throw new AppError('Invalid refresh token.', 401, ErrorCode.INVALID_TOKEN);
    }

    // Check if revoked: REUSE DETECTION!
    if (existingToken.isRevoked) {
      logger.warn(`⚠️ Revoked token reused for user ${existingToken.userId}! Revoking token family ${existingToken.family}`);
      await this.authRepo.revokeTokenFamily(existingToken.family);
      throw new AppError('Token compromise detected. Session revoked. Please log in again.', 403, ErrorCode.FORBIDDEN);
    }

    // Check expiration
    if (new Date() > existingToken.expiresAt) {
      await this.authRepo.revokeRefreshToken(existingToken.id);
      throw new AppError('Refresh token has expired. Please log in again.', 401, ErrorCode.TOKEN_EXPIRED);
    }

    const user = existingToken.user;
    if (user.status !== UserStatus.ACTIVE || user.deletedAt) {
      throw new AppError('Account is not active.', 403, ErrorCode.FORBIDDEN);
    }

    // Revoke old token
    await this.authRepo.revokeRefreshToken(existingToken.id);

    // Rotate: Issue new token in same family
    const nextRawRefreshToken = this.generateRawRefreshToken();
    const nextTokenHash = this.hashToken(nextRawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const newSession = await this.authRepo.createRefreshToken({
      tokenHash: nextTokenHash,
      userId: user.id,
      family: existingToken.family,
      expiresAt,
      ipAddress: ip,
      userAgent
    });

    const accessToken = this.generateAccessToken(user, newSession.id);

    return {
      tokens: {
        accessToken,
        refreshToken: nextRawRefreshToken,
        expiresIn: env.ACCESS_TOKEN_EXPIRES_IN
      }
    };
  }

  // Logout
  async logout(rawRefreshToken?: string, userId?: string) {
    if (rawRefreshToken) {
      const tokenHash = this.hashToken(rawRefreshToken);
      const token = await this.authRepo.findRefreshTokenByHash(tokenHash);
      if (token) {
        await this.authRepo.revokeRefreshToken(token.id);
      }
    } else if (userId) {
      await this.authRepo.revokeAllUserTokens(userId);
    }
    return true;
  }

  // Verify Email
  async verifyEmail(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    const tokenRecord = await this.authRepo.findEmailVerificationToken(tokenHash);

    if (!tokenRecord || tokenRecord.usedAt) {
      throw AppError.badRequest('Invalid or already used verification token.');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw AppError.badRequest('Verification token has expired.');
    }

    await this.authRepo.updateUser(tokenRecord.userId, {
      emailVerifiedAt: new Date()
    });

    await this.authRepo.markEmailVerificationTokenUsed(tokenRecord.id);

    return true;
  }

  // Forgot password
  async forgotPassword(input: ForgotPasswordInput) {
    const user = await this.authRepo.findUserByEmail(input.email);
    if (!user) {
      // Return success without revealing user existence
      return true;
    }

    const rawResetToken = crypto.randomBytes(32).toString('hex');
    await this.authRepo.createPasswordResetToken({
      tokenHash: this.hashToken(rawResetToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000) // 1 hour
    });

    const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${rawResetToken}`;
    sendEmail({
      to: user.email,
      subject: 'Reset your TeamFlow password',
      html: `
        <h2>Password Reset Request</h2>
        <p>Hello ${user.name},</p>
        <p>You requested to reset your password. Click the link below to set a new password:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link expires in 1 hour. If you did not request this, you can safely ignore this email.</p>
      `
    }).catch((err) => logger.warn(`Password reset email failed: ${err.message}`));

    return true;
  }

  // Reset password
  async resetPassword(input: ResetPasswordInput) {
    const tokenHash = this.hashToken(input.token);
    const tokenRecord = await this.authRepo.findPasswordResetToken(tokenHash);

    if (!tokenRecord || tokenRecord.usedAt) {
      throw AppError.badRequest('Invalid or already used reset token.');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw AppError.badRequest('Password reset token has expired.');
    }

    const passwordHash = await this.hashPassword(input.password);

    await this.authRepo.updateUser(tokenRecord.userId, {
      passwordHash
    });

    await this.authRepo.markPasswordResetTokenUsed(tokenRecord.id);

    // Invalidate all active sessions for security
    await this.authRepo.revokeAllUserTokens(tokenRecord.userId);

    return true;
  }

  // Get current user profile
  async getCurrentUserProfile(userId: string) {
    const user = await this.authRepo.findUserById(userId);
    if (!user) {
      throw AppError.notFound('User not found.');
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl,
      platformRole: user.platformRole,
      status: user.status,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  // List sessions
  async listSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.authRepo.listUserSessions(userId);
    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent || 'Unknown device',
      ipAddress: s.ipAddress || 'Unknown IP',
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: s.id === currentSessionId
    }));
  }

  // Revoke session
  async revokeSession(userId: string, sessionId: string) {
    const sessions = await this.authRepo.listUserSessions(userId);
    const target = sessions.find((s) => s.id === sessionId);
    if (!target) {
      throw AppError.notFound('Session not found or already revoked.');
    }

    await this.authRepo.revokeRefreshToken(target.id);
    return true;
  }
}

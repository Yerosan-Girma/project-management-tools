import { prisma } from '../../config/database';
import { User, RefreshToken, PasswordResetToken, EmailVerificationToken, UserStatus, PlatformRole } from '@prisma/client';

const DEMO_EMAIL_ALIASES: Record<string, string> = {
  'admin@teamflow.local': 'yerosan@teamflow.local',
  'admin@team.local': 'yerosan@teamflow.local',
  'yerosan@team.local': 'yerosan@teamflow.local',
  'yerosan.girma@teamflow.local': 'yerosan@teamflow.local',
  'yerosan.girma@team.local': 'yerosan@teamflow.local',
  'alice@teamflow.local': 'yoni@teamflow.local',
  'alice@team.local': 'yoni@teamflow.local',
  'yoni@team.local': 'yoni@teamflow.local',
  'yoni.tola@teamflow.local': 'yoni@teamflow.local',
  'yoni.tola@team.local': 'yoni@teamflow.local',
  'bob@teamflow.local': 'gemachu@teamflow.local',
  'bob@team.local': 'gemachu@teamflow.local',
  'gemachu@team.local': 'gemachu@teamflow.local',
  'charlie@teamflow.local': 'tesfaye@teamflow.local',
  'charlie@team.local': 'tesfaye@teamflow.local',
  'tesfaye@team.local': 'tesfaye@teamflow.local',
};

function resolveEmail(email: string): string {
  const clean = email.toLowerCase().trim();
  return DEMO_EMAIL_ALIASES[clean] || clean;
}

export class AuthRepository {
  async findUserByEmail(email: string): Promise<User | null> {
    const targetEmail = resolveEmail(email);
    return prisma.user.findFirst({
      where: {
        email: targetEmail,
        deletedAt: null
      }
    });
  }

  async findAnyUserByEmail(email: string): Promise<User | null> {
    const targetEmail = resolveEmail(email);
    return prisma.user.findUnique({
      where: {
        email: targetEmail
      }
    });
  }

  async findUserById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: {
        id,
        deletedAt: null
      }
    });
  }

  async createUser(data: {
    name: string;
    email: string;
    passwordHash: string;
    avatarUrl?: string;
  }): Promise<User> {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        avatarUrl: data.avatarUrl,
        platformRole: PlatformRole.USER,
        status: UserStatus.ACTIVE
      }
    });
  }

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  // Refresh Token operations
  async createRefreshToken(data: {
    tokenHash: string;
    userId: string;
    family: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data
    });
  }

  async findRefreshTokenByHash(tokenHash: string): Promise<(RefreshToken & { user: User }) | null> {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });
  }

  async revokeRefreshToken(id: string): Promise<RefreshToken> {
    return prisma.refreshToken.update({
      where: { id },
      data: { isRevoked: true, revokedAt: new Date() }
    });
  }

  async revokeTokenFamily(family: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { family },
      data: { isRevoked: true, revokedAt: new Date() }
    });
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { isRevoked: true, revokedAt: new Date() }
    });
  }

  async listUserSessions(userId: string): Promise<RefreshToken[]> {
    return prisma.refreshToken.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  // Verification & Reset Tokens
  async createEmailVerificationToken(data: {
    tokenHash: string;
    userId: string;
    expiresAt: Date;
  }): Promise<EmailVerificationToken> {
    return prisma.emailVerificationToken.create({
      data
    });
  }

  async findEmailVerificationToken(tokenHash: string): Promise<EmailVerificationToken | null> {
    return prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });
  }

  async markEmailVerificationTokenUsed(id: string): Promise<void> {
    await prisma.emailVerificationToken.update({
      where: { id },
      data: { usedAt: new Date() }
    });
  }

  async createPasswordResetToken(data: {
    tokenHash: string;
    userId: string;
    expiresAt: Date;
  }): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({
      data
    });
  }

  async findPasswordResetToken(tokenHash: string): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true }
    });
  }

  async markPasswordResetTokenUsed(id: string): Promise<void> {
    await prisma.passwordResetToken.update({
      where: { id },
      data: { usedAt: new Date() }
    });
  }
}

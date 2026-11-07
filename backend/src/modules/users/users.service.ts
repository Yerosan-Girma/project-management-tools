import argon2 from 'argon2';
import { prisma } from '../../config/database';
import { UsersRepository } from './users.repository';
import { AppError } from '../../utils/app-error';
import { PlatformRole } from '../../constants/roles';
import { UserStatus } from '../../constants/status';
import {
  UpdateProfileInput,
  ChangePasswordInput,
  UpdatePlatformRoleInput,
  UpdateUserStatusInput,
} from './users.schema';
import { authorizationService } from '../authorization/authorization.service';

export class UsersService {
  constructor(private readonly usersRepo: UsersRepository = new UsersRepository()) {}

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found.');
    }

    const updated = await this.usersRepo.update(userId, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      avatarUrl: updated.avatarUrl,
      platformRole: updated.platformRole,
      status: updated.status,
      emailVerifiedAt: updated.emailVerifiedAt,
      updatedAt: updated.updatedAt,
    };
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found.');
    }

    const validPassword = await argon2.verify(user.passwordHash, input.currentPassword);
    if (!validPassword) {
      throw AppError.badRequest('Current password provided is incorrect.');
    }

    const newHash = await argon2.hash(input.newPassword, {
      type: argon2.argon2id,
    });

    await this.usersRepo.update(userId, { passwordHash: newHash });
    return true;
  }

  async searchUsers(query: string, currentUserId: string) {
    return this.usersRepo.searchUsers(query, currentUserId);
  }

  // ==========================================================================
  // PLATFORM ADMIN USER MANAGEMENT
  // ==========================================================================

  async listPlatformUsers(params?: {
    search?: string;
    role?: PlatformRole;
    status?: UserStatus;
    skip?: number;
    take?: number;
  }) {
    return this.usersRepo.listPlatformUsers(params);
  }

  async getPlatformStats() {
    return this.usersRepo.getPlatformStats();
  }

  async getUserDetails(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        platformRole: true,
        status: true,
        emailVerifiedAt: true,
        createdAt: true,
        updatedAt: true,
        workspaceMemberships: {
          include: {
            workspace: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw AppError.notFound('User not found.');
    }

    return user;
  }

  async updatePlatformRole(
    operatorUserId: string,
    targetUserId: string,
    input: UpdatePlatformRoleInput
  ) {
    const targetUser = await this.usersRepo.findById(targetUserId);
    if (!targetUser) {
      throw AppError.notFound('Target user not found.');
    }

    if (targetUser.platformRole === input.platformRole) {
      return targetUser;
    }

    // Prevent demoting the last platform admin
    if (
      targetUser.platformRole === PlatformRole.PLATFORM_ADMIN &&
      input.platformRole === PlatformRole.USER
    ) {
      const adminCount = await prisma.user.count({
        where: {
          platformRole: PlatformRole.PLATFORM_ADMIN,
          deletedAt: null,
          status: UserStatus.ACTIVE,
        },
      });

      if (adminCount <= 1) {
        throw AppError.badRequest(
          'Cannot demote the last active Platform Administrator. At least one must remain.'
        );
      }
    }

    const previousRole = targetUser.platformRole;
    const updated = await this.usersRepo.update(targetUserId, {
      platformRole: input.platformRole as any,
    });

    // Record persistent audit log
    const actorWorkspace = await prisma.workspaceMember.findFirst({
      where: { userId: operatorUserId },
    });
    const fallbackWs = !actorWorkspace
      ? await prisma.workspace.findFirst({ select: { id: true } })
      : null;
    const wsId = actorWorkspace?.workspaceId || fallbackWs?.id;

    if (wsId) {
      await authorizationService.recordAuditLog({
        actorId: operatorUserId,
        workspaceId: wsId,
        resourceType: 'platform_user_role',
        resourceId: targetUserId,
        action: 'PLATFORM_ROLE_UPDATED',
        metadata: {
          previousRole,
          newRole: input.platformRole,
          targetEmail: targetUser.email,
        },
      });
    }

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      platformRole: updated.platformRole,
      status: updated.status,
    };
  }

  async updateUserStatus(
    operatorUserId: string,
    targetUserId: string,
    input: UpdateUserStatusInput
  ) {
    if (operatorUserId === targetUserId && input.status === UserStatus.SUSPENDED) {
      throw AppError.badRequest('You cannot suspend your own platform account.');
    }

    const targetUser = await this.usersRepo.findById(targetUserId);
    if (!targetUser) {
      throw AppError.notFound('Target user not found.');
    }

    const previousStatus = targetUser.status;
    const updated = await this.usersRepo.update(targetUserId, {
      status: input.status as any,
    });

    const actorWorkspace = await prisma.workspaceMember.findFirst({
      where: { userId: operatorUserId },
    });

    if (actorWorkspace) {
      await authorizationService.recordAuditLog({
        actorId: operatorUserId,
        workspaceId: actorWorkspace.workspaceId,
        resourceType: 'user_status',
        resourceId: targetUserId,
        action: 'USER_STATUS_UPDATED',
        metadata: {
          previousStatus,
          newStatus: input.status,
          targetEmail: targetUser.email,
        },
      });
    }

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      platformRole: updated.platformRole,
      status: updated.status,
    };
  }
}

import { WorkspacesRepository } from './workspaces.repository';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { WorkspaceRole, PlatformRole } from '../../constants/roles';
import {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  UpdateMemberRoleInput,
  TransferOwnershipInput,
} from './workspaces.schema';
import { authorizationService } from '../authorization/authorization.service';

export class WorkspacesService {
  constructor(private readonly workspacesRepo: WorkspacesRepository = new WorkspacesRepository()) {}

  private generateSlug(name: string): string {
    const baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${baseSlug || 'workspace'}-${randomSuffix}`;
  }

  async createWorkspace(userId: string, input: CreateWorkspaceInput) {
    const slug = this.generateSlug(input.name);
    const workspace = await this.workspacesRepo.createWorkspaceWithDefaults({
      name: input.name,
      slug,
      description: input.description,
      avatarUrl: input.avatarUrl,
      ownerId: userId,
    });

    await authorizationService.recordAuditLog({
      actorId: userId,
      workspaceId: workspace.id,
      resourceType: 'workspace',
      resourceId: workspace.id,
      action: 'WORKSPACE_CREATED',
      metadata: { name: workspace.name, slug: workspace.slug },
    });

    return workspace;
  }

  async listUserWorkspaces(userId: string) {
    const workspaces = await this.workspacesRepo.listUserWorkspaces(userId);
    return workspaces.map((ws) => ({
      id: ws.id,
      name: ws.name,
      slug: ws.slug,
      description: ws.description,
      avatarUrl: ws.avatarUrl,
      ownerId: ws.ownerId,
      isArchived: ws.isArchived,
      role: ws.members[0]?.role,
      joinedAt: ws.members[0]?.joinedAt,
      memberCount: ws._count.members,
      projectCount: ws._count.projects,
      createdAt: ws.createdAt,
      updatedAt: ws.updatedAt,
    }));
  }

  async getWorkspaceDetails(workspaceId: string, userId: string) {
    const workspace = await this.workspacesRepo.findById(workspaceId);
    if (!workspace) {
      throw AppError.notFound('Workspace not found.');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { platformRole: true },
    });
    const isPlatformAdmin = user?.platformRole === PlatformRole.PLATFORM_ADMIN;

    const currentMember = workspace.members.find((m) => m.userId === userId);
    if (!currentMember && !isPlatformAdmin) {
      throw AppError.forbidden('You do not belong to this workspace.');
    }

    const effectiveRole = currentMember?.role || (isPlatformAdmin ? WorkspaceRole.ADMIN : WorkspaceRole.GUEST);

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      avatarUrl: workspace.avatarUrl,
      ownerId: workspace.ownerId,
      isArchived: workspace.isArchived,
      currentUserRole: effectiveRole,
      members: workspace.members.map((m: any) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user,
      })),
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
    };
  }

  async updateWorkspace(workspaceId: string, input: UpdateWorkspaceInput, operatorUserId?: string) {
    const updated = await this.workspacesRepo.updateWorkspace(workspaceId, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl }),
    });

    if (operatorUserId) {
      await authorizationService.recordAuditLog({
        actorId: operatorUserId,
        workspaceId,
        resourceType: 'workspace',
        resourceId: workspaceId,
        action: 'WORKSPACE_UPDATED',
        metadata: input,
      });
    }

    return updated;
  }

  async archiveWorkspace(workspaceId: string, operatorUserId?: string) {
    const archived = await this.workspacesRepo.updateWorkspace(workspaceId, {
      isArchived: true,
    });

    if (operatorUserId) {
      await authorizationService.recordAuditLog({
        actorId: operatorUserId,
        workspaceId,
        resourceType: 'workspace',
        resourceId: workspaceId,
        action: 'WORKSPACE_ARCHIVED',
        metadata: { name: archived.name },
      });
    }

    return archived;
  }

  async listMembers(
    workspaceId: string,
    query?: string,
    role?: WorkspaceRole,
    skip: number = 0,
    take: number = 20
  ) {
    return this.workspacesRepo.listMembers(workspaceId, query, role, skip, take);
  }

  async updateMemberRole(
    workspaceId: string,
    targetUserId: string,
    input: UpdateMemberRoleInput,
    operatorUserId: string
  ) {
    const member = await this.workspacesRepo.findMember(workspaceId, targetUserId);
    if (!member) {
      throw AppError.notFound('Workspace member not found.');
    }

    // Resolve operator role
    const operatorMember = await this.workspacesRepo.findMember(workspaceId, operatorUserId);
    const operatorUser = await prisma.user.findUnique({ where: { id: operatorUserId } });
    const isPlatformAdmin = operatorUser?.platformRole === PlatformRole.PLATFORM_ADMIN;
    const operatorRole = operatorMember?.role as WorkspaceRole;

    authorizationService.canAssignWorkspaceRole({
      operatorUserId,
      operatorRole: operatorRole || WorkspaceRole.GUEST,
      targetUserId,
      targetCurrentRole: member.role as WorkspaceRole,
      requestedRole: input.role as WorkspaceRole,
      isPlatformAdmin,
    });

    const previousRole = member.role;
    const updated = await this.workspacesRepo.updateMemberRole(
      workspaceId,
      targetUserId,
      input.role as any
    );

    // Record Audit Log
    await authorizationService.recordAuditLog({
      actorId: operatorUserId,
      workspaceId,
      resourceType: 'workspace_member_role',
      resourceId: targetUserId,
      action: 'WORKSPACE_ROLE_UPDATED',
      metadata: {
        previousRole,
        newRole: input.role,
        targetUserId,
      },
    });

    return updated;
  }

  async removeMember(workspaceId: string, targetUserId: string, operatorUserId: string) {
    const member = await this.workspacesRepo.findMember(workspaceId, targetUserId);
    if (!member) {
      throw AppError.notFound('Workspace member not found.');
    }

    // Resolve operator role
    const operatorMember = await this.workspacesRepo.findMember(workspaceId, operatorUserId);
    const operatorUser = await prisma.user.findUnique({ where: { id: operatorUserId } });
    const isPlatformAdmin = operatorUser?.platformRole === PlatformRole.PLATFORM_ADMIN;
    const operatorRole = operatorMember?.role as WorkspaceRole;

    authorizationService.canRemoveWorkspaceMember({
      operatorUserId,
      operatorRole: operatorRole || WorkspaceRole.GUEST,
      targetUserId,
      targetRole: member.role as WorkspaceRole,
      isPlatformAdmin,
    });

    await this.workspacesRepo.removeMember(workspaceId, targetUserId);

    // Record Audit Log
    await authorizationService.recordAuditLog({
      actorId: operatorUserId,
      workspaceId,
      resourceType: 'workspace_member',
      resourceId: targetUserId,
      action: 'WORKSPACE_MEMBER_REMOVED',
      metadata: {
        removedUserId: targetUserId,
        previousRole: member.role,
      },
    });

    return true;
  }

  async transferOwnership(
    workspaceId: string,
    currentOwnerId: string,
    input: TransferOwnershipInput
  ) {
    const workspace = await this.workspacesRepo.findById(workspaceId);
    if (!workspace) {
      throw AppError.notFound('Workspace not found.');
    }

    if (workspace.ownerId !== currentOwnerId) {
      throw AppError.forbidden('Only the current workspace owner can transfer ownership.');
    }

    if (currentOwnerId === input.newOwnerUserId) {
      throw AppError.badRequest('You are already the owner of this workspace.');
    }

    const newOwnerMember = await this.workspacesRepo.findMember(workspaceId, input.newOwnerUserId);
    if (!newOwnerMember) {
      throw AppError.badRequest('The target user must already be a member of the workspace.');
    }

    await this.workspacesRepo.transferOwnership(workspaceId, currentOwnerId, input.newOwnerUserId);

    // Record Audit Log
    await authorizationService.recordAuditLog({
      actorId: currentOwnerId,
      workspaceId,
      resourceType: 'workspace_ownership',
      resourceId: workspaceId,
      action: 'OWNERSHIP_TRANSFERRED',
      metadata: {
        previousOwnerId: currentOwnerId,
        newOwnerId: input.newOwnerUserId,
      },
    });

    return true;
  }
}

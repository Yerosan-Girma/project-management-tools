import { WorkspacesRepository } from './workspaces.repository';
import { AppError } from '../../utils/app-error';
import { WorkspaceRole } from '../../constants/roles';
import {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  UpdateMemberRoleInput,
  TransferOwnershipInput
} from './workspaces.schema';

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
    return this.workspacesRepo.createWorkspaceWithDefaults({
      name: input.name,
      slug,
      description: input.description,
      avatarUrl: input.avatarUrl,
      ownerId: userId
    });
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
      updatedAt: ws.updatedAt
    }));
  }

  async getWorkspaceDetails(workspaceId: string, userId: string) {
    const workspace = await this.workspacesRepo.findById(workspaceId);
    if (!workspace) {
      throw AppError.notFound('Workspace not found.');
    }

    const currentMember = workspace.members.find((m) => m.userId === userId);
    if (!currentMember) {
      throw AppError.forbidden('You do not belong to this workspace.');
    }

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      avatarUrl: workspace.avatarUrl,
      ownerId: workspace.ownerId,
      isArchived: workspace.isArchived,
      currentUserRole: currentMember.role,
      members: workspace.members.map((m: any) => ({
        id: m.id,
        userId: m.userId,
        role: m.role,
        joinedAt: m.joinedAt,
        user: m.user
      })),
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    };
  }

  async updateWorkspace(workspaceId: string, input: UpdateWorkspaceInput) {
    return this.workspacesRepo.updateWorkspace(workspaceId, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl })
    });
  }

  async archiveWorkspace(workspaceId: string) {
    return this.workspacesRepo.updateWorkspace(workspaceId, {
      isArchived: true
    });
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

    if (member.role === WorkspaceRole.OWNER) {
      throw AppError.badRequest('Cannot change the role of the workspace OWNER. Use transfer ownership instead.');
    }

    return this.workspacesRepo.updateMemberRole(workspaceId, targetUserId, input.role as any);
  }

  async removeMember(workspaceId: string, targetUserId: string, operatorUserId: string) {
    const member = await this.workspacesRepo.findMember(workspaceId, targetUserId);
    if (!member) {
      throw AppError.notFound('Workspace member not found.');
    }

    if (member.role === WorkspaceRole.OWNER) {
      throw AppError.badRequest('Cannot remove the workspace OWNER from the workspace.');
    }

    await this.workspacesRepo.removeMember(workspaceId, targetUserId);
    return true;
  }

  async transferOwnership(workspaceId: string, currentOwnerId: string, input: TransferOwnershipInput) {
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
    return true;
  }
}

import { prisma } from '../../config/database';
import { PlatformRole, WorkspaceRole, ProjectRole } from '../../constants/roles';
import {
  PlatformPermission,
  WorkspacePermission,
  ProjectPermission,
  TaskPermission,
} from './permissions';
import {
  PLATFORM_ROLE_PERMISSIONS,
  WORKSPACE_ROLE_PERMISSIONS,
  PROJECT_ROLE_PERMISSIONS,
} from './roles-permissions.map';
import { AppError } from '../../utils/app-error';
import { logger } from '../../utils/logger';

export interface AuditLogInput {
  actorId: string;
  workspaceId: string;
  projectId?: string | null;
  resourceType: string;
  resourceId: string;
  action: string;
  metadata?: Record<string, any>;
}

export class AuthorizationService {
  // ==========================================================================
  // 1. AUDIT LOGGING HELPER
  // ==========================================================================
  async recordAuditLog(input: AuditLogInput): Promise<void> {
    try {
      await prisma.activityLog.create({
        data: {
          actorId: input.actorId,
          workspaceId: input.workspaceId,
          projectId: input.projectId || null,
          resourceType: input.resourceType,
          resourceId: input.resourceId,
          action: input.action,
          metadata: input.metadata || {},
        },
      });
    } catch (err: any) {
      logger.error({ input }, `Failed to record audit log: ${err.message}`);
    }
  }

  // ==========================================================================
  // 2. PLATFORM PERMISSION CHECKS
  // ==========================================================================
  hasPlatformPermission(
    userPlatformRole: PlatformRole | string,
    permission: PlatformPermission
  ): boolean {
    if (userPlatformRole === PlatformRole.PLATFORM_ADMIN) {
      return (PLATFORM_ROLE_PERMISSIONS[PlatformRole.PLATFORM_ADMIN] as readonly string[]).includes(
        permission
      );
    }
    return false;
  }

  // ==========================================================================
  // 3. WORKSPACE PERMISSION CHECKS
  // ==========================================================================
  async getWorkspaceMember(
    userId: string,
    workspaceId: string
  ) {
    return prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId },
      },
      include: {
        workspace: {
          select: {
            id: true,
            name: true,
            ownerId: true,
            isArchived: true,
            deletedAt: true,
          },
        },
      },
    });
  }

  async hasWorkspacePermission(
    userId: string,
    workspaceId: string,
    permission: WorkspacePermission,
    isPlatformAdmin = false
  ): Promise<{ allowed: boolean; role?: WorkspaceRole; reason?: string }> {
    if (isPlatformAdmin) {
      return { allowed: true, role: WorkspaceRole.OWNER };
    }

    const member = await this.getWorkspaceMember(userId, workspaceId);
    if (!member || member.workspace.deletedAt) {
      return { allowed: false, reason: 'You do not belong to this workspace.' };
    }

    if (member.workspace.isArchived && permission !== 'workspace:read') {
      return { allowed: false, reason: 'This workspace is archived. Modifications are forbidden.' };
    }

    const role = member.role as WorkspaceRole;
    const permissions = WORKSPACE_ROLE_PERMISSIONS[role] || [];
    const allowed = (permissions as readonly string[]).includes(permission);

    return {
      allowed,
      role,
      reason: allowed ? undefined : `Role '${role}' lacks permission '${permission}' in this workspace.`,
    };
  }

  // ==========================================================================
  // 4. PROJECT PERMISSION CHECKS
  // ==========================================================================
  async getProjectContext(userId: string, projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        workspace: {
          include: {
            members: {
              where: { userId },
            },
          },
        },
        members: {
          where: { userId },
        },
      },
    });

    if (!project || project.deletedAt || project.workspace.deletedAt) {
      return null;
    }

    const wsMember = project.workspace.members[0] || null;
    const projMember = project.members[0] || null;

    return { project, wsMember, projMember };
  }

  async hasProjectPermission(
    userId: string,
    projectId: string,
    permission: ProjectPermission | TaskPermission,
    isPlatformAdmin = false
  ): Promise<{
    allowed: boolean;
    effectiveRole?: ProjectRole;
    workspaceId?: string;
    reason?: string;
  }> {
    if (isPlatformAdmin) {
      return { allowed: true, effectiveRole: ProjectRole.MANAGER };
    }

    const context = await this.getProjectContext(userId, projectId);
    if (!context) {
      return { allowed: false, reason: 'Project not found or inaccessible.' };
    }

    const { project, wsMember, projMember } = context;

    // User must belong to the parent workspace
    if (!wsMember) {
      return { allowed: false, reason: 'You do not belong to the workspace containing this project.' };
    }

    // Role inheritance: Workspace OWNER or ADMIN has implicit MANAGER rights in all workspace projects
    let effectiveRole: ProjectRole;
    if (wsMember.role === WorkspaceRole.OWNER || wsMember.role === WorkspaceRole.ADMIN) {
      effectiveRole = ProjectRole.MANAGER;
    } else if (projMember) {
      effectiveRole = projMember.role as ProjectRole;
    } else if (wsMember.role === WorkspaceRole.MEMBER) {
      effectiveRole = ProjectRole.MEMBER;
    } else {
      return { allowed: false, reason: 'You are not a member of this project.' };
    }

    const permissions = PROJECT_ROLE_PERMISSIONS[effectiveRole] || [];
    const allowed = (permissions as readonly string[]).includes(permission);

    return {
      allowed,
      effectiveRole,
      workspaceId: project.workspaceId,
      reason: allowed
        ? undefined
        : `Project role '${effectiveRole}' lacks permission '${permission}'.`,
    };
  }

  // ==========================================================================
  // 5. TASK & RESOURCE LEVEL CHECKS
  // ==========================================================================
  async hasTaskPermission(
    userId: string,
    taskId: string,
    permission: TaskPermission,
    isPlatformAdmin = false
  ): Promise<{
    allowed: boolean;
    task?: any;
    effectiveRole?: ProjectRole;
    reason?: string;
  }> {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            workspace: {
              include: {
                members: { where: { userId } },
              },
            },
            members: { where: { userId } },
          },
        },
        assignees: { select: { userId: true } },
      },
    });

    if (!task || task.deletedAt || task.project.deletedAt) {
      return { allowed: false, reason: 'Task not found or inaccessible.' };
    }

    if (isPlatformAdmin) {
      return { allowed: true, task, effectiveRole: ProjectRole.MANAGER };
    }

    const wsMember = task.project.workspace.members[0] || null;
    const projMember = task.project.members[0] || null;

    if (!wsMember) {
      return { allowed: false, reason: 'You do not belong to the workspace containing this task.' };
    }

    let effectiveRole: ProjectRole;
    if (wsMember.role === WorkspaceRole.OWNER || wsMember.role === WorkspaceRole.ADMIN) {
      effectiveRole = ProjectRole.MANAGER;
    } else if (projMember) {
      effectiveRole = projMember.role as ProjectRole;
    } else if (wsMember.role === WorkspaceRole.MEMBER) {
      effectiveRole = ProjectRole.MEMBER;
    } else {
      return { allowed: false, reason: 'You are not a member of the project containing this task.' };
    }

    const permissions = PROJECT_ROLE_PERMISSIONS[effectiveRole] || [];
    const allowed = (permissions as readonly string[]).includes(permission);

    return {
      allowed,
      task,
      effectiveRole,
      reason: allowed
        ? undefined
        : `Project role '${effectiveRole}' lacks permission '${permission}' on this task.`,
    };
  }

  // ==========================================================================
  // 6. ROLE ESCALATION & HIERARCHY GUARDRAILS
  // ==========================================================================

  /**
   * Validate workspace role modification to prevent privilege escalation.
   */
  canAssignWorkspaceRole(params: {
    operatorUserId: string;
    operatorRole: WorkspaceRole;
    targetUserId: string;
    targetCurrentRole: WorkspaceRole;
    requestedRole: WorkspaceRole;
    isPlatformAdmin?: boolean;
  }): void {
    const {
      operatorUserId,
      operatorRole,
      targetUserId,
      targetCurrentRole,
      requestedRole,
      isPlatformAdmin = false,
    } = params;

    if (isPlatformAdmin) return;

    // Self-modification rule: members cannot change their own role
    if (operatorUserId === targetUserId) {
      throw AppError.forbidden('You cannot change your own workspace role.');
    }

    // Target cannot be the OWNER
    if (targetCurrentRole === WorkspaceRole.OWNER) {
      throw AppError.badRequest(
        'Cannot modify the role of the workspace OWNER. Use ownership transfer instead.'
      );
    }

    // Requested role cannot be OWNER
    if (requestedRole === WorkspaceRole.OWNER) {
      throw AppError.badRequest(
        'Cannot assign OWNER role via role update. Use ownership transfer instead.'
      );
    }

    // Only OWNER can assign or modify ADMIN roles
    if (operatorRole === WorkspaceRole.ADMIN) {
      if (targetCurrentRole === WorkspaceRole.ADMIN) {
        throw AppError.forbidden('Workspace Admins cannot modify another Admin.');
      }
      if (requestedRole === WorkspaceRole.ADMIN) {
        throw AppError.forbidden('Only the workspace Owner can promote a member to Admin.');
      }
    }

    // Members and guests cannot modify roles
    if (operatorRole === WorkspaceRole.MEMBER || operatorRole === WorkspaceRole.GUEST) {
      throw AppError.forbidden('You do not have permission to manage workspace roles.');
    }
  }

  /**
   * Validate workspace member removal.
   */
  canRemoveWorkspaceMember(params: {
    operatorUserId: string;
    operatorRole: WorkspaceRole;
    targetUserId: string;
    targetRole: WorkspaceRole;
    isPlatformAdmin?: boolean;
  }): void {
    const { operatorUserId, operatorRole, targetUserId, targetRole, isPlatformAdmin = false } = params;

    if (isPlatformAdmin) return;

    // Cannot remove the workspace OWNER
    if (targetRole === WorkspaceRole.OWNER) {
      throw AppError.badRequest('Cannot remove the workspace OWNER from the workspace.');
    }

    // Cannot remove self via member deletion endpoint (must use leave workspace)
    if (operatorUserId === targetUserId) {
      throw AppError.badRequest('Cannot remove yourself using this action.');
    }

    // Admins cannot remove other Admins or Owners
    if (operatorRole === WorkspaceRole.ADMIN && targetRole === WorkspaceRole.ADMIN) {
      throw AppError.forbidden('Workspace Admins cannot remove another Admin. Only the Owner can.');
    }

    // Members and guests cannot remove members
    if (operatorRole === WorkspaceRole.MEMBER || operatorRole === WorkspaceRole.GUEST) {
      throw AppError.forbidden('You do not have permission to remove workspace members.');
    }
  }

  /**
   * Validate workspace invitation creation roles.
   */
  canInviteWithRole(params: {
    operatorRole: WorkspaceRole;
    invitedRole: WorkspaceRole;
    isPlatformAdmin?: boolean;
  }): void {
    const { operatorRole, invitedRole, isPlatformAdmin = false } = params;

    if (isPlatformAdmin) return;

    // Never allow inviting as OWNER
    if (invitedRole === WorkspaceRole.OWNER) {
      throw AppError.badRequest('Cannot invite a user as workspace OWNER.');
    }

    // Only OWNER can invite as ADMIN
    if (operatorRole === WorkspaceRole.ADMIN && invitedRole === WorkspaceRole.ADMIN) {
      throw AppError.forbidden(
        'Workspace Admins cannot invite new Admins. Only the workspace Owner can invite an Admin.'
      );
    }

    // Members and guests cannot invite
    if (operatorRole === WorkspaceRole.MEMBER || operatorRole === WorkspaceRole.GUEST) {
      throw AppError.forbidden('You do not have permission to invite members to this workspace.');
    }
  }

  /**
   * Validate project member role changes.
   */
  canAssignProjectRole(params: {
    operatorRole: ProjectRole;
    operatorUserId: string;
    targetUserId: string;
    targetCurrentRole?: ProjectRole;
    isPlatformAdmin?: boolean;
  }): void {
    const { operatorRole, operatorUserId, targetUserId, isPlatformAdmin = false } = params;

    if (isPlatformAdmin) return;

    if (operatorUserId === targetUserId) {
      throw AppError.forbidden('You cannot change your own project role.');
    }

    if (operatorRole !== ProjectRole.MANAGER) {
      throw AppError.forbidden('Only Project Managers can assign or change project roles.');
    }
  }
}

export const authorizationService = new AuthorizationService();

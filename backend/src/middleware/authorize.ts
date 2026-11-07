import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError, ErrorCode } from '../utils/app-error';
import {
  PlatformRole,
  WorkspaceRole,
  ProjectRole,
  WorkspaceRoleRank,
  ProjectRoleRank,
} from '../constants/roles';
import {
  PlatformPermission,
  WorkspacePermission,
  ProjectPermission,
  TaskPermission,
} from '../modules/authorization/permissions';
import { authorizationService } from '../modules/authorization/authorization.service';

// ============================================================================
// 1. PLATFORM LEVEL AUTHORIZATION
// ============================================================================

/**
 * Restrict endpoint to specific platform roles (e.g. PLATFORM_ADMIN).
 */
export function requirePlatformRole(...allowedRoles: PlatformRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthenticated());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new AppError(
          'Access forbidden: insufficient platform permissions.',
          403,
          ErrorCode.FORBIDDEN
        )
      );
    }

    next();
  };
}

/**
 * Restrict endpoint using fine-grained Platform Permissions (PBAC).
 */
export function requirePlatformPermission(permission: PlatformPermission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthenticated());
    }

    const hasPermission = authorizationService.hasPlatformPermission(req.user.role, permission);
    if (!hasPermission) {
      return next(
        new AppError(
          `Access forbidden: requires platform permission '${permission}'.`,
          403,
          ErrorCode.FORBIDDEN
        )
      );
    }

    next();
  };
}

// ============================================================================
// 2. WORKSPACE LEVEL AUTHORIZATION
// ============================================================================

/**
 * RBAC: Check workspace-level membership and role hierarchy.
 */
export function requireWorkspaceRole(minRole: WorkspaceRole = WorkspaceRole.GUEST) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(AppError.unauthenticated());
      }

      const workspaceId =
        req.params.workspaceId ||
        req.body.workspaceId ||
        (req.query.workspaceId as string);

      if (!workspaceId) {
        return next(AppError.badRequest('workspaceId is required for this operation.'));
      }

      // Platform Admin bypass
      if (req.user.role === PlatformRole.PLATFORM_ADMIN) {
        req.workspaceContext = {
          workspaceId,
          role: WorkspaceRole.OWNER,
        };
        return next();
      }

      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: req.user.id,
          },
        },
        include: {
          workspace: {
            select: {
              id: true,
              isArchived: true,
              deletedAt: true,
            },
          },
        },
      });

      if (!member || member.workspace.deletedAt) {
        return next(
          new AppError(
            'You do not have access to this workspace or it does not exist.',
            403,
            ErrorCode.FORBIDDEN
          )
        );
      }

      const userRoleRank = WorkspaceRoleRank[member.role as WorkspaceRole] || 0;
      const requiredRoleRank = WorkspaceRoleRank[minRole] || 0;

      if (userRoleRank < requiredRoleRank) {
        return next(
          new AppError(
            `Insufficient permissions in this workspace. Requires at least ${minRole}.`,
            403,
            ErrorCode.FORBIDDEN
          )
        );
      }

      req.workspaceContext = {
        workspaceId,
        role: member.role as WorkspaceRole,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * PBAC: Enforce fine-grained workspace permissions.
 */
export function requireWorkspacePermission(
  permission: WorkspacePermission,
  sourceKey = 'workspaceId'
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(AppError.unauthenticated());
      }

      const workspaceId =
        req.params[sourceKey] ||
        req.body[sourceKey] ||
        (req.query[sourceKey] as string);

      if (!workspaceId) {
        return next(AppError.badRequest(`${sourceKey} is required for this operation.`));
      }

      const check = await authorizationService.hasWorkspacePermission(
        req.user.id,
        workspaceId,
        permission,
        req.user.role === PlatformRole.PLATFORM_ADMIN
      );

      if (!check.allowed) {
        return next(
          new AppError(
            check.reason || `Access denied: requires '${permission}' in this workspace.`,
            403,
            ErrorCode.FORBIDDEN
          )
        );
      }

      req.workspaceContext = {
        workspaceId,
        role: check.role || WorkspaceRole.GUEST,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

// ============================================================================
// 3. PROJECT LEVEL AUTHORIZATION
// ============================================================================

/**
 * RBAC: Check project-level membership and role hierarchy.
 */
export function requireProjectRole(minRole: ProjectRole = ProjectRole.VIEWER) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(AppError.unauthenticated());
      }

      const projectId =
        req.params.projectId ||
        req.body.projectId ||
        (req.query.projectId as string);

      if (!projectId) {
        return next(AppError.badRequest('projectId is required for this operation.'));
      }

      // Platform Admin bypass
      if (req.user.role === PlatformRole.PLATFORM_ADMIN) {
        req.projectContext = {
          projectId,
          role: ProjectRole.MANAGER,
        };
        return next();
      }

      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          members: {
            where: { userId: req.user.id },
          },
          workspace: {
            include: {
              members: {
                where: { userId: req.user.id },
              },
            },
          },
        },
      });

      if (!project || project.deletedAt || project.workspace.deletedAt) {
        return next(
          new AppError(
            'You do not have access to this project or it does not exist.',
            403,
            ErrorCode.FORBIDDEN
          )
        );
      }

      const wsMember = project.workspace.members[0];
      if (!wsMember) {
        return next(
          new AppError(
            'You do not belong to the workspace containing this project.',
            403,
            ErrorCode.FORBIDDEN
          )
        );
      }

      const isWorkspaceAdminOrOwner =
        wsMember.role === WorkspaceRole.OWNER || wsMember.role === WorkspaceRole.ADMIN;

      const projMember = project.members[0];

      let effectiveRole: ProjectRole;
      if (isWorkspaceAdminOrOwner) {
        effectiveRole = ProjectRole.MANAGER;
      } else if (projMember) {
        effectiveRole = projMember.role as ProjectRole;
      } else {
        return next(
          new AppError('You are not a member of this project.', 403, ErrorCode.FORBIDDEN)
        );
      }

      const userRank = ProjectRoleRank[effectiveRole] || 0;
      const requiredRank = ProjectRoleRank[minRole] || 0;

      if (userRank < requiredRank) {
        return next(
          new AppError(
            `Insufficient permissions in this project. Requires at least ${minRole}.`,
            403,
            ErrorCode.FORBIDDEN
          )
        );
      }

      req.projectContext = {
        projectId,
        role: effectiveRole,
      };
      req.workspaceContext = {
        workspaceId: project.workspaceId,
        role: wsMember.role as WorkspaceRole,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * PBAC: Enforce fine-grained project permissions.
 */
export function requireProjectPermission(
  permission: ProjectPermission,
  sourceKey = 'projectId'
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(AppError.unauthenticated());
      }

      const projectId =
        req.params[sourceKey] ||
        req.body[sourceKey] ||
        (req.query[sourceKey] as string);

      if (!projectId) {
        return next(AppError.badRequest(`${sourceKey} is required for this operation.`));
      }

      const check = await authorizationService.hasProjectPermission(
        req.user.id,
        projectId,
        permission,
        req.user.role === PlatformRole.PLATFORM_ADMIN
      );

      if (!check.allowed) {
        return next(
          new AppError(
            check.reason || `Access denied: requires '${permission}' in this project.`,
            403,
            ErrorCode.FORBIDDEN
          )
        );
      }

      req.projectContext = {
        projectId,
        role: check.effectiveRole || ProjectRole.VIEWER,
      };

      if (check.workspaceId) {
        req.workspaceContext = {
          workspaceId: check.workspaceId,
          role: WorkspaceRole.MEMBER,
        };
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// ============================================================================
// 4. TASK LEVEL AUTHORIZATION (PBAC)
// ============================================================================

/**
 * PBAC: Enforce fine-grained task permissions by resolving task -> project -> workspace.
 */
export function requireTaskPermission(permission: TaskPermission, sourceKey = 'taskId') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(AppError.unauthenticated());
      }

      const taskId =
        req.params[sourceKey] ||
        req.body[sourceKey] ||
        (req.query[sourceKey] as string);

      if (!taskId) {
        return next(AppError.badRequest(`${sourceKey} is required for this operation.`));
      }

      const check = await authorizationService.hasTaskPermission(
        req.user.id,
        taskId,
        permission,
        req.user.role === PlatformRole.PLATFORM_ADMIN
      );

      if (!check.allowed) {
        return next(
          new AppError(
            check.reason || `Access denied: requires '${permission}' on this task.`,
            403,
            ErrorCode.FORBIDDEN
          )
        );
      }

      req.taskContext = {
        taskId,
        role: check.effectiveRole || ProjectRole.VIEWER,
        task: check.task,
      };

      if (check.task?.projectId) {
        req.projectContext = {
          projectId: check.task.projectId,
          role: check.effectiveRole || ProjectRole.VIEWER,
        };
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

// ============================================================================
// 5. BOARD & COLUMN LEVEL AUTHORIZATION
// ============================================================================

/**
 * PBAC: Enforce board permissions by resolving board -> project -> workspace.
 */
export function requireBoardPermission(permission: ProjectPermission, sourceKey = 'boardId') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(AppError.unauthenticated());
      }

      const boardId =
        req.params[sourceKey] ||
        req.body[sourceKey] ||
        (req.query[sourceKey] as string);

      if (!boardId) {
        return next(AppError.badRequest(`${sourceKey} is required for this operation.`));
      }

      // Resolve board
      const board = await prisma.board.findUnique({
        where: { id: boardId },
        select: { id: true, projectId: true },
      });

      if (!board) {
        return next(AppError.notFound('Board not found.'));
      }

      const check = await authorizationService.hasProjectPermission(
        req.user.id,
        board.projectId,
        permission,
        req.user.role === PlatformRole.PLATFORM_ADMIN
      );

      if (!check.allowed) {
        return next(
          new AppError(
            check.reason || `Access denied: requires '${permission}' on this board.`,
            403,
            ErrorCode.FORBIDDEN
          )
        );
      }

      req.projectContext = {
        projectId: board.projectId,
        role: check.effectiveRole || ProjectRole.VIEWER,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * PBAC: Enforce column permissions by resolving column -> board -> project -> workspace.
 */
export function requireColumnPermission(permission: ProjectPermission, sourceKey = 'columnId') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(AppError.unauthenticated());
      }

      const columnId =
        req.params[sourceKey] ||
        req.body[sourceKey] ||
        (req.query[sourceKey] as string);

      if (!columnId) {
        return next(AppError.badRequest(`${sourceKey} is required for this operation.`));
      }

      const column = await prisma.boardColumn.findUnique({
        where: { id: columnId },
        include: {
          board: { select: { projectId: true } },
        },
      });

      if (!column) {
        return next(AppError.notFound('Column not found.'));
      }

      const check = await authorizationService.hasProjectPermission(
        req.user.id,
        column.board.projectId,
        permission,
        req.user.role === PlatformRole.PLATFORM_ADMIN
      );

      if (!check.allowed) {
        return next(
          new AppError(
            check.reason || `Access denied: requires '${permission}' on this column.`,
            403,
            ErrorCode.FORBIDDEN
          )
        );
      }

      req.projectContext = {
        projectId: column.board.projectId,
        role: check.effectiveRole || ProjectRole.VIEWER,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * PBAC: Enforce label permissions by resolving label -> workspace.
 */
export function requireLabelPermission(permission: WorkspacePermission, sourceKey = 'labelId') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        return next(AppError.unauthenticated());
      }

      const labelId =
        req.params[sourceKey] ||
        req.body[sourceKey] ||
        (req.query[sourceKey] as string);

      if (!labelId) {
        return next(AppError.badRequest(`${sourceKey} is required for this operation.`));
      }

      const label = await prisma.label.findUnique({
        where: { id: labelId },
        select: { workspaceId: true },
      });

      if (!label) {
        return next(AppError.notFound('Label not found.'));
      }

      const check = await authorizationService.hasWorkspacePermission(
        req.user.id,
        label.workspaceId,
        permission,
        req.user.role === PlatformRole.PLATFORM_ADMIN
      );

      if (!check.allowed) {
        return next(
          new AppError(
            check.reason || `Access denied: requires '${permission}' on this label.`,
            403,
            ErrorCode.FORBIDDEN
          )
        );
      }

      req.workspaceContext = {
        workspaceId: label.workspaceId,
        role: check.role || WorkspaceRole.GUEST,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

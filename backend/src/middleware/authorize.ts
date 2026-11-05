import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError, ErrorCode } from '../utils/app-error';
import { PlatformRole, WorkspaceRole, ProjectRole, WorkspaceRoleRank, ProjectRoleRank } from '../constants/roles';

// Check platform-level roles (e.g. PLATFORM_ADMIN)
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

// Check workspace-level membership and role hierarchy
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

      // Check if user is a member of this workspace
      const member = await prisma.workspaceMember.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId,
            userId: req.user.id
          }
        },
        include: {
          workspace: {
            select: {
              id: true,
              isArchived: true,
              deletedAt: true
            }
          }
        }
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

      // Attach workspace context to request
      req.workspaceContext = {
        workspaceId,
        role: member.role as WorkspaceRole
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

// Check project-level membership and role hierarchy
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

      // Check project existence and user project membership
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          members: {
            where: { userId: req.user.id }
          },
          workspace: {
            include: {
              members: {
                where: { userId: req.user.id }
              }
            }
          }
        }
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

      // Check workspace membership first (user MUST be in workspace)
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

      // Workspace OWNER or ADMIN automatically has full MANAGER privileges in any project inside the workspace
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
          new AppError(
            'You are not a member of this project.',
            403,
            ErrorCode.FORBIDDEN
          )
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
        role: effectiveRole
      };
      req.workspaceContext = {
        workspaceId: project.workspaceId,
        role: wsMember.role as WorkspaceRole
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

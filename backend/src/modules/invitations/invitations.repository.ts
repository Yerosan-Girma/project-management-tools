import { prisma } from '../../config/database';
import {
  WorkspaceInvitation,
  InvitationDeliveryStatus,
  InvitationStatus,
  WorkspaceRole,
  ProjectRole,
} from '@prisma/client';

export class InvitationsRepository {
  async createInvitation(data: {
    workspaceId: string;
    projectId?: string | null;
    inviterId: string;
    email: string;
    role: WorkspaceRole;
    projectRole?: ProjectRole | null;
    token: string;
    expiresAt: Date;
  }): Promise<WorkspaceInvitation> {
    return prisma.workspaceInvitation.create({
      data: {
        workspaceId: data.workspaceId,
        projectId: data.projectId || null,
        inviterId: data.inviterId,
        email: data.email.toLowerCase(),
        role: data.role,
        projectRole: data.projectRole || null,
        token: data.token,
        expiresAt: data.expiresAt,
        status: InvitationStatus.PENDING,
      },
      include: {
        workspace: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, key: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findByToken(token: string) {
    return prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: true,
        project: { select: { id: true, name: true, key: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findById(id: string) {
    return prisma.workspaceInvitation.findUnique({
      where: { id },
      include: {
        workspace: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, key: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async findPendingInvitation(workspaceId: string, email: string) {
    return prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        projectId: null,
        email: email.toLowerCase(),
        status: InvitationStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingProjectInvitation(projectId: string, email: string) {
    return prisma.workspaceInvitation.findFirst({
      where: {
        projectId,
        email: email.toLowerCase(),
        status: InvitationStatus.PENDING,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateInvitation(
    id: string,
    data: {
      inviterId?: string;
      role?: WorkspaceRole;
      projectRole?: ProjectRole | null;
      token?: string;
      expiresAt?: Date;
      status?: InvitationStatus;
      deliveryStatus?: InvitationDeliveryStatus;
    }
  ) {
    return prisma.workspaceInvitation.update({
      where: { id },
      data,
      include: {
        workspace: { select: { id: true, name: true } },
        project: { select: { id: true, name: true, key: true } },
        inviter: { select: { id: true, name: true, email: true } },
      },
    });
  }

  async listWorkspaceInvitations(workspaceId: string) {
    return prisma.workspaceInvitation.findMany({
      where: { workspaceId, projectId: null },
      include: {
        inviter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listProjectInvitations(projectId: string) {
    return prisma.workspaceInvitation.findMany({
      where: { projectId, status: InvitationStatus.PENDING },
      include: {
        inviter: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptInvitation(invitationId: string, workspaceId: string, userId: string, role: WorkspaceRole) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch invitation to check if it's a project-scoped invitation
      const inv = await tx.workspaceInvitation.findUnique({
        where: { id: invitationId },
      });
      if (!inv) {
        throw new Error('Invitation not found.');
      }

      // 2. Update invitation status
      await tx.workspaceInvitation.update({
        where: { id: invitationId },
        data: {
          status: InvitationStatus.ACCEPTED,
          respondedAt: new Date(),
        },
      });

      // 3. Add or preserve member in workspace
      const existingMember = await tx.workspaceMember.findUnique({
        where: {
          workspaceId_userId: { workspaceId, userId },
        },
      });

      // If user is already an OWNER, ADMIN, or MEMBER, do not demote to GUEST
      let effectiveWsRole = role;
      if (existingMember) {
        effectiveWsRole = existingMember.role;
      }

      const member = await tx.workspaceMember.upsert({
        where: {
          workspaceId_userId: { workspaceId, userId },
        },
        create: {
          workspaceId,
          userId,
          role: effectiveWsRole,
        },
        update: {
          role: existingMember ? existingMember.role : effectiveWsRole,
        },
        include: {
          workspace: { select: { id: true, name: true, slug: true } },
        },
      });

      // 4. Project-specific invitation: enroll strictly into the designated project
      if (inv.projectId) {
        await tx.projectMember.upsert({
          where: {
            projectId_userId: { projectId: inv.projectId, userId },
          },
          create: {
            projectId: inv.projectId,
            userId,
            role: inv.projectRole || ProjectRole.MEMBER,
          },
          update: {
            role: inv.projectRole || ProjectRole.MEMBER,
          },
        });
      } else if (role === WorkspaceRole.MEMBER || role === WorkspaceRole.ADMIN) {
        // 5. Workspace-wide invitation for MEMBER or ADMIN: enroll in existing workspace projects
        const workspaceProjects = await tx.project.findMany({
          where: { workspaceId, deletedAt: null, isArchived: false },
          select: { id: true },
        });

        await tx.projectMember.createMany({
          data: workspaceProjects.map((project) => ({
            projectId: project.id,
            userId,
            role: role === WorkspaceRole.ADMIN ? 'MANAGER' : 'MEMBER',
          })),
          skipDuplicates: true,
        });
      }

      return {
        ...member,
        projectId: inv.projectId || null,
      };
    });
  }

  async rejectInvitation(invitationId: string) {
    return prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: {
        status: InvitationStatus.REJECTED,
        respondedAt: new Date(),
      },
    });
  }

  async cancelInvitation(invitationId: string) {
    return prisma.workspaceInvitation.delete({
      where: { id: invitationId },
    });
  }
}

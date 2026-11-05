import { prisma } from '../../config/database';
import { WorkspaceInvitation, InvitationStatus, WorkspaceRole } from '@prisma/client';

export class InvitationsRepository {
  async createInvitation(data: {
    workspaceId: string;
    inviterId: string;
    email: string;
    role: WorkspaceRole;
    token: string;
    expiresAt: Date;
  }): Promise<WorkspaceInvitation> {
    return prisma.workspaceInvitation.create({
      data: {
        workspaceId: data.workspaceId,
        inviterId: data.inviterId,
        email: data.email.toLowerCase(),
        role: data.role,
        token: data.token,
        expiresAt: data.expiresAt,
        status: InvitationStatus.PENDING
      },
      include: {
        workspace: { select: { id: true, name: true } },
        inviter: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async findByToken(token: string) {
    return prisma.workspaceInvitation.findUnique({
      where: { token },
      include: {
        workspace: true,
        inviter: { select: { id: true, name: true, email: true } }
      }
    });
  }

  async findPendingInvitation(workspaceId: string, email: string) {
    return prisma.workspaceInvitation.findFirst({
      where: {
        workspaceId,
        email: email.toLowerCase(),
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() }
      }
    });
  }

  async listWorkspaceInvitations(workspaceId: string) {
    return prisma.workspaceInvitation.findMany({
      where: { workspaceId },
      include: {
        inviter: { select: { id: true, name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async acceptInvitation(invitationId: string, workspaceId: string, userId: string, role: WorkspaceRole) {
    return prisma.$transaction(async (tx) => {
      // 1. Update invitation status
      await tx.workspaceInvitation.update({
        where: { id: invitationId },
        data: {
          status: InvitationStatus.ACCEPTED,
          respondedAt: new Date()
        }
      });

      // 2. Add member to workspace
      const member = await tx.workspaceMember.upsert({
        where: {
          workspaceId_userId: { workspaceId, userId }
        },
        create: {
          workspaceId,
          userId,
          role
        },
        update: {
          role
        },
        include: {
          workspace: { select: { id: true, name: true, slug: true } }
        }
      });

      return member;
    });
  }

  async rejectInvitation(invitationId: string) {
    return prisma.workspaceInvitation.update({
      where: { id: invitationId },
      data: {
        status: InvitationStatus.REJECTED,
        respondedAt: new Date()
      }
    });
  }

  async cancelInvitation(invitationId: string) {
    return prisma.workspaceInvitation.delete({
      where: { id: invitationId }
    });
  }
}

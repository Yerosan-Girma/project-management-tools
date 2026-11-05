import { prisma } from '../../config/database';
import { Workspace, WorkspaceMember, WorkspaceRole } from '@prisma/client';

export class WorkspacesRepository {
  async createWorkspaceWithDefaults(data: {
    name: string;
    slug: string;
    description?: string;
    avatarUrl?: string;
    ownerId: string;
  }): Promise<Workspace> {
    return prisma.$transaction(async (tx) => {
      // 1. Create Workspace
      const workspace = await tx.workspace.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          avatarUrl: data.avatarUrl,
          ownerId: data.ownerId,
          members: {
            create: {
              userId: data.ownerId,
              role: WorkspaceRole.OWNER
            }
          },
          labels: {
            create: [
              { name: 'Bug', color: '#EF4444' },
              { name: 'Feature', color: '#3B82F6' },
              { name: 'Enhancement', color: '#10B981' },
              { name: 'Backend', color: '#8B5CF6' },
              { name: 'Frontend', color: '#EC4899' },
              { name: 'DevOps', color: '#F59E0B' }
            ]
          }
        },
        include: {
          members: true,
          labels: true
        }
      });

      return workspace;
    });
  }

  async findById(id: string): Promise<(Workspace & { members: WorkspaceMember[] }) | null> {
    return prisma.workspace.findFirst({
      where: { id, deletedAt: null },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true }
            }
          }
        }
      }
    });
  }

  async findBySlug(slug: string): Promise<Workspace | null> {
    return prisma.workspace.findFirst({
      where: { slug, deletedAt: null }
    });
  }

  async listUserWorkspaces(userId: string) {
    return prisma.workspace.findMany({
      where: {
        deletedAt: null,
        members: {
          some: { userId }
        }
      },
      include: {
        members: {
          where: { userId },
          select: { role: true, joinedAt: true }
        },
        _count: {
          select: {
            members: true,
            projects: { where: { deletedAt: null } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  async updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace> {
    return prisma.workspace.update({
      where: { id },
      data
    });
  }

  async listMembers(
    workspaceId: string,
    query?: string,
    role?: WorkspaceRole,
    skip: number = 0,
    take: number = 20
  ) {
    const whereClause: any = {
      workspaceId,
      user: { deletedAt: null }
    };

    if (role) {
      whereClause.role = role;
    }

    if (query) {
      whereClause.user = {
        deletedAt: null,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } }
        ]
      };
    }

    const [total, items] = await Promise.all([
      prisma.workspaceMember.count({ where: whereClause }),
      prisma.workspaceMember.findMany({
        where: whereClause,
        include: {
          user: {
            select: { id: true, name: true, email: true, avatarUrl: true, status: true }
          }
        },
        orderBy: { joinedAt: 'asc' },
        skip,
        take
      })
    ]);

    return { total, items };
  }

  async findMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
    return prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: { workspaceId, userId }
      }
    });
  }

  async countOwners(workspaceId: string): Promise<number> {
    return prisma.workspaceMember.count({
      where: {
        workspaceId,
        role: WorkspaceRole.OWNER
      }
    });
  }

  async updateMemberRole(workspaceId: string, userId: string, role: WorkspaceRole): Promise<WorkspaceMember> {
    return prisma.workspaceMember.update({
      where: {
        workspaceId_userId: { workspaceId, userId }
      },
      data: { role }
    });
  }

  async removeMember(workspaceId: string, userId: string): Promise<void> {
    await prisma.workspaceMember.delete({
      where: {
        workspaceId_userId: { workspaceId, userId }
      }
    });
  }

  async transferOwnership(workspaceId: string, currentOwnerId: string, newOwnerId: string): Promise<void> {
    await prisma.$transaction([
      prisma.workspace.update({
        where: { id: workspaceId },
        data: { ownerId: newOwnerId }
      }),
      prisma.workspaceMember.update({
        where: {
          workspaceId_userId: { workspaceId, userId: currentOwnerId }
        },
        data: { role: WorkspaceRole.ADMIN }
      }),
      prisma.workspaceMember.update({
        where: {
          workspaceId_userId: { workspaceId, userId: newOwnerId }
        },
        data: { role: WorkspaceRole.OWNER }
      })
    ]);
  }
}

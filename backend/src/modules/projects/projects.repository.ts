import { prisma } from '../../config/database';
import { Project, ProjectMember, ProjectRole, ProjectStatus, PriorityLevel, Board, BoardColumn } from '@prisma/client';

export class ProjectsRepository {
  async createProjectWithDefaultBoardAndColumns(data: {
    workspaceId: string;
    name: string;
    key: string;
    description?: string;
    priority: PriorityLevel;
    startDate?: Date | null;
    targetDate?: Date | null;
    createdById: string;
  }) {
    return prisma.$transaction(async (tx) => {
      // 1. Create project and assign creator as MANAGER
      const project = await tx.project.create({
        data: {
          workspaceId: data.workspaceId,
          name: data.name,
          key: data.key,
          description: data.description,
          priority: data.priority,
          startDate: data.startDate,
          targetDate: data.targetDate,
          createdById: data.createdById,
          status: ProjectStatus.ACTIVE,
          members: {
            create: {
              userId: data.createdById,
              role: ProjectRole.MANAGER
            }
          },
          boards: {
            create: {
              name: 'Main Board',
              isDefault: true,
              position: 1000,
              columns: {
                create: [
                  { name: 'To Do', position: 1000, color: '#94A3B8' },
                  { name: 'In Progress', position: 2000, color: '#3B82F6' },
                  { name: 'In Review', position: 3000, color: '#F59E0B' },
                  { name: 'Completed', position: 4000, color: '#10B981', isCompletedColumn: true }
                ]
              }
            }
          }
        },
        include: {
          members: {
            include: {
              user: { select: { id: true, name: true, email: true, avatarUrl: true } }
            }
          },
          boards: {
            include: {
              columns: { orderBy: { position: 'asc' } }
            }
          }
        }
      });

      return project;
    });
  }

  async findById(id: string) {
    return prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true }
        },
        creator: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } }
          }
        },
        boards: {
          where: { isArchived: false },
          include: {
            columns: {
              orderBy: { position: 'asc' }
            }
          },
          orderBy: { position: 'asc' }
        },
        _count: {
          select: {
            tasks: { where: { deletedAt: null, isArchived: false } }
          }
        }
      }
    });
  }

  async findByKey(workspaceId: string, key: string) {
    return prisma.project.findUnique({
      where: {
        workspaceId_key: { workspaceId, key }
      }
    });
  }

  async listWorkspaceProjects(
    workspaceId: string,
    userId: string,
    isWorkspaceAdminOrOwner: boolean,
    status?: ProjectStatus,
    priority?: PriorityLevel
  ) {
    const whereClause: any = {
      workspaceId,
      deletedAt: null,
      isArchived: false
    };

    if (status) {
      whereClause.status = status;
    }
    if (priority) {
      whereClause.priority = priority;
    }

    // If not a workspace admin or owner, user only sees projects they are a member of
    if (!isWorkspaceAdminOrOwner) {
      whereClause.members = {
        some: { userId }
      };
    }

    return prisma.project.findMany({
      where: whereClause,
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatarUrl: true }
        },
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, avatarUrl: true } }
          }
        },
        _count: {
          select: {
            tasks: { where: { deletedAt: null, isArchived: false } }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });
  }

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data
    });
  }

  async archiveProject(id: string): Promise<Project> {
    return prisma.project.update({
      where: { id },
      data: { isArchived: true, status: ProjectStatus.ARCHIVED }
    });
  }

  // Project Members
  async addMember(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMember> {
    return prisma.projectMember.create({
      data: {
        projectId,
        userId,
        role
      },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } }
      }
    });
  }

  async findMember(projectId: string, userId: string): Promise<ProjectMember | null> {
    return prisma.projectMember.findUnique({
      where: {
        projectId_userId: { projectId, userId }
      }
    });
  }

  async updateMemberRole(projectId: string, userId: string, role: ProjectRole): Promise<ProjectMember> {
    return prisma.projectMember.update({
      where: {
        projectId_userId: { projectId, userId }
      },
      data: { role },
      include: {
        user: { select: { id: true, name: true, email: true, avatarUrl: true } }
      }
    });
  }

  async removeMember(projectId: string, userId: string): Promise<void> {
    await prisma.projectMember.delete({
      where: {
        projectId_userId: { projectId, userId }
      }
    });
  }

  async getProjectActivity(projectId: string, limit: number = 50) {
    return prisma.activityLog.findMany({
      where: { projectId },
      include: {
        actor: { select: { id: true, name: true, email: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }
}

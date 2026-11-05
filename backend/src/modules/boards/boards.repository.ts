import { prisma } from '../../config/database';
import { Board } from '@prisma/client';

export class BoardsRepository {
  async createBoard(data: {
    projectId: string;
    name: string;
    description?: string;
    position?: number;
  }): Promise<Board> {
    return prisma.board.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        position: data.position ?? 1000,
        columns: {
          create: [
            { name: 'To Do', position: 1000, color: '#94A3B8' },
            { name: 'In Progress', position: 2000, color: '#3B82F6' },
            { name: 'In Review', position: 3000, color: '#F59E0B' },
            { name: 'Completed', position: 4000, color: '#10B981', isCompletedColumn: true }
          ]
        }
      },
      include: {
        columns: {
          orderBy: { position: 'asc' }
        }
      }
    });
  }

  async findById(id: string) {
    return prisma.board.findUnique({
      where: { id },
      include: {
        project: {
          select: { id: true, workspaceId: true, name: true }
        },
        columns: {
          orderBy: { position: 'asc' },
          include: {
            _count: {
              select: { tasks: { where: { deletedAt: null, isArchived: false } } }
            }
          }
        }
      }
    });
  }

  async listProjectBoards(projectId: string) {
    return prisma.board.findMany({
      where: {
        projectId,
        isArchived: false
      },
      include: {
        columns: {
          orderBy: { position: 'asc' },
          include: {
            _count: {
              select: { tasks: { where: { deletedAt: null, isArchived: false } } }
            }
          }
        }
      },
      orderBy: { position: 'asc' }
    });
  }

  async updateBoard(id: string, data: Partial<Board>): Promise<Board> {
    return prisma.board.update({
      where: { id },
      data
    });
  }

  async archiveBoard(id: string): Promise<Board> {
    return prisma.board.update({
      where: { id },
      data: { isArchived: true }
    });
  }
}

import { prisma } from '../../config/database';
import { BoardColumn } from '@prisma/client';

export class ColumnsRepository {
  async createColumn(data: {
    boardId: string;
    name: string;
    color?: string;
    taskLimit?: number | null;
    isCompletedColumn?: boolean;
    position?: number;
  }): Promise<BoardColumn> {
    const position =
      data.position ??
      ((await prisma.boardColumn.count({ where: { boardId: data.boardId } })) + 1) * 1000;

    return prisma.boardColumn.create({
      data: {
        boardId: data.boardId,
        name: data.name,
        color: data.color,
        taskLimit: data.taskLimit,
        isCompletedColumn: data.isCompletedColumn ?? false,
        position
      }
    });
  }

  async findById(id: string) {
    return prisma.boardColumn.findUnique({
      where: { id },
      include: {
        board: {
          include: {
            project: {
              select: { id: true, workspaceId: true }
            }
          }
        },
        _count: {
          select: { tasks: { where: { deletedAt: null, isArchived: false } } }
        }
      }
    });
  }

  async updateColumn(id: string, data: Partial<BoardColumn>): Promise<BoardColumn> {
    return prisma.boardColumn.update({
      where: { id },
      data
    });
  }

  async reorderColumns(columns: { id: string; position: number }[]): Promise<void> {
    await prisma.$transaction(
      columns.map((c) =>
        prisma.boardColumn.update({
          where: { id: c.id },
          data: { position: c.position }
        })
      )
    );
  }

  async deleteColumnWithTaskMigration(columnId: string, targetColumnId?: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      if (targetColumnId) {
        // Move all tasks to destination column before deleting
        await tx.task.updateMany({
          where: { boardColumnId: columnId },
          data: { boardColumnId: targetColumnId }
        });
      }

      await tx.boardColumn.delete({
        where: { id: columnId }
      });
    });
  }
}

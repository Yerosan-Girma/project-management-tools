import { ColumnsRepository } from './columns.repository';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { CreateColumnInput, UpdateColumnInput, ReorderColumnsInput } from './columns.schema';

export class ColumnsService {
  constructor(private readonly columnsRepo: ColumnsRepository = new ColumnsRepository()) {}

  async createColumn(input: CreateColumnInput) {
    const board = await prisma.board.findUnique({
      where: { id: input.boardId }
    });
    if (!board || board.isArchived) {
      throw AppError.notFound('Board not found.');
    }

    return this.columnsRepo.createColumn(input);
  }

  async getColumnDetails(columnId: string) {
    const column = await this.columnsRepo.findById(columnId);
    if (!column) {
      throw AppError.notFound('Column not found.');
    }
    return column;
  }

  async updateColumn(columnId: string, input: UpdateColumnInput) {
    const column = await this.columnsRepo.findById(columnId);
    if (!column) {
      throw AppError.notFound('Column not found.');
    }

    return this.columnsRepo.updateColumn(columnId, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.color !== undefined && { color: input.color }),
      ...(input.taskLimit !== undefined && { taskLimit: input.taskLimit }),
      ...(input.isCompletedColumn !== undefined && { isCompletedColumn: input.isCompletedColumn }),
      ...(input.position !== undefined && { position: input.position })
    });
  }

  async reorderColumns(input: ReorderColumnsInput) {
    return this.columnsRepo.reorderColumns(input.columns);
  }

  async deleteColumn(columnId: string, targetColumnId?: string) {
    const column = await this.columnsRepo.findById(columnId);
    if (!column) {
      throw AppError.notFound('Column not found.');
    }

    const taskCount = column._count.tasks;

    if (taskCount > 0 && !targetColumnId) {
      throw AppError.badRequest(
        `Column contains ${taskCount} active task(s). A targetColumnId must be provided to migrate existing tasks before deletion.`
      );
    }

    if (targetColumnId) {
      if (targetColumnId === columnId) {
        throw AppError.badRequest('Target column must be different from the column being deleted.');
      }

      const targetCol = await this.columnsRepo.findById(targetColumnId);
      if (!targetCol) {
        throw AppError.notFound('Target column not found.');
      }

      if (targetCol.boardId !== column.boardId) {
        throw AppError.badRequest('Target column must belong to the same board.');
      }
    }

    await this.columnsRepo.deleteColumnWithTaskMigration(columnId, targetColumnId);
    return true;
  }
}

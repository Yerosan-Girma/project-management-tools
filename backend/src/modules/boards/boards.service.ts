import { BoardsRepository } from './boards.repository';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';
import { CreateBoardInput, UpdateBoardInput } from './boards.schema';

export class BoardsService {
  constructor(private readonly boardsRepo: BoardsRepository = new BoardsRepository()) {}

  async createBoard(input: CreateBoardInput) {
    const project = await prisma.project.findUnique({
      where: { id: input.projectId, deletedAt: null }
    });
    if (!project) {
      throw AppError.notFound('Project not found.');
    }

    return this.boardsRepo.createBoard(input);
  }

  async getBoardDetails(boardId: string) {
    const board = await this.boardsRepo.findById(boardId);
    if (!board || board.isArchived) {
      throw AppError.notFound('Board not found.');
    }
    return board;
  }

  async listProjectBoards(projectId: string) {
    return this.boardsRepo.listProjectBoards(projectId);
  }

  async updateBoard(boardId: string, input: UpdateBoardInput) {
    const board = await this.boardsRepo.findById(boardId);
    if (!board) {
      throw AppError.notFound('Board not found.');
    }

    return this.boardsRepo.updateBoard(boardId, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && { description: input.description }),
      ...(input.position !== undefined && { position: input.position })
    });
  }

  async archiveBoard(boardId: string) {
    const board = await this.boardsRepo.findById(boardId);
    if (!board) {
      throw AppError.notFound('Board not found.');
    }

    if (board.isDefault) {
      throw AppError.badRequest('Cannot archive the default board of a project.');
    }

    return this.boardsRepo.archiveBoard(boardId);
  }
}

import { Request, Response } from 'express';
import { BoardsService } from './boards.service';
import { ApiResponse } from '../../utils/api-response';

export class BoardsController {
  constructor(private readonly boardsService: BoardsService = new BoardsService()) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const board = await this.boardsService.createBoard(req.body);
    ApiResponse.created(res, 'Board created successfully.', board);
  };

  listProjectBoards = async (req: Request, res: Response): Promise<void> => {
    const projectId = req.params.projectId || (req.query.projectId as string);
    const boards = await this.boardsService.listProjectBoards(projectId);
    ApiResponse.success(res, 'Boards retrieved successfully.', boards);
  };

  getDetails = async (req: Request, res: Response): Promise<void> => {
    const board = await this.boardsService.getBoardDetails(req.params.boardId);
    ApiResponse.success(res, 'Board details retrieved.', board);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const board = await this.boardsService.updateBoard(req.params.boardId, req.body);
    ApiResponse.success(res, 'Board updated successfully.', board);
  };

  archive = async (req: Request, res: Response): Promise<void> => {
    await this.boardsService.archiveBoard(req.params.boardId);
    ApiResponse.success(res, 'Board archived successfully.');
  };
}

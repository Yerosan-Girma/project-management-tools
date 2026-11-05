import { Request, Response } from 'express';
import { CommentsService } from './comments.service';
import { ApiResponse } from '../../utils/api-response';

export class CommentsController {
  constructor(private readonly commentsService: CommentsService = new CommentsService()) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const comment = await this.commentsService.createComment(
      req.params.taskId,
      req.user!.id,
      req.body
    );
    ApiResponse.created(res, 'Comment posted successfully.', comment);
  };

  listTaskComments = async (req: Request, res: Response): Promise<void> => {
    const comments = await this.commentsService.listTaskComments(req.params.taskId);
    ApiResponse.success(res, 'Comments retrieved successfully.', comments);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const comment = await this.commentsService.updateComment(
      req.params.commentId,
      req.user!.id,
      req.body
    );
    ApiResponse.success(res, 'Comment updated successfully.', comment);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.commentsService.deleteComment(req.params.commentId, req.user!.id);
    ApiResponse.success(res, 'Comment deleted successfully.');
  };
}

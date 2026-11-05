import { Request, Response } from 'express';
import { ColumnsService } from './columns.service';
import { ApiResponse } from '../../utils/api-response';

export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService = new ColumnsService()) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const column = await this.columnsService.createColumn(req.body);
    ApiResponse.created(res, 'Column created successfully.', column);
  };

  getDetails = async (req: Request, res: Response): Promise<void> => {
    const column = await this.columnsService.getColumnDetails(req.params.columnId);
    ApiResponse.success(res, 'Column details retrieved.', column);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const column = await this.columnsService.updateColumn(req.params.columnId, req.body);
    ApiResponse.success(res, 'Column updated successfully.', column);
  };

  reorder = async (req: Request, res: Response): Promise<void> => {
    await this.columnsService.reorderColumns(req.body);
    ApiResponse.success(res, 'Columns reordered successfully.');
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    const targetColumnId = req.body?.targetColumnId || (req.query.targetColumnId as string);
    await this.columnsService.deleteColumn(req.params.columnId, targetColumnId);
    ApiResponse.success(res, 'Column deleted and tasks safely migrated successfully.');
  };
}

import { Request, Response } from 'express';
import { LabelsService } from './labels.service';
import { ApiResponse } from '../../utils/api-response';

export class LabelsController {
  constructor(private readonly labelsService: LabelsService = new LabelsService()) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const label = await this.labelsService.createLabel(req.body);
    ApiResponse.created(res, 'Label created successfully.', label);
  };

  listWorkspaceLabels = async (req: Request, res: Response): Promise<void> => {
    const labels = await this.labelsService.listWorkspaceLabels(req.params.workspaceId);
    ApiResponse.success(res, 'Labels retrieved successfully.', labels);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const label = await this.labelsService.updateLabel(req.params.labelId, req.body);
    ApiResponse.success(res, 'Label updated successfully.', label);
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    await this.labelsService.deleteLabel(req.params.labelId);
    ApiResponse.success(res, 'Label deleted successfully.');
  };
}

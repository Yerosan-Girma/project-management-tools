import { Request, Response } from 'express';
import { ActivitiesService } from './activities.service';
import { ApiResponse } from '../../utils/api-response';
import { parsePagination, formatPaginatedResponse } from '../../utils/pagination';

export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService = new ActivitiesService()) {}

  listWorkspaceActivities = async (req: Request, res: Response): Promise<void> => {
    const pagination = parsePagination(req.query);
    const { total, items } = await this.activitiesService.listWorkspaceActivities(
      req.params.workspaceId,
      pagination.skip,
      pagination.limit
    );
    const formatted = formatPaginatedResponse(items, total, pagination);
    ApiResponse.success(res, 'Workspace activities retrieved.', formatted);
  };

  listProjectActivities = async (req: Request, res: Response): Promise<void> => {
    const pagination = parsePagination(req.query);
    const { total, items } = await this.activitiesService.listProjectActivities(
      req.params.projectId,
      pagination.skip,
      pagination.limit
    );
    const formatted = formatPaginatedResponse(items, total, pagination);
    ApiResponse.success(res, 'Project activities retrieved.', formatted);
  };
}

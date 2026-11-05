import { Request, Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { ApiResponse } from '../../utils/api-response';

export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService = new AnalyticsService()) {}

  getDashboardStats = async (req: Request, res: Response): Promise<void> => {
    const stats = await this.analyticsService.getUserDashboardStats(req.user!.id);
    ApiResponse.success(res, 'Dashboard metrics retrieved.', stats);
  };

  getProjectAnalytics = async (req: Request, res: Response): Promise<void> => {
    const data = await this.analyticsService.getProjectAnalytics(req.params.projectId);
    ApiResponse.success(res, 'Project analytics retrieved.', data);
  };

  getProjectActivity = async (req: Request, res: Response): Promise<void> => {
    const activities = await this.analyticsService.getProjectActivity(req.params.projectId);
    ApiResponse.success(res, 'Project activities retrieved.', activities);
  };

  getProjectReports = async (req: Request, res: Response): Promise<void> => {
    const reports = await this.analyticsService.getProjectReports(req.params.projectId);
    ApiResponse.success(res, 'Project reports retrieved.', reports);
  };
}

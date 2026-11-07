import { AnalyticsRepository } from './analytics.repository';
import { prisma } from '../../config/database';
import { AppError } from '../../utils/app-error';

export class AnalyticsService {
  constructor(private readonly analyticsRepo: AnalyticsRepository = new AnalyticsRepository()) {}

  async getUserDashboardStats(userId: string, workspaceId?: string) {
    return this.analyticsRepo.getUserDashboardStats(userId, workspaceId);
  }

  async getProjectAnalytics(projectId: string) {
    const data = await this.analyticsRepo.getProjectAnalytics(projectId);
    if (!data) {
      throw AppError.notFound('Project not found.');
    }
    return data;
  }

  async getProjectReports(projectId: string) {
    const data = await this.analyticsRepo.getProjectReports(projectId);
    if (!data) {
      throw AppError.notFound('Project not found.');
    }
    return data;
  }

  async getProjectActivity(projectId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });
    if (!project) {
      throw AppError.notFound('Project not found.');
    }

    return prisma.activityLog.findMany({
      where: { projectId },
      include: {
        actor: { select: { id: true, name: true, email: true, avatarUrl: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
  }
}

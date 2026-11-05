import { prisma } from '../../config/database';

export class ActivitiesRepository {
  async listWorkspaceActivities(workspaceId: string, skip: number = 0, take: number = 30) {
    const [total, items] = await Promise.all([
      prisma.activityLog.count({ where: { workspaceId } }),
      prisma.activityLog.findMany({
        where: { workspaceId },
        include: {
          actor: { select: { id: true, name: true, email: true, avatarUrl: true } },
          project: { select: { id: true, name: true, key: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      })
    ]);

    return { total, items };
  }

  async listProjectActivities(projectId: string, skip: number = 0, take: number = 30) {
    const [total, items] = await Promise.all([
      prisma.activityLog.count({ where: { projectId } }),
      prisma.activityLog.findMany({
        where: { projectId },
        include: {
          actor: { select: { id: true, name: true, email: true, avatarUrl: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      })
    ]);

    return { total, items };
  }
}

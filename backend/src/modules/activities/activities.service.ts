import { ActivitiesRepository } from './activities.repository';

export class ActivitiesService {
  constructor(private readonly activitiesRepo: ActivitiesRepository = new ActivitiesRepository()) {}

  async listWorkspaceActivities(workspaceId: string, skip: number = 0, take: number = 30) {
    return this.activitiesRepo.listWorkspaceActivities(workspaceId, skip, take);
  }

  async listProjectActivities(projectId: string, skip: number = 0, take: number = 30) {
    return this.activitiesRepo.listProjectActivities(projectId, skip, take);
  }
}

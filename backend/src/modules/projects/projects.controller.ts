import { Request, Response } from 'express';
import { ProjectsService } from './projects.service';
import { ApiResponse } from '../../utils/api-response';
import { ProjectStatus, PriorityLevel } from '../../constants/status';

export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService = new ProjectsService()) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const project = await this.projectsService.createProject(req.user!.id, req.body);
    ApiResponse.created(res, 'Project created successfully with default board and columns.', project);
  };

  listWorkspaceProjects = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = req.params.workspaceId || (req.query.workspaceId as string);
    const status = req.query.status as ProjectStatus | undefined;
    const priority = req.query.priority as PriorityLevel | undefined;

    const projects = await this.projectsService.listWorkspaceProjects(
      workspaceId,
      req.user!.id,
      status,
      priority
    );
    ApiResponse.success(res, 'Projects retrieved successfully.', projects);
  };

  getDetails = async (req: Request, res: Response): Promise<void> => {
    const project = await this.projectsService.getProjectDetails(
      req.params.projectId,
      req.user!.id
    );
    ApiResponse.success(res, 'Project details retrieved.', project);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const project = await this.projectsService.updateProject(
      req.params.projectId,
      req.user!.id,
      req.body
    );
    ApiResponse.success(res, 'Project updated successfully.', project);
  };

  archive = async (req: Request, res: Response): Promise<void> => {
    await this.projectsService.archiveProject(req.params.projectId, req.user!.id);
    ApiResponse.success(res, 'Project archived successfully.');
  };

  addMember = async (req: Request, res: Response): Promise<void> => {
    const member = await this.projectsService.addProjectMember(
      req.params.projectId,
      req.user!.id,
      req.body
    );
    ApiResponse.created(res, 'Member added to project.', member);
  };

  updateMemberRole = async (req: Request, res: Response): Promise<void> => {
    const member = await this.projectsService.updateMemberRole(
      req.params.projectId,
      req.params.userId,
      req.user!.id,
      req.body
    );
    ApiResponse.success(res, 'Project member role updated.', member);
  };

  removeMember = async (req: Request, res: Response): Promise<void> => {
    await this.projectsService.removeProjectMember(
      req.params.projectId,
      req.params.userId,
      req.user!.id
    );
    ApiResponse.success(res, 'Member removed from project.');
  };

  getOverview = async (req: Request, res: Response): Promise<void> => {
    const overview = await this.projectsService.getProjectOverview(req.params.projectId);
    ApiResponse.success(res, 'Project overview retrieved.', overview);
  };

  getActivity = async (req: Request, res: Response): Promise<void> => {
    const activity = await this.projectsService.getProjectActivity(req.params.projectId);
    ApiResponse.success(res, 'Project activity logs retrieved.', activity);
  };
}

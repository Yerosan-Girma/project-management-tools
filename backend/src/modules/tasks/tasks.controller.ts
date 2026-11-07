import { Request, Response } from 'express';
import { TasksService } from './tasks.service';
import { ApiResponse } from '../../utils/api-response';
import { parsePagination, formatPaginatedResponse } from '../../utils/pagination';

export class TasksController {
  constructor(private readonly tasksService: TasksService = new TasksService()) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const task = await this.tasksService.createTask(req.user!.id, req.body);
    ApiResponse.created(res, 'Task created successfully.', task);
  };

  getDetails = async (req: Request, res: Response): Promise<void> => {
    const task = await this.tasksService.getTaskDetails(req.params.taskId);
    ApiResponse.success(res, 'Task details retrieved.', task);
  };

  listProjectTasks = async (req: Request, res: Response): Promise<void> => {
    const pagination = parsePagination(req.query);
    const { total, items } = await this.tasksService.listProjectTasks(
      req.params.projectId,
      req.query as any,
      pagination.skip,
      pagination.limit
    );
    const formatted = formatPaginatedResponse(items, total, pagination);
    ApiResponse.success(res, 'Tasks retrieved successfully.', formatted);
  };

  listMyTasks = async (req: Request, res: Response): Promise<void> => {
    const workspaceId = req.query.workspaceId as string | undefined;
    const tasks = await this.tasksService.listMyAssignedTasks(req.user!.id, workspaceId);
    ApiResponse.success(res, 'Assigned tasks retrieved.', tasks);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const task = await this.tasksService.updateTask(req.params.taskId, req.user!.id, req.body);
    ApiResponse.success(res, 'Task updated successfully.', task);
  };

  move = async (req: Request, res: Response): Promise<void> => {
    const task = await this.tasksService.moveTask(req.params.taskId, req.user!.id, req.body);
    ApiResponse.success(res, 'Task moved successfully.', task);
  };

  assignUsers = async (req: Request, res: Response): Promise<void> => {
    const task = await this.tasksService.assignUsers(req.params.taskId, req.user!.id, req.body);
    ApiResponse.success(res, 'Task assigned successfully.', task);
  };

  unassignUser = async (req: Request, res: Response): Promise<void> => {
    await this.tasksService.unassignUser(req.params.taskId, req.params.userId, req.user!.id);
    ApiResponse.success(res, 'Assignee removed from task.');
  };

  setLabels = async (req: Request, res: Response): Promise<void> => {
    const task = await this.tasksService.setTaskLabels(req.params.taskId, req.body);
    ApiResponse.success(res, 'Task labels updated.', task);
  };

  archive = async (req: Request, res: Response): Promise<void> => {
    await this.tasksService.archiveTask(req.params.taskId, req.user!.id);
    ApiResponse.success(res, 'Task archived successfully.');
  };
}

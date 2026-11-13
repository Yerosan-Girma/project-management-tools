import { Request, Response } from 'express';
import { WorkspacesService } from './workspaces.service';
import { ApiResponse } from '../../utils/api-response';
import { parsePagination, formatPaginatedResponse } from '../../utils/pagination';
import { WorkspaceRole } from '../../constants/roles';

export class WorkspacesController {
  constructor(private readonly workspacesService: WorkspacesService = new WorkspacesService()) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const workspace = await this.workspacesService.createWorkspace(req.user!.id, req.body);
    ApiResponse.created(res, 'Workspace created successfully.', workspace);
  };

  listMyWorkspaces = async (req: Request, res: Response): Promise<void> => {
    const workspaces = await this.workspacesService.listUserWorkspaces(req.user!.id, req.user?.role);
    ApiResponse.success(res, 'Workspaces retrieved successfully.', workspaces);
  };

  getDetails = async (req: Request, res: Response): Promise<void> => {
    const workspace = await this.workspacesService.getWorkspaceDetails(
      req.params.workspaceId,
      req.user!.id
    );
    ApiResponse.success(res, 'Workspace details retrieved successfully.', workspace);
  };

  update = async (req: Request, res: Response): Promise<void> => {
    const workspace = await this.workspacesService.updateWorkspace(
      req.params.workspaceId,
      req.body,
      req.user!.id
    );
    ApiResponse.success(res, 'Workspace updated successfully.', workspace);
  };

  archive = async (req: Request, res: Response): Promise<void> => {
    await this.workspacesService.archiveWorkspace(req.params.workspaceId, req.user!.id);
    ApiResponse.success(res, 'Workspace archived successfully.');
  };

  listMembers = async (req: Request, res: Response): Promise<void> => {
    const pagination = parsePagination(req.query);
    const query = req.query.query as string | undefined;
    const role = req.query.role as WorkspaceRole | undefined;

    const { total, items } = await this.workspacesService.listMembers(
      req.params.workspaceId,
      query,
      role,
      pagination.skip,
      pagination.limit
    );

    const formatted = formatPaginatedResponse(items, total, pagination);
    ApiResponse.success(res, 'Workspace members retrieved.', formatted);
  };

  updateMemberRole = async (req: Request, res: Response): Promise<void> => {
    const updated = await this.workspacesService.updateMemberRole(
      req.params.workspaceId,
      req.params.memberId,
      req.body,
      req.user!.id
    );
    ApiResponse.success(res, 'Member role updated successfully.', updated);
  };

  removeMember = async (req: Request, res: Response): Promise<void> => {
    await this.workspacesService.removeMember(
      req.params.workspaceId,
      req.params.memberId,
      req.user!.id
    );
    ApiResponse.success(res, 'Member removed from workspace successfully.');
  };

  transferOwnership = async (req: Request, res: Response): Promise<void> => {
    await this.workspacesService.transferOwnership(
      req.params.workspaceId,
      req.user!.id,
      req.body
    );
    ApiResponse.success(res, 'Workspace ownership transferred successfully.');
  };
}

import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { ApiResponse } from '../../utils/api-response';
import { parsePagination, formatPaginatedResponse } from '../../utils/pagination';

export class UsersController {
  constructor(private readonly usersService: UsersService = new UsersService()) {}

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    const updated = await this.usersService.updateProfile(req.user!.id, req.body);
    ApiResponse.success(res, 'Profile updated successfully.', updated);
  };

  changePassword = async (req: Request, res: Response): Promise<void> => {
    await this.usersService.changePassword(req.user!.id, req.body);
    ApiResponse.success(res, 'Password changed successfully.');
  };

  searchUsers = async (req: Request, res: Response): Promise<void> => {
    const query = (req.query.query as string) || '';
    const users = await this.usersService.searchUsers(query, req.user!.id);
    ApiResponse.success(res, 'Users found.', users);
  };

  // Platform admin endpoints
  listPlatformUsers = async (req: Request, res: Response): Promise<void> => {
    const pagination = parsePagination(req.query);
    const { total, items } = await this.usersService.listPlatformUsers({
      search: req.query.search as string,
      role: req.query.role as any,
      status: req.query.status as any,
      skip: pagination.skip,
      take: pagination.limit,
    });
    const formatted = formatPaginatedResponse(items, total, pagination);
    ApiResponse.success(res, 'Platform users retrieved.', formatted);
  };

  getUserDetails = async (req: Request, res: Response): Promise<void> => {
    const user = await this.usersService.getUserDetails(req.params.userId);
    ApiResponse.success(res, 'User details retrieved.', user);
  };

  getPlatformStats = async (_req: Request, res: Response): Promise<void> => {
    const stats = await this.usersService.getPlatformStats();
    ApiResponse.success(res, 'Platform statistics retrieved.', stats);
  };

  updatePlatformRole = async (req: Request, res: Response): Promise<void> => {
    const updated = await this.usersService.updatePlatformRole(
      req.user!.id,
      req.params.userId,
      req.body
    );
    ApiResponse.success(res, 'Platform role updated successfully.', updated);
  };

  updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    const updated = await this.usersService.updateUserStatus(
      req.user!.id,
      req.params.userId,
      req.body
    );
    ApiResponse.success(res, 'User status updated successfully.', updated);
  };

  deleteUser = async (req: Request, res: Response): Promise<void> => {
    await this.usersService.deleteUser(req.user!.id, req.params.userId);
    ApiResponse.success(res, 'User deleted successfully.');
  };
}

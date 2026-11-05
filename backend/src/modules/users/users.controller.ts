import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { ApiResponse } from '../../utils/api-response';

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
}

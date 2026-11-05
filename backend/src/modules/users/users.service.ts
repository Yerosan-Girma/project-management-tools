import argon2 from 'argon2';
import { UsersRepository } from './users.repository';
import { AppError } from '../../utils/app-error';
import { UpdateProfileInput, ChangePasswordInput } from './users.schema';

export class UsersService {
  constructor(private readonly usersRepo: UsersRepository = new UsersRepository()) {}

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found.');
    }

    const updated = await this.usersRepo.update(userId, {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.avatarUrl !== undefined && { avatarUrl: input.avatarUrl })
    });

    return {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      avatarUrl: updated.avatarUrl,
      platformRole: updated.platformRole,
      status: updated.status,
      emailVerifiedAt: updated.emailVerifiedAt,
      updatedAt: updated.updatedAt
    };
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw AppError.notFound('User not found.');
    }

    const validPassword = await argon2.verify(user.passwordHash, input.currentPassword);
    if (!validPassword) {
      throw AppError.badRequest('Current password provided is incorrect.');
    }

    const newHash = await argon2.hash(input.newPassword, {
      type: argon2.argon2id
    });

    await this.usersRepo.update(userId, { passwordHash: newHash });
    return true;
  }

  async searchUsers(query: string, currentUserId: string) {
    return this.usersRepo.searchUsers(query, currentUserId);
  }
}

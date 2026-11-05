import { prisma } from '../../config/database';
import { User } from '@prisma/client';

export class UsersRepository {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findFirst({
      where: { id, deletedAt: null }
    });
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    return prisma.user.update({
      where: { id },
      data
    });
  }

  async searchUsers(query: string, currentUserId: string): Promise<Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>[]> {
    return prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          { deletedAt: null },
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { email: { contains: query, mode: 'insensitive' } }
            ]
          }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true
      },
      take: 20
    });
  }
}

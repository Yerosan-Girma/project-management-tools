import { prisma } from '../../config/database';
import { User, PlatformRole, UserStatus } from '@prisma/client';

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

  async listPlatformUsers(params?: {
    search?: string;
    role?: PlatformRole;
    status?: UserStatus;
    skip?: number;
    take?: number;
  }) {
    const where: any = { deletedAt: null };
    if (params?.role) where.platformRole = params.role;
    if (params?.status) where.status = params.status;
    if (params?.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    const [total, items] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          platformRole: true,
          status: true,
          emailVerifiedAt: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              workspaceMemberships: true,
              projectMemberships: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: params?.skip || 0,
        take: params?.take || 20
      })
    ]);

    return { total, items };
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

import { z } from 'zod';
import { PlatformRole } from '../../constants/roles';
import { UserStatus } from '../../constants/status';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().nullable().optional()
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters long')
    .max(100)
    .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
});

export const searchUsersSchema = z.object({
  query: z.string().min(1, 'Search query required').max(100)
});

export const updatePlatformRoleSchema = z.object({
  platformRole: z.enum([PlatformRole.PLATFORM_ADMIN, PlatformRole.USER])
});

export const updateUserStatusSchema = z.object({
  status: z.enum([UserStatus.ACTIVE, UserStatus.INACTIVE, UserStatus.SUSPENDED])
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdatePlatformRoleInput = z.infer<typeof updatePlatformRoleSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;

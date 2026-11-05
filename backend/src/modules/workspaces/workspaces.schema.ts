import { z } from 'zod';
import { WorkspaceRole } from '../../constants/roles';

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, 'Workspace name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  avatarUrl: z.string().url().optional()
});

export const updateWorkspaceSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  avatarUrl: z.string().url().nullable().optional()
});

export const updateMemberRoleSchema = z.object({
  role: z.enum([WorkspaceRole.ADMIN, WorkspaceRole.MEMBER, WorkspaceRole.GUEST])
});

export const transferOwnershipSchema = z.object({
  newOwnerUserId: z.string().uuid('Invalid user UUID')
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;

import { z } from 'zod';
import { ProjectStatus, PriorityLevel } from '../../constants/status';
import { ProjectRole } from '../../constants/roles';

export const createProjectSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace UUID'),
  name: z.string().min(2, 'Project name must be at least 2 characters').max(120),
  key: z
    .string()
    .min(2, 'Project key must be at least 2 characters')
    .max(10, 'Project key max 10 characters')
    .toUpperCase()
    .regex(/^[A-Z0-9]+$/, 'Project key must be alphanumeric uppercase'),
  description: z.string().max(1000).optional(),
  priority: z.enum([PriorityLevel.LOW, PriorityLevel.MEDIUM, PriorityLevel.HIGH, PriorityLevel.URGENT]).default(PriorityLevel.MEDIUM),
  startDate: z.string().datetime().optional().nullable(),
  targetDate: z.string().datetime().optional().nullable()
});

export const updateProjectSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  description: z.string().max(1000).nullable().optional(),
  status: z.enum([ProjectStatus.PLANNING, ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD, ProjectStatus.COMPLETED, ProjectStatus.ARCHIVED]).optional(),
  priority: z.enum([PriorityLevel.LOW, PriorityLevel.MEDIUM, PriorityLevel.HIGH, PriorityLevel.URGENT]).optional(),
  startDate: z.string().datetime().nullable().optional(),
  targetDate: z.string().datetime().nullable().optional()
});

export const addProjectMemberSchema = z.object({
  userId: z.string().uuid('Invalid user UUID'),
  role: z.enum([ProjectRole.MANAGER, ProjectRole.MEMBER, ProjectRole.VIEWER]).default(ProjectRole.MEMBER)
});

export const updateProjectMemberRoleSchema = z.object({
  role: z.enum([ProjectRole.MANAGER, ProjectRole.MEMBER, ProjectRole.VIEWER])
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddProjectMemberInput = z.infer<typeof addProjectMemberSchema>;
export type UpdateProjectMemberRoleInput = z.infer<typeof updateProjectMemberRoleSchema>;

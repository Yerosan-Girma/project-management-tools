import { z } from 'zod';
import { PriorityLevel } from '../../constants/status';

export const createTaskSchema = z.object({
  projectId: z.string().uuid('Invalid project UUID'),
  boardColumnId: z.string().uuid('Invalid board column UUID'),
  title: z.string().min(1, 'Task title is required').max(255),
  description: z.string().optional(),
  priority: z.enum([PriorityLevel.LOW, PriorityLevel.MEDIUM, PriorityLevel.HIGH, PriorityLevel.URGENT]).default(PriorityLevel.MEDIUM),
  position: z.number().optional(),
  dueDate: z.string().datetime().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  assigneeIds: z.array(z.string().uuid()).optional(),
  labelIds: z.array(z.string().uuid()).optional()
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().nullable().optional(),
  priority: z.enum([PriorityLevel.LOW, PriorityLevel.MEDIUM, PriorityLevel.HIGH, PriorityLevel.URGENT]).optional(),
  dueDate: z.string().datetime().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  isArchived: z.boolean().optional()
});

export const moveTaskSchema = z.object({
  destinationColumnId: z.string().uuid('Invalid column UUID'),
  newPosition: z.number()
});

export const assignUsersSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'At least one user ID required')
});

export const taskLabelsSchema = z.object({
  labelIds: z.array(z.string().uuid())
});

export const taskQuerySchema = z.object({
  boardColumnId: z.string().uuid().optional(),
  priority: z.enum([PriorityLevel.LOW, PriorityLevel.MEDIUM, PriorityLevel.HIGH, PriorityLevel.URGENT]).optional(),
  assigneeId: z.string().uuid().optional(),
  labelId: z.string().uuid().optional(),
  search: z.string().optional(),
  dueDateFrom: z.string().datetime().optional(),
  dueDateTo: z.string().datetime().optional(),
  isArchived: z.string().transform((v) => v === 'true').optional(),
  page: z.string().optional(),
  limit: z.string().optional()
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type MoveTaskInput = z.infer<typeof moveTaskSchema>;
export type AssignUsersInput = z.infer<typeof assignUsersSchema>;
export type TaskLabelsInput = z.infer<typeof taskLabelsSchema>;
export type TaskQueryInput = z.infer<typeof taskQuerySchema>;

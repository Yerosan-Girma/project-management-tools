import { z } from 'zod';

export const createBoardSchema = z.object({
  projectId: z.string().uuid('Invalid project UUID'),
  name: z.string().min(2, 'Board name must be at least 2 characters').max(100),
  description: z.string().max(500).optional(),
  position: z.number().optional()
});

export const updateBoardSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).nullable().optional(),
  position: z.number().optional()
});

export type CreateBoardInput = z.infer<typeof createBoardSchema>;
export type UpdateBoardInput = z.infer<typeof updateBoardSchema>;

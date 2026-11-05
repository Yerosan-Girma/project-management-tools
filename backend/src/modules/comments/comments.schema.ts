import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty').max(5000),
  parentId: z.string().uuid('Invalid parent comment UUID').optional()
});

export const updateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content cannot be empty').max(5000)
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type UpdateCommentInput = z.infer<typeof updateCommentSchema>;

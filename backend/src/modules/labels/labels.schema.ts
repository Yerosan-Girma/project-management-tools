import { z } from 'zod';

export const createLabelSchema = z.object({
  workspaceId: z.string().uuid('Invalid workspace UUID'),
  name: z.string().min(1, 'Label name must be at least 1 character').max(50),
  color: z.string().min(1).max(20).regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Color must be a valid hex code (e.g. #3B82F6)')
});

export const updateLabelSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().max(20).regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/).optional()
});

export type CreateLabelInput = z.infer<typeof createLabelSchema>;
export type UpdateLabelInput = z.infer<typeof updateLabelSchema>;

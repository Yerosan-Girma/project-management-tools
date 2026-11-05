import { z } from 'zod';

export const createColumnSchema = z.object({
  boardId: z.string().uuid('Invalid board UUID'),
  name: z.string().min(1, 'Column name must be at least 1 character').max(60),
  color: z.string().max(20).optional(),
  taskLimit: z.number().int().positive().nullable().optional(),
  isCompletedColumn: z.boolean().default(false),
  position: z.number().optional()
});

export const updateColumnSchema = z.object({
  name: z.string().min(1).max(60).optional(),
  color: z.string().max(20).nullable().optional(),
  taskLimit: z.number().int().positive().nullable().optional(),
  isCompletedColumn: z.boolean().optional(),
  position: z.number().optional()
});

export const reorderColumnsSchema = z.object({
  boardId: z.string().uuid('Invalid board UUID'),
  columns: z.array(
    z.object({
      id: z.string().uuid(),
      position: z.number()
    })
  ).min(1)
});

export const deleteColumnSchema = z.object({
  targetColumnId: z.string().uuid().optional()
});

export type CreateColumnInput = z.infer<typeof createColumnSchema>;
export type UpdateColumnInput = z.infer<typeof updateColumnSchema>;
export type ReorderColumnsInput = z.infer<typeof reorderColumnsSchema>;
export type DeleteColumnInput = z.infer<typeof deleteColumnSchema>;

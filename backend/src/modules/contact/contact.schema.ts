import { z } from 'zod';

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
  email: z.string().trim().toLowerCase().email('Please provide a valid email address'),
  topic: z.enum(['product', 'pricing', 'security', 'other']).default('product'),
  message: z.string().trim().min(5, 'Message must be at least 5 characters').max(5000, 'Message cannot exceed 5000 characters'),
});

export type ContactMessageInput = z.infer<typeof contactMessageSchema>;

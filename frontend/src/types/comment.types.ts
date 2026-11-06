import { User } from './auth.types';

export interface Comment {
  id: string;
  taskId: string;
  authorId: string;
  content: string;
  parentId?: string | null;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  author?: User;
  replies?: Comment[];
}

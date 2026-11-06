import { User } from './auth.types';
import { PriorityLevel } from './project.types';
import { BoardColumn } from './board.types';

export type { PriorityLevel };

export interface TaskLabel {
  id: string;
  workspaceId: string;
  name: string;
  color: string;
}

export interface TaskAssignee {
  id: string;
  taskId: string;
  userId: string;
  assignedAt: string;
  user: User;
}

export interface Task {
  id: string;
  projectId: string;
  boardColumnId: string;
  columnId?: string; // alias helper
  title: string;
  description?: string | null;
  priority: PriorityLevel;
  position: number;
  dueDate?: string | null;
  startDate?: string | null;
  completedAt?: string | null;
  createdById: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  code?: string;
  project?: {
    id: string;
    key: string;
    name: string;
  };
  assignees?: TaskAssignee[];
  labels?: Array<{ label: TaskLabel }>;
  column?: BoardColumn;
  _count?: {
    comments: number;
    attachments: number;
  };
}

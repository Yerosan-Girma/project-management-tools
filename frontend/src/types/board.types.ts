export interface BoardColumn {
  id: string;
  boardId: string;
  name: string;
  color?: string | null;
  position: number;
  taskLimit?: number | null;
  isCompletedColumn: boolean;
  createdAt: string;
  updatedAt: string;
  tasks?: any[];
  _count?: {
    tasks: number;
  };
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  position: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  columns?: BoardColumn[];
  _count?: {
    columns: number;
  };
}

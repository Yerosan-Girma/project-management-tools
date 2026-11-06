export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
  error?: {
    code: string;
    details?: Array<{ field?: string; message: string }>;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages?: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface PaginatedResult<T> {
  items: T[];
  pagination: PaginationMeta;
}

export type PaginatedResponse<T> = PaginatedResult<T>;

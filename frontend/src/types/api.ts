export interface ApiSuccess<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: PaginationMeta;
}

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiError {
  success: false;
  error: ApiErrorPayload;
  status?: number;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  isPublic?: boolean;
  body?: unknown;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  ok: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    hasMore: boolean;
    cursor?: string;
  };
}

export interface User {
  id: string;
  email: string;
}

export interface AuthUser {
  user: User;
  supabase: any;
}

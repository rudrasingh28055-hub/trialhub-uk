export type AppRole = 'athlete' | 'club' | 'admin';
export type AccountStatus = 'active' | 'pending_review' | 'suspended' | 'deleted';

export interface User {
  id: string;
  email: string;
  role: AppRole;
  status: AccountStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateUserInput {
  email: string;
  role: AppRole;
}

export interface UpdateUserInput {
  role?: AppRole;
  status?: AccountStatus;
}

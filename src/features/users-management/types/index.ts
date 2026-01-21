import type { User, UserRole } from '@/features/auth/types';

export interface CreateUserInput {
  username: string;
  password: string;
  role: UserRole;
}

export interface UpdateUserInput {
  id: string;
  username?: string;
  role?: UserRole;
}

export interface ResetPasswordInput {
  userId: string;
  newPassword: string;
}

export interface UsersListState {
  users: User[];
  isLoading: boolean;
  error: string | null;
}

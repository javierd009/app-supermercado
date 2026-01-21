export type UserRole = 'super_admin' | 'admin' | 'cashier';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: number;
}

export interface LoginCredentials {
  username?: string; // Opcional para compatibilidad, pero no se usa en login por contraseña
  password: string;
}

export interface LoginResponse {
  success: boolean;
  session?: AuthSession;
  error?: string;
}

export interface AuthState {
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Permisos por rol
export const rolePermissions: Record<UserRole, string[]> = {
  super_admin: [
    'users:create',
    'users:read',
    'users:update',
    'users:delete',
    'products:create',
    'products:read',
    'products:update',
    'products:delete',
    'sales:read',
    'sales:create',
    'cash_register:open',
    'cash_register:close',
    'reports:read',
    'reports:export',
    'config:update',
    'dashboard:access',
  ],
  admin: [
    'users:read',
    'products:create',
    'products:read',
    'products:update',
    'products:delete',
    'sales:read',
    'sales:create',
    'cash_register:open',
    'cash_register:close',
    'reports:read',
    'reports:export',
    'config:update',
  ],
  cashier: [
    'products:read',
    'sales:create',
    'cash_register:open',
  ],
};

// Helper para verificar permisos
export function hasPermission(role: UserRole, permission: string): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

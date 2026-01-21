import { useEffect } from 'react';
import { useAuthStore, selectUser, selectUserRole, selectIsAuthenticated } from '../store/authStore';
import { loginAction } from '../actions/authActions';
import type { LoginCredentials, UserRole } from '../types';
import { hasPermission } from '../types';

/**
 * Hook principal de autenticación
 */
export function useAuth() {
  const session = useAuthStore((state) => state.session);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const user = useAuthStore(selectUser);
  const userRole = useAuthStore(selectUserRole);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);

  const setSession = useAuthStore((state) => state.setSession);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setError = useAuthStore((state) => state.setError);
  const clearSession = useAuthStore((state) => state.clearSession);
  const isSessionValid = useAuthStore((state) => state.isSessionValid);

  // Verificar validez de sesión al montar
  useEffect(() => {
    if (!isSessionValid()) {
      clearSession();
    }
  }, [isSessionValid, clearSession]);

  return {
    session,
    user,
    userRole,
    isAuthenticated,
    isLoading,
    error,
    setSession,
    setLoading,
    setError,
    clearSession,
    isSessionValid,
  };
}

/**
 * Hook para login
 */
export function useLogin() {
  const { setSession, setLoading, setError } = useAuth();

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);

    // IMPORTANTE: En Electron, ejecutar authService directamente en el cliente
    // porque window.electronAPI no está disponible en Server Actions
    const isElectron = typeof window !== 'undefined' &&
                       window.electronAPI &&
                       window.electronAPI.isElectron === true;

    let response;

    if (isElectron) {
      // Importar authService dinámicamente solo en el cliente
      const { authService } = await import('../services/authService');
      console.log('[useLogin] Ejecutando login en cliente (Electron)');
      response = await authService.login(credentials);
    } else {
      // En navegador web, usar Server Action
      console.log('[useLogin] Ejecutando login via Server Action');
      response = await loginAction(credentials.password);
    }

    if (response.success && response.session) {
      setSession(response.session);
      return { success: true };
    } else {
      setError(response.error || 'Error al iniciar sesión');
      return { success: false, error: response.error };
    }
  };

  return { login };
}

/**
 * Hook para logout
 */
export function useLogout() {
  const { clearSession } = useAuth();

  const logout = async () => {
    // Limpiar sesión local (no hay logout en servidor)
    clearSession();

    // Limpiar localStorage de POS windows
    // Esto previene que las ventanas/carritos de un usuario aparezcan para otro
    localStorage.removeItem('pos-window-manager');
  };

  return { logout };
}

/**
 * Hook para verificar permisos
 */
export function usePermission(permission: string): boolean {
  const { userRole } = useAuth();

  if (!userRole) return false;

  return hasPermission(userRole, permission);
}

/**
 * Hook para requerir autenticación
 * Redirige al login si no está autenticado
 */
export function useRequireAuth(requiredRole?: UserRole) {
  const { isAuthenticated, userRole, isSessionValid } = useAuth();

  useEffect(() => {
    // Verificar si la sesión es válida
    if (!isSessionValid()) {
      // Redirigir al login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return;
    }

    // Verificar rol requerido
    if (requiredRole && userRole !== requiredRole) {
      // Si el rol actual no es suficiente
      const roleHierarchy: Record<UserRole, number> = {
        cashier: 1,
        admin: 2,
        super_admin: 3,
      };

      const currentLevel = userRole ? roleHierarchy[userRole] : 0;
      const requiredLevel = roleHierarchy[requiredRole];

      if (currentLevel < requiredLevel) {
        console.error('Insufficient permissions');
        // Redirigir a página de acceso denegado
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard';
        }
      }
    }
  }, [isAuthenticated, userRole, requiredRole, isSessionValid]);

  return { isAuthenticated, userRole };
}

/**
 * Hook para verificar si el usuario tiene un rol específico
 */
export function useHasRole(role: UserRole): boolean {
  const { userRole } = useAuth();

  if (!userRole) return false;

  const roleHierarchy: Record<UserRole, number> = {
    cashier: 1,
    admin: 2,
    super_admin: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[role];
}

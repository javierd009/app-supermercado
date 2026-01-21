import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, AuthSession, User } from '../types';

interface AuthStore extends AuthState {
  // Actions
  setSession: (session: AuthSession | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearSession: () => void;
  updateUser: (user: Partial<User>) => void;
  isSessionValid: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // State inicial
      session: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Establecer sesión
      setSession: (session) =>
        set({
          session,
          isAuthenticated: !!session,
          error: null,
        }),

      // Establecer loading
      setLoading: (isLoading) => set({ isLoading }),

      // Establecer error
      setError: (error) => set({ error, isLoading: false }),

      // Limpiar sesión (logout)
      clearSession: () =>
        set({
          session: null,
          isAuthenticated: false,
          error: null,
        }),

      // Actualizar datos del usuario
      updateUser: (updates) => {
        const { session } = get();
        if (!session) return;

        set({
          session: {
            ...session,
            user: {
              ...session.user,
              ...updates,
            },
          },
        });
      },

      // Verificar si la sesión es válida
      isSessionValid: () => {
        const { session } = get();
        if (!session) return false;

        // Verificar si la sesión expiró
        const now = Date.now();
        if (now > session.expiresAt) {
          get().clearSession();
          return false;
        }

        return true;
      },
    }),
    {
      name: 'sabrosita-auth-storage', // Nombre en localStorage
      partialize: (state) => ({
        // Solo persistir session, no loading ni error
        session: state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Selector helpers
export const selectUser = (state: AuthStore) => state.session?.user;
export const selectUserRole = (state: AuthStore) => state.session?.user.role;
export const selectIsAuthenticated = (state: AuthStore) => state.isAuthenticated;

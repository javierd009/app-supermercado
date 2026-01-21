'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';
import type { UserRole } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  fallback?: React.ReactNode;
}

/**
 * Componente para proteger rutas que requieren autenticación
 * Redirige al login si no está autenticado
 */
export function ProtectedRoute({
  children,
  requiredRole,
  fallback,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, userRole, isSessionValid } = useAuth();

  useEffect(() => {
    // Verificar si la sesión es válida
    if (!isSessionValid()) {
      router.push('/login');
      return;
    }

    // Verificar rol requerido
    if (requiredRole && userRole) {
      const roleHierarchy: Record<UserRole, number> = {
        cashier: 1,
        admin: 2,
        super_admin: 3,
      };

      const currentLevel = roleHierarchy[userRole];
      const requiredLevel = roleHierarchy[requiredRole];

      if (currentLevel < requiredLevel) {
        // Rol insuficiente
        router.push('/dashboard');
      }
    }
  }, [isAuthenticated, userRole, requiredRole, isSessionValid, router]);

  // Mostrar loading mientras verifica
  if (!isAuthenticated) {
    return (
      fallback || (
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-gray-600">Verificando sesión...</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}

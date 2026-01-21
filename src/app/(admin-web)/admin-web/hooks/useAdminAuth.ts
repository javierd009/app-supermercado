'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AdminUser {
  id: string;
  username: string;
  role: 'admin' | 'super_admin';
}

interface AdminSession {
  user: AdminUser;
  expiresAt: string;
}

export function useAdminAuth() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = () => {
    try {
      const sessionData = localStorage.getItem('admin-web-session');

      if (!sessionData) {
        router.push('/admin-web/login');
        return;
      }

      const session: AdminSession = JSON.parse(sessionData);

      // Verificar si la sesión expiró
      if (new Date(session.expiresAt) < new Date()) {
        logout();
        return;
      }

      setUser(session.user);
    } catch (error) {
      console.error('Error checking auth:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('admin-web-session');
    router.push('/admin-web/login');
  };

  const refreshSession = () => {
    try {
      const sessionData = localStorage.getItem('admin-web-session');
      if (!sessionData) return;

      const session: AdminSession = JSON.parse(sessionData);

      // Extender sesión por 8 horas más
      session.expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      localStorage.setItem('admin-web-session', JSON.stringify(session));
    } catch (error) {
      console.error('Error refreshing session:', error);
    }
  };

  return {
    user,
    isLoading,
    logout,
    refreshSession,
  };
}

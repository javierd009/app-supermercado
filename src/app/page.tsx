'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isSessionValid } = useAuth();

  useEffect(() => {
    if (isSessionValid()) {
      // Si está autenticado, redirigir al dashboard
      router.push('/dashboard');
    } else {
      // Si no está autenticado, redirigir al login
      router.push('/login');
    }
  }, [isAuthenticated, isSessionValid, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Cargando...</p>
      </div>
    </main>
  );
}

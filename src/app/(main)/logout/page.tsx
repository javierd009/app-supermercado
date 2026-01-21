'use client';

import { useEffect } from 'react';
import { useLogout } from '@/features/auth/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const { logout } = useLogout();
  const router = useRouter();

  useEffect(() => {
    const handleLogout = async () => {
      await logout();
      router.push('/login');
    };

    handleLogout();
  }, [logout, router]);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="border-2 border-gray-300 bg-white p-12">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin border-4 border-blue-600 border-t-transparent bg-white mb-6"></div>
          <p className="text-lg font-bold text-gray-700" style={{ fontFamily: 'Arial, sans-serif' }}>
            CERRANDO SESIÓN...
          </p>
        </div>
      </div>
    </div>
  );
}

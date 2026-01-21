'use client';

import { useAdminAuth } from '../hooks/useAdminAuth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  DollarSign,
  Users,
  BarChart3,
  LogOut,
  Smartphone,
  Settings,
} from 'lucide-react';

export default function AdminWebProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, logout } = useAdminAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white font-bold">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // useAdminAuth ya redirige al login
  }

  const navigation = [
    { name: 'Dashboard', href: '/admin-web/dashboard', icon: LayoutDashboard },
    { name: 'Productos', href: '/admin-web/products', icon: Package },
    { name: 'Configuración', href: '/admin-web/config', icon: DollarSign },
    { name: 'Clientes', href: '/admin-web/customers', icon: Users },
    { name: 'Reportes', href: '/admin-web/reports', icon: BarChart3 },
  ];

  if (user.role === 'super_admin') {
    navigation.push({ name: 'Usuarios', href: '/admin-web/users', icon: Settings });
  }

  return (
    <div className="min-h-screen bg-[#020617]">
      {/* Mobile Header */}
      <header className="bg-[#020617] border-b border-white/10 lg:hidden sticky top-0 z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2 rounded-xl">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-black text-base">SABROSITA</h1>
              <p className="text-blue-400 text-sm font-bold">Admin Web</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      <div className="lg:flex">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-64 bg-[#020617] border-r border-white/10">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-3 rounded-xl">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-black text-xl">SABROSITA</h1>
                <p className="text-blue-400 text-sm font-bold uppercase">Admin Web</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-base transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info & Logout */}
          <div className="p-4 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-4 mb-3">
              <p className="text-white font-bold text-base">{user.username}</p>
              <p className="text-blue-400 text-sm font-medium uppercase mt-1">
                {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </p>
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-base px-4 py-3 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="lg:ml-64 flex-1 min-h-screen">
          {children}
        </main>
      </div>

      {/* Bottom Navigation Mobile */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#020617] border-t border-white/10 px-2 py-2 grid grid-cols-5 gap-1 z-50">
        {navigation.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center gap-1 px-2 py-2 rounded-xl font-bold text-sm transition-all ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate w-full text-center">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { UsersList } from '@/features/users-management/components/UsersList';
import { UserForm } from '@/features/users-management/components/UserForm';
import type { User } from '@/features/auth/types';
import { Users, Home, LogOut, Plus, Shield, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function UsersManagementPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateNew = () => {
    setSelectedUser(null);
    setShowForm(true);
  };

  const handleEdit = (editUser: User) => {
    setSelectedUser(editUser);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedUser(null);
    setRefreshKey(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setSelectedUser(null);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Header */}
      <header className="min-h-[4.5rem] md:h-20 px-3 md:px-8 flex items-center justify-between border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-2 md:gap-6 flex-1 min-w-0">
          <Link href="/dashboard" className="flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-700 p-2 md:p-2.5 rounded-xl border border-white/20 shadow-xl hover:scale-105 transition-transform">
            <Home className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 md:gap-2">
              <Users className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />
              <p className="text-base md:text-xl font-black text-white tracking-tight uppercase truncate">Gestión de Usuarios</p>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider hidden sm:block">Administración de accesos</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
          <button
            onClick={handleCreateNew}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-3 md:px-6 py-2.5 md:py-3 rounded-xl text-white font-bold text-xs md:text-sm transition-all flex items-center gap-1.5 md:gap-2 shadow-lg shadow-blue-500/30 uppercase tracking-wide"
            title="Crear Usuario"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Crear Usuario</span>
          </button>

          <Link href="/dashboard" className="hidden md:block">
            <button className="px-4 py-2 bg-white/5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all border border-white/5 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide hidden sm:inline">Volver</span>
            </button>
          </Link>

          <Link href="/logout" className="hidden md:block">
            <button className="p-3 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-white/5">
              <LogOut className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Roles Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
            <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
              <Shield className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Cajeros</p>
            <p className="text-xs text-slate-400 mt-2 font-medium">Pueden registrar ventas y abrir caja</p>
          </div>

          <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
            <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
              <Shield className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Administradores</p>
            <p className="text-xs text-slate-400 mt-2 font-medium">Gestiona productos, ventas y configuración</p>
          </div>

          <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
            <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
              <Shield className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Super Admin</p>
            <p className="text-xs text-slate-400 mt-2 font-medium">Acceso total al sistema (único)</p>
          </div>
        </div>

        {/* Users List */}
        <div key={refreshKey}>
          <UsersList onEdit={handleEdit} />
        </div>

        {/* User Form Modal */}
        {showForm && (
          <UserForm
            user={selectedUser}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        )}
      </main>

      <footer className="py-6 px-8 bg-[#020617]/80 backdrop-blur-xl border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-lg font-black text-white uppercase tracking-wider">SABROSITA</p>
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wide">
            © 2026 Sabrosita POS v1.0
          </p>
        </div>
      </footer>
    </div>
  );
}

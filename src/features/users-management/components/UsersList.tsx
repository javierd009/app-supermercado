'use client';

import { useState } from 'react';
import { useUsers, useDeleteUser } from '../hooks/useUsers';
import type { User } from '@/features/auth/types';

interface UsersListProps {
  onEdit: (user: User) => void;
}

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Administrador',
  cashier: 'Cajero',
};

const ROLE_COLORS = {
  super_admin: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  admin: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  cashier: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export function UsersList({ onEdit }: UsersListProps) {
  const { users, isLoading, reloadUsers } = useUsers();
  const { deleteUser } = useDeleteUser();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      const result = await deleteUser(id);

      if (result.success) {
        setDeleteConfirm(null);
        reloadUsers();
      } else {
        alert(result.error || 'Error al eliminar usuario');
        setDeleteConfirm(null);
      }
    } else {
      setDeleteConfirm(id);
      // Auto-cancel después de 3 segundos
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-12">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
          <p className="mt-4 text-slate-400 font-bold uppercase tracking-wide text-sm">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Usuarios del Sistema</h3>
            <p className="text-sm text-blue-100 mt-1">
              Total: <span className="font-semibold text-white">{users.length}</span> usuario{users.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                Username
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                Rol
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                Fecha de Creación
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-white/10 p-6 mb-4">
                      <svg className="h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-slate-400">No hay usuarios registrados</p>
                  </div>
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isSuperAdmin = user.role === 'super_admin';

                return (
                  <tr
                    key={user.id}
                    className="transition-colors hover:bg-white/5"
                  >
                    <td className="px-6 py-4 text-sm font-semibold text-white">
                      {user.username}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${ROLE_COLORS[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {new Date(user.createdAt).toLocaleDateString('es-CR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => onEdit(user)}
                          className="rounded-xl px-4 py-2 font-bold text-blue-400 transition-all hover:bg-blue-500/10 uppercase tracking-wide text-xs"
                        >
                          Editar
                        </button>
                        {!isSuperAdmin && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            className={`rounded-xl px-4 py-2 font-bold transition-all uppercase tracking-wide text-xs ${
                              deleteConfirm === user.id
                                ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30'
                                : 'text-rose-400 hover:bg-rose-500/10'
                            }`}
                          >
                            {deleteConfirm === user.id ? '✓ Confirmar' : 'Eliminar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

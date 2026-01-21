'use client';

import { useState, useEffect } from 'react';
import { createUserAction, resetPasswordAction } from '../actions/userActions';
import { usersService } from '../services/usersService';
import type { User, UserRole } from '@/features/auth/types';

interface UserFormProps {
  user?: User | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const ROLE_OPTIONS: { value: UserRole; label: string; description: string }[] = [
  {
    value: 'cashier',
    label: 'Cajero',
    description: 'Puede registrar ventas y abrir caja',
  },
  {
    value: 'admin',
    label: 'Administrador',
    description: 'Gestiona productos, ventas y configuración',
  },
  {
    value: 'super_admin',
    label: 'Super Administrador',
    description: 'Acceso total al sistema (solo un usuario)',
  },
];

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const isEditing = !!user;

  const [formData, setFormData] = useState({
    username: user?.username || '',
    password: '',
    confirmPassword: '',
    role: (user?.role || 'cashier') as UserRole,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        password: '',
        confirmPassword: '',
        role: user.role,
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isEditing) {
        // Editar usuario existente
        if (user.username !== formData.username) {
          const usernameResult = await usersService.updateUsername(user.id, formData.username);
          if (!usernameResult.success) {
            setError(usernameResult.error || 'Error al actualizar username');
            setIsSubmitting(false);
            return;
          }
        }

        if (user.role !== formData.role) {
          const roleResult = await usersService.updateUserRole(user.id, formData.role);
          if (!roleResult.success) {
            setError(roleResult.error || 'Error al actualizar rol');
            setIsSubmitting(false);
            return;
          }
        }

        onSuccess();
      } else {
        // Crear nuevo usuario
        if (formData.password !== formData.confirmPassword) {
          setError('Las contraseñas no coinciden');
          setIsSubmitting(false);
          return;
        }

        if (formData.password.length < 4) {
          setError('La contraseña debe tener al menos 4 caracteres');
          setIsSubmitting(false);
          return;
        }

        // Detectar si estamos en Electron para usar el servicio directamente
        const isElectron =
          typeof window !== 'undefined' &&
          (window as any).electronAPI?.isElectron === true;

        let result;
        if (isElectron) {
          // En Electron, usar servicio directamente (funciona offline)
          result = await usersService.createUser(
            formData.username,
            formData.password,
            formData.role
          );
        } else {
          // En web, usar Server Action
          result = await createUserAction(
            formData.username,
            formData.password,
            formData.role
          );
        }

        if (!result.success) {
          setError(result.error || 'Error al crear usuario');
          setIsSubmitting(false);
          return;
        }

        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    // Detectar si estamos en Electron para usar el servicio directamente
    const isElectron =
      typeof window !== 'undefined' &&
      (window as any).electronAPI?.isElectron === true;

    let result;
    if (isElectron) {
      // En Electron, usar servicio directamente (funciona offline)
      result = await usersService.resetPassword(user.id, formData.password);
    } else {
      // En web, usar Server Action
      result = await resetPasswordAction(user.id, formData.password);
    }

    if (result.success) {
      setShowPasswordReset(false);
      setFormData({ ...formData, password: '', confirmPassword: '' });
      alert('Contraseña actualizada correctamente');
    } else {
      setError(result.error || 'Error al resetear contraseña');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-slate-200 bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
          <h2 className="text-2xl font-bold text-white">
            {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* Error message */}
          {error && (
            <div className="rounded-xl border-2 border-red-200 bg-red-50 p-4 text-red-800">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span className="font-semibold">{error}</span>
              </div>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              placeholder="Ej: cajero1"
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
            />
          </div>

          {/* Rol */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              Rol del Usuario *
            </label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: option.value })}
                  className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
                    formData.role === option.value
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-slate-900">{option.label}</p>
                      <p className="text-sm text-slate-600">{option.description}</p>
                    </div>
                    {formData.role === option.value && (
                      <svg className="h-5 w-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Contraseña (solo al crear) */}
          {!isEditing && (
            <>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={4}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Confirmar Contraseña *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={4}
                  placeholder="Repita la contraseña"
                  className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </>
          )}

          {/* Resetear contraseña (solo al editar) */}
          {isEditing && (
            <div className="border-t-2 border-slate-200 pt-6">
              {!showPasswordReset ? (
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                >
                  + Cambiar Contraseña
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm font-semibold text-slate-700">Resetear Contraseña</p>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      minLength={4}
                      placeholder="Mínimo 4 caracteres"
                      className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      minLength={4}
                      placeholder="Repita la contraseña"
                      className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10"
                    />
                  </div>

                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={isSubmitting}
                      className="rounded-xl bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                    >
                      Actualizar Contraseña
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordReset(false);
                        setFormData({ ...formData, password: '', confirmPassword: '' });
                        setError(null);
                      }}
                      className="rounded-xl border-2 border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 font-bold text-white shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>

            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-xl border-2 border-slate-300 px-6 py-4 font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

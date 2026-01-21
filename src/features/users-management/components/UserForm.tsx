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
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header moderno oscuro */}
        <div className="border-b border-white/10 bg-gradient-to-r from-indigo-600 to-purple-600 px-6 md:px-8 py-5 md:py-6">
          <div className="flex items-center">
            <div className="rounded-xl bg-white/20 p-2.5 md:p-3 mr-3 md:mr-4">
              <svg className="h-5 w-5 md:h-7 md:w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isEditing ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"} />
              </svg>
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
                {isEditing ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
              </h2>
              <p className="text-xs md:text-sm text-indigo-100 mt-1 font-medium">
                {isEditing ? 'Actualiza la información del usuario' : 'Completa la información del nuevo usuario'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 md:p-8 space-y-5 md:space-y-6">
          {/* Error message */}
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Username */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
              Username *
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
              placeholder="Ej: cajero1"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>

          {/* Rol */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">
              Rol del Usuario *
            </label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, role: option.value })}
                  className={`w-full rounded-xl border p-3 md:p-4 text-left transition-all ${
                    formData.role === option.value
                      ? 'border-indigo-500 bg-indigo-500/10'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white text-sm">{option.label}</p>
                      <p className="text-xs text-slate-400 mt-1">{option.description}</p>
                    </div>
                    {formData.role === option.value && (
                      <svg className="h-5 w-5 text-indigo-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Contraseña *
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={4}
                  placeholder="Mínimo 4 caracteres"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                  Confirmar Contraseña *
                </label>
                <input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  required
                  minLength={4}
                  placeholder="Repita la contraseña"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>
            </>
          )}

          {/* Resetear contraseña (solo al editar) */}
          {isEditing && (
            <div className="border-t border-white/10 pt-6">
              {!showPasswordReset ? (
                <button
                  type="button"
                  onClick={() => setShowPasswordReset(true)}
                  className="text-sm font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wide"
                >
                  + Cambiar Contraseña
                </button>
              ) : (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Resetear Contraseña</p>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      minLength={4}
                      placeholder="Mínimo 4 caracteres"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Confirmar Nueva Contraseña
                    </label>
                    <input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      minLength={4}
                      placeholder="Repita la contraseña"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={isSubmitting}
                      className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-sm font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-xl hover:shadow-indigo-500/30 disabled:opacity-50 uppercase tracking-wide"
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
                      className="w-full sm:w-auto rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white hover:bg-white/10 uppercase tracking-wide"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-xl bg-white/5 px-6 py-3 font-bold text-white border border-white/10 transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-50 uppercase tracking-wide"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none uppercase tracking-wide"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Guardando...
                </span>
              ) : (
                <span>{isEditing ? 'Guardar Cambios' : 'Crear Usuario'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

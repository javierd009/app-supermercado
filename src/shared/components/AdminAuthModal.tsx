'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import bcrypt from 'bcryptjs';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorized: () => void;
  title?: string;
  message?: string;
}

export function AdminAuthModal({
  isOpen,
  onClose,
  onAuthorized,
  title = 'Autorización Requerida',
  message = 'Esta acción requiere autorización de un Administrador o Manager'
}: AdminAuthModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();

      // Buscar usuario por username
      const { data: user, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toUpperCase())
        .single();

      if (fetchError || !user) {
        setError('Usuario no encontrado');
        setIsSubmitting(false);
        return;
      }

      // Verificar que sea admin o super_admin
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        setError('Este usuario no tiene permisos de administrador');
        setIsSubmitting(false);
        return;
      }

      // Verificar password (con bcrypt)
      const passwordMatch = await bcrypt.compare(password, user.password_hash);

      if (!passwordMatch) {
        setError('Contraseña incorrecta');
        setIsSubmitting(false);
        return;
      }

      // Autorización exitosa
      setUsername('');
      setPassword('');
      onAuthorized();
      onClose();
    } catch (err) {
      console.error('Error en autorización:', err);
      setError('Error al verificar credenciales');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setUsername('');
    setPassword('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4">
        <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="border-b border-white/10 bg-gradient-to-r from-amber-600 to-amber-700 px-6 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl mr-3">
                  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">
                  {title}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="text-white hover:bg-white/20 rounded-xl p-1.5 transition-all"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6">
            {/* Warning Message */}
            <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-amber-400 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm font-medium text-amber-200">
                  {message}
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-rose-400 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm font-bold text-rose-300">
                    {error}
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Usuario */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                  USUARIO ADMINISTRADOR
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Usuario Admin/Manager"
                  autoFocus
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-white uppercase placeholder-slate-500 transition-all focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 disabled:opacity-50"
                />
              </div>

              {/* Contraseña */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                  CONTRASEÑA
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  disabled={isSubmitting}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-sm font-semibold text-white placeholder-slate-500 transition-all focus:border-amber-500 focus:outline-none focus:ring-4 focus:ring-amber-500/20 disabled:opacity-50"
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-3 pt-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3.5 text-sm font-bold text-white transition-all disabled:opacity-50"
                >
                  CANCELAR
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-amber-500/30 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'VERIFICANDO...' : 'AUTORIZAR'}
                </button>
              </div>
            </form>

            {/* Help Text */}
            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-xs text-slate-400">
                <strong className="text-slate-300">Nota:</strong> Solo usuarios con rol de Administrador o Super Administrador pueden autorizar esta operación.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

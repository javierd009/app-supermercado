'use client';

import { useState } from 'react';
import { authService } from '@/features/auth/services/authService';
import { salesService } from '../services/salesService';

interface Props {
  saleId: string | null;
  saleTotal: number;
  onClose: () => void;
  onSuccess: () => void;
}

export function CancelSaleModal({ saleId, saleTotal, onClose, onSuccess }: Props) {
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!saleId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Ingrese la contraseña de administrador');
      return;
    }

    if (!reason.trim()) {
      setError('Ingrese el motivo de anulación');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Validar contraseña de admin
      const users = await authService.listUsers();
      const admins = users.filter((u) => u.role === 'admin' || u.role === 'super_admin');

      let validAdmin = null;
      for (const admin of admins) {
        const loginResult = await authService.login(admin.username, password);
        if (loginResult.success) {
          validAdmin = admin;
          break;
        }
      }

      if (!validAdmin) {
        setError('Contraseña de administrador incorrecta');
        setIsSubmitting(false);
        return;
      }

      // 2. Anular venta
      const result = await salesService.cancelSale(saleId, validAdmin.id, reason.trim());

      if (result.success) {
        alert('Venta anulada exitosamente. El stock ha sido devuelto.');
        onSuccess();
        onClose();
      } else {
        setError(result.error || 'Error al anular venta');
      }
    } catch (err: any) {
      setError(err.message || 'Error al validar contraseña');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Anular Venta</h2>
              <p className="text-sm text-red-100 mt-1">
                Total: ₡{saleTotal.toFixed(2)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-red-600 rounded-lg p-2 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-700 font-medium">{error}</p>
            </div>
          )}

          <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
            <div className="flex items-start">
              <svg className="h-5 w-5 text-amber-600 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <p className="text-sm font-semibold text-amber-900">Atención</p>
                <p className="text-xs text-amber-700 mt-1">
                  Esta acción anulará la venta y devolverá el stock. Esta operación no se puede deshacer.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">
              Contraseña de Administrador *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              placeholder="Ingrese contraseña de admin"
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            />
          </div>

          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">
              Motivo de Anulación *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={3}
              placeholder="Ej: Error en facturación, devolución de producto, etc."
              className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-slate-900 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 resize-none"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 font-semibold text-slate-700 transition-all hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-4 py-3 font-bold text-white shadow-lg shadow-red-500/30 transition-all hover:shadow-xl hover:shadow-red-500/40 disabled:opacity-50"
            >
              {isSubmitting ? 'Anulando...' : 'Anular Venta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/shared/components/Card';
import { AdminAuthModal } from '@/shared/components/AdminAuthModal';
import { useOpenCashRegister } from '../hooks/useCashRegister';
import { useAuth } from '@/features/auth/hooks/useAuth';

interface OpenRegisterFormProps {
  onSuccess: () => void;
}

export function OpenRegisterForm({ onSuccess }: OpenRegisterFormProps) {
  const { user } = useAuth();
  const { openRegister } = useOpenCashRegister();

  const [initialAmount, setInitialAmount] = useState('');
  const [exchangeRate, setExchangeRate] = useState('570.00');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(initialAmount);
    const rate = parseFloat(exchangeRate);

    if (isNaN(amount) || amount < 0) {
      setError('Monto inválido');
      return;
    }

    if (isNaN(rate) || rate <= 0) {
      setError('Tipo de cambio inválido');
      return;
    }

    // Si es cajero, requiere autorización de admin
    if (user?.role === 'cashier' && !isAuthorized) {
      setShowAuthModal(true);
      return;
    }

    setIsSubmitting(true);

    const result = await openRegister(amount, rate);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Error al abrir caja');
    }

    setIsSubmitting(false);
  };

  const handleAuthorized = () => {
    setIsAuthorized(true);
    setShowAuthModal(false);
    // Auto-submit después de autorización
    setTimeout(() => {
      const form = document.querySelector('form');
      if (form) {
        form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
      }
    }, 100);
  };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-xl shadow-2xl border border-white/10">
        {/* Header */}
        <div className="border-b border-white/10 bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
          <div className="flex items-center">
            <div className="rounded-xl bg-white/20 p-3 mr-4">
              <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
                Abrir Caja
              </h2>
              <p className="text-blue-100 mt-1 text-sm font-medium">
                Cajero: <span className="font-bold">{user?.username}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 p-4 text-sm text-white shadow-lg shadow-red-500/20">
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {error}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Monto Inicial (₡) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <span className="text-slate-500 font-bold">₡</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={initialAmount}
                    onChange={(e) => setInitialAmount(e.target.value)}
                    autoFocus
                    required
                    disabled={isSubmitting}
                    className="w-full rounded-xl border-2 border-white/20 bg-white/10 pl-10 pr-4 py-4 text-lg text-white font-bold placeholder-slate-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Tipo de Cambio (USD a CRC) *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <span className="text-slate-500 font-bold">$1 =</span>
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="570.00"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="w-full rounded-xl border-2 border-white/20 bg-white/10 pl-16 pr-4 py-4 text-lg text-white font-bold placeholder-slate-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                    <span className="text-slate-500 font-bold">₡</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-sm text-slate-400 font-medium">
                <span className="text-blue-400 font-bold">ℹ️ Nota:</span> Ingrese el monto en efectivo con el que inicia el turno. El tipo de cambio se usará para aceptar pagos en dólares.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:shadow-xl hover:shadow-blue-500/40 hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Abriendo caja...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                  </svg>
                  Abrir Caja e Iniciar Turno
                </span>
              )}
            </button>

            <p className="text-center text-xs text-slate-500 font-medium pt-2">
              Al abrir la caja, podrá comenzar a registrar ventas del turno
            </p>
          </form>
        </div>
      </div>

      {/* Modal de Autorización para Cajeros */}
      <AdminAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthorized={handleAuthorized}
        title="Autorización de Apertura de Caja"
        message="La apertura de caja requiere autorización de un Administrador o Manager. Ingrese las credenciales de un supervisor."
      />
    </div>
  );
}

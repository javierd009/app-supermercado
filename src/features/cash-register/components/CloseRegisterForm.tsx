'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { AdminAuthModal } from '@/shared/components/AdminAuthModal';
import { useCloseCashRegister, useRegisterSummary, useCashRegister } from '../hooks/useCashRegister';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useWindowManager } from '@/features/pos/store/windowManager';
import type { CashRegisterSummary } from '../types';

interface CloseRegisterFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CloseRegisterForm({ onSuccess, onCancel }: CloseRegisterFormProps) {
  const { user } = useAuth();
  const { currentRegister } = useCashRegister();
  const { closeRegister } = useCloseCashRegister();
  const { getSummary } = useRegisterSummary();
  const { getAllWindows } = useWindowManager();

  const [summary, setSummary] = useState<CashRegisterSummary | null>(null);
  const [finalAmount, setFinalAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Cargar resumen al montar
  useEffect(() => {
    const loadSummary = async () => {
      const data = await getSummary();
      if (data) {
        setSummary(data);
      }
    };

    loadSummary();
  }, [getSummary]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const amount = parseFloat(finalAmount);

    if (isNaN(amount) || amount < 0) {
      setError('Monto inválido');
      return;
    }

    // VALIDACIÓN CRÍTICA: Verificar si hay ventanas POS con productos pendientes
    const allWindows = getAllWindows();
    const windowsWithItems = allWindows.filter(window => window.itemCount > 0);

    if (windowsWithItems.length > 0) {
      const windowsList = windowsWithItems
        .map(w => `• ${w.title} (${w.itemCount} productos, ₡${w.total.toFixed(2)})`)
        .join('\n');

      setError(
        `⚠️ NO SE PUEDE CERRAR LA CAJA\n\n` +
        `Hay ${windowsWithItems.length} ventana(s) POS con productos sin facturar:\n\n` +
        `${windowsList}\n\n` +
        `Por favor:\n` +
        `1. Complete las ventas pendientes, o\n` +
        `2. Cancele las ventas y vacíe los carritos\n\n` +
        `Luego intente cerrar la caja nuevamente.`
      );
      return;
    }

    // Si es cajero, requiere autorización de admin
    if (user?.role === 'cashier' && !isAuthorized) {
      setShowAuthModal(true);
      return;
    }

    setIsSubmitting(true);

    const result = await closeRegister(amount, notes);

    if (result.success) {
      onSuccess();
    } else {
      setError(result.error || 'Error al cerrar caja');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const expectedCash = summary
    ? summary.register.initialAmount + summary.totalCash
    : 0;

  const difference = finalAmount
    ? parseFloat(finalAmount) - expectedCash
    : 0;

  if (!currentRegister || !summary) {
    return (
      <div className="rounded-2xl bg-white/5 border border-white/10 p-12 text-center">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
        <p className="mt-4 text-slate-400 font-medium">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="border-b border-white/10 bg-gradient-to-r from-rose-600 to-rose-700 px-8 py-6">
        <div className="flex items-center">
          <div className="rounded-xl bg-white/20 p-3 mr-4">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              Cerrar Caja
            </h2>
            <p className="text-rose-100 mt-1">
              Revise y finalice el turno de trabajo
            </p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-5">
              <div className="flex items-start">
                <svg className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-sm text-rose-400 font-medium whitespace-pre-line">{error}</p>
              </div>
            </div>
          )}

          {/* Verificación de ventanas con productos pendientes */}
          {(() => {
            const allWindows = getAllWindows();
            const windowsWithItems = allWindows.filter(window => window.itemCount > 0);

            if (windowsWithItems.length > 0) {
              return (
                <div className="rounded-xl border-2 border-amber-500 bg-amber-500/10 p-5">
                  <div className="flex items-start mb-3">
                    <svg className="h-6 w-6 mr-3 flex-shrink-0 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div>
                      <h3 className="font-bold text-amber-400 text-lg mb-2">
                        ⚠️ Advertencia: {windowsWithItems.length} Ventana(s) con Productos Pendientes
                      </h3>
                      <p className="text-sm text-amber-300 mb-3">
                        No podrá cerrar la caja hasta completar o cancelar estas ventas:
                      </p>
                      <div className="space-y-2">
                        {windowsWithItems.map((window) => (
                          <div key={window.id} className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-bold text-amber-200">{window.title}</p>
                                <p className="text-xs text-amber-300 mt-1">
                                  {window.itemCount} producto(s) • Total: ₡{window.total.toFixed(2)}
                                </p>
                              </div>
                              <svg className="h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                              </svg>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                <div className="flex items-center">
                  <svg className="h-5 w-5 mr-2 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-emerald-400 font-medium">
                    ✓ No hay ventas pendientes en ventanas POS
                  </p>
                </div>
              </div>
            );
          })()}

          {/* Resumen de turno */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h3 className="mb-4 font-bold text-white text-lg flex items-center">
              <svg className="h-5 w-5 mr-2 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Resumen del Turno
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Apertura:</span>
                <span className="font-bold text-white">
                  {formatDateTime(currentRegister.openedAt)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400 font-medium">Monto Inicial:</span>
                <span className="font-bold text-white">
                  {formatCurrency(summary.register.initialAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Ventas por método de pago */}
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 md:p-5">
            <h3 className="mb-4 font-bold text-white text-base md:text-lg flex items-center">
              <svg className="h-5 w-5 mr-2 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Ventas por Método de Pago
            </h3>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-emerald-400 font-medium">
                  <span className="inline-flex items-center">
                    <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <circle cx="10" cy="10" r="3" />
                    </svg>
                    Efectivo
                  </span>
                  <span className="text-xs ml-2">({summary.salesCount} ventas)</span>
                </span>
                <span className="font-bold text-emerald-400 text-base md:text-lg tabular-nums">
                  {formatCurrency(summary.totalCash)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="text-blue-400 font-medium">
                  <span className="inline-flex items-center">
                    <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <rect x="3" y="5" width="14" height="10" rx="2" />
                    </svg>
                    Tarjeta
                  </span>
                </span>
                <span className="font-bold text-blue-400 text-base md:text-lg tabular-nums">
                  {formatCurrency(summary.totalCard)}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="text-amber-400 font-medium">
                  <span className="inline-flex items-center">
                    <svg className="h-4 w-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    </svg>
                    Sinpe Móvil
                  </span>
                </span>
                <span className="font-bold text-amber-400 text-base md:text-lg tabular-nums">
                  {formatCurrency(summary.totalSinpe)}
                </span>
              </div>
              <div className="border-t border-white/10 pt-3 mt-3">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                  <span className="font-bold text-white text-sm md:text-lg">
                    Total Ventas:
                  </span>
                  <span className="text-base md:text-2xl font-bold text-white tabular-nums">
                    {formatCurrency(summary.totalSales)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Efectivo esperado */}
          <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-3 md:p-5">
            <div className="flex flex-col gap-1">
              <p className="font-bold text-blue-400 text-sm md:text-lg">
                Efectivo Esperado
              </p>
              <p className="text-[10px] md:text-sm text-blue-300">
                Inicial + Efectivo
              </p>
              <span className="text-lg md:text-3xl font-bold text-blue-300 tabular-nums mt-1">
                {formatCurrency(expectedCash)}
              </span>
            </div>
          </div>

          {/* Input de monto final - custom */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white">Monto Real Contado (₡) *</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <span className="text-slate-400 font-medium">₡</span>
              </div>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={finalAmount}
                onChange={(e) => setFinalAmount(e.target.value)}
                autoFocus
                required
                disabled={isSubmitting}
                className="w-full rounded-xl border border-white/10 bg-white/5 pl-10 pr-4 py-4 text-lg text-white placeholder-slate-500 transition-all focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/10 disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-slate-400">
              Cuente el efectivo en la caja y registre el monto total
            </p>
          </div>

          {/* Diferencia */}
          {finalAmount && (
            <div
              className={`rounded-xl border p-3 md:p-5 ${
                difference === 0
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : difference > 0
                  ? 'bg-amber-500/10 border-amber-500/20'
                  : 'bg-rose-500/10 border-rose-500/20'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center min-w-0">
                  <div className={`rounded-lg p-1.5 md:p-2 mr-2 md:mr-3 flex-shrink-0 ${
                    difference === 0 ? 'bg-emerald-500' : difference > 0 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}>
                    <svg className="h-4 w-4 md:h-5 md:w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      {difference === 0 ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      ) : difference > 0 ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      )}
                    </svg>
                  </div>
                  <p
                    className={`font-bold text-sm md:text-lg truncate ${
                      difference === 0
                        ? 'text-emerald-400'
                        : difference > 0
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {difference === 0 && 'Cuadra'}
                    {difference > 0 && 'Sobrante'}
                    {difference < 0 && 'Faltante'}
                  </p>
                </div>
                <span
                  className={`text-base md:text-2xl font-bold tabular-nums flex-shrink-0 ${
                    difference === 0
                      ? 'text-emerald-400'
                      : difference > 0
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {difference > 0 && '+'}{formatCurrency(Math.abs(difference))}
                </span>
              </div>
            </div>
          )}

          {/* Notas */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-white">
              Notas (opcional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comentarios sobre el cierre de caja..."
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-rose-500 focus:outline-none focus:ring-4 focus:ring-rose-500/10 disabled:opacity-50"
              rows={3}
              disabled={isSubmitting}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 md:gap-4 pt-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-white/5 px-3 md:px-6 py-2.5 md:py-3 font-bold text-sm md:text-base text-white border border-white/10 transition-all hover:bg-white/10 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 px-3 md:px-6 py-2.5 md:py-3 font-bold text-sm md:text-base text-white shadow-lg shadow-rose-500/30 transition-all hover:shadow-xl hover:shadow-rose-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 md:h-5 md:w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="hidden md:inline">Cerrando...</span>
                  <span className="md:hidden">...</span>
                </span>
              ) : (
                <>
                  <span className="hidden md:inline">Cerrar Caja</span>
                  <span className="md:hidden">Cerrar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal de Autorización para Cajeros */}
      <AdminAuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthorized={handleAuthorized}
        title="Autorización de Cierre de Caja"
        message="El cierre de caja requiere autorización de un Administrador o Manager. Ingrese las credenciales de un supervisor."
      />
    </div>
  );
}

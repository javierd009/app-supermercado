'use client';

import { useState, useEffect, useRef } from 'react';
import { usePOSWindow, useProcessPayment } from '../hooks/usePOSWindow';
import { useCashRegister } from '@/features/cash-register/hooks/useCashRegister';
import { useDialog } from '@/shared/components/ConfirmDialog';
import type { PaymentMethod } from '../types';

interface PaymentModalMultiProps {
  windowId: string;
}

export function PaymentModalMulti({ windowId }: PaymentModalMultiProps) {
  const { cart, isPaymentModalOpen, closePaymentModal } = usePOSWindow(windowId);
  const { processPayment } = useProcessPayment(windowId);
  const { currentRegister } = useCashRegister();
  const dialog = useDialog();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [paymentCurrency, setPaymentCurrency] = useState<'CRC' | 'USD'>('CRC');
  const [amountReceived, setAmountReceived] = useState('');
  const [amountReceivedUsd, setAmountReceivedUsd] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Tipo de cambio de la caja registradora
  const exchangeRate = currentRegister?.exchangeRate || 570;

  // Auto-focus al abrir modal
  useEffect(() => {
    if (isPaymentModalOpen) {
      // Pre-llenar con el total en colones
      setAmountReceived(cart.total.toString());
      setPaymentCurrency('CRC');
      setAmountReceivedUsd('');

      // Focus en input de monto
      setTimeout(() => {
        amountInputRef.current?.select();
      }, 100);
    }
  }, [isPaymentModalOpen, cart.total]);

  // Conversión automática USD → CRC
  useEffect(() => {
    if (paymentCurrency === 'USD' && amountReceivedUsd) {
      const usd = parseFloat(amountReceivedUsd);
      if (!isNaN(usd)) {
        const crc = usd * exchangeRate;
        setAmountReceived(crc.toFixed(2));
      }
    }
  }, [amountReceivedUsd, exchangeRate, paymentCurrency]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(amountReceived);

    if (isNaN(amount) || amount < cart.total) {
      await dialog.error('Monto inválido o insuficiente', 'Error de Pago');
      return;
    }

    setIsProcessing(true);

    // Preparar datos de pago
    const paymentData = {
      paymentMethod,
      amountReceived: amount,
      paymentCurrency,
      amountReceivedUsd: paymentCurrency === 'USD' ? parseFloat(amountReceivedUsd) : undefined,
      exchangeRateUsed: paymentCurrency === 'USD' ? exchangeRate : undefined,
    };

    const result = await processPayment(
      paymentMethod,
      amount,
      paymentData.paymentCurrency,
      paymentData.amountReceivedUsd,
      paymentData.exchangeRateUsed
    );

    if (result.success) {
      // Mostrar cambio si es efectivo (siempre en colones)
      const change = result.change ?? 0;
      if (paymentMethod === 'cash' && change > 0) {
        let message = `Cambio a devolver: ${formatCurrency(change)}`;

        if (paymentCurrency === 'USD') {
          message = `Pagó: $${parseFloat(amountReceivedUsd).toFixed(2)} (${formatCurrency(amount)})\nCambio: ${formatCurrency(change)} (en colones)`;
        }

        await dialog.success(message, 'Venta Completada');
      } else {
        await dialog.success('La venta se ha procesado correctamente', 'Venta Completada');
      }

      // Resetear formulario
      setAmountReceived('');
      setAmountReceivedUsd('');
      setPaymentMethod('cash');
      setPaymentCurrency('CRC');
    }

    setIsProcessing(false);
  };

  const handleCancel = () => {
    closePaymentModal();
    setAmountReceived('');
    setAmountReceivedUsd('');
    setPaymentMethod('cash');
    setPaymentCurrency('CRC');
  };

  // Atajos de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPaymentModalOpen) return;

      if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === 'Enter' && !isProcessing) {
        e.preventDefault();
        handleSubmit(e as any);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPaymentModalOpen, amountReceived, paymentMethod, isProcessing]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const calculateChange = () => {
    const amount = parseFloat(amountReceived);
    if (isNaN(amount)) return 0;
    return Math.max(0, amount - cart.total);
  };

  if (!isPaymentModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
      <div className="w-full max-w-md bg-slate-900 border border-blue-500/50 rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 border-b border-white/10 px-6 py-4">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">
            Procesar Pago
          </h2>
          <p className="text-xs text-blue-100 font-mono mt-1">Ventana: {windowId.substring(0, 12)}</p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Total a pagar */}
          <div className="bg-blue-500/20 border border-blue-500/40 p-5 rounded-xl">
            <p className="text-[9px] text-blue-400 font-bold uppercase tracking-wider">Total a Pagar:</p>
            <p className="text-4xl font-black text-white mt-2">
              {formatCurrency(cart.total)}
            </p>
          </div>

          {/* Método de pago */}
          <div>
            <label className="mb-3 block text-[9px] font-bold text-blue-400 uppercase tracking-wider">
              Método de Pago
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`px-3 py-3 text-xs font-bold transition-all rounded-lg ${
                  paymentMethod === 'cash'
                    ? 'bg-blue-500 text-white border-2 border-blue-400'
                    : 'bg-slate-800 text-white border-2 border-slate-600 hover:bg-slate-700'
                }`}
              >
                💵 EFECTIVO
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                className={`px-3 py-3 text-xs font-bold transition-all rounded-lg ${
                  paymentMethod === 'card'
                    ? 'bg-blue-500 text-white border-2 border-blue-400'
                    : 'bg-slate-800 text-white border-2 border-slate-600 hover:bg-slate-700'
                }`}
              >
                💳 TARJETA
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('sinpe')}
                className={`px-3 py-3 text-xs font-bold transition-all rounded-lg ${
                  paymentMethod === 'sinpe'
                    ? 'bg-blue-500 text-white border-2 border-blue-400'
                    : 'bg-slate-800 text-white border-2 border-slate-600 hover:bg-slate-700'
                }`}
              >
                📱 SINPE
              </button>
            </div>
          </div>

          {/* Selector de moneda (solo para efectivo) */}
          {paymentMethod === 'cash' && (
            <div>
              <label className="mb-3 block text-[9px] font-bold text-blue-400 uppercase tracking-wider">
                Moneda de Pago
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentCurrency('CRC');
                    setAmountReceived(cart.total.toString());
                    setAmountReceivedUsd('');
                  }}
                  className={`px-4 py-3 text-sm font-bold transition-all rounded-lg ${
                    paymentCurrency === 'CRC'
                      ? 'bg-blue-500 text-white border-2 border-blue-400'
                      : 'bg-slate-800 text-white border-2 border-slate-600 hover:bg-slate-700'
                  }`}
                >
                  ₡ COLONES
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentCurrency('USD');
                    setAmountReceivedUsd('');
                    setAmountReceived('');
                  }}
                  className={`px-4 py-3 text-sm font-bold transition-all rounded-lg ${
                    paymentCurrency === 'USD'
                      ? 'bg-blue-500 text-white border-2 border-blue-400'
                      : 'bg-slate-800 text-white border-2 border-slate-600 hover:bg-slate-700'
                  }`}
                >
                  $ DÓLARES
                </button>
              </div>
            </div>
          )}

          {/* Monto recibido en COLONES */}
          {paymentMethod === 'cash' && paymentCurrency === 'CRC' && (
            <div>
              <label className="mb-3 block text-[9px] font-bold text-blue-400 uppercase tracking-wider">
                Monto Recibido (₡)
              </label>
              <input
                ref={amountInputRef}
                type="number"
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0.00"
                required
                className="w-full bg-slate-800 border-2 border-slate-600 px-4 py-3 text-2xl font-black text-white placeholder-slate-500 rounded-xl focus:border-blue-500 focus:bg-slate-700 focus:outline-none transition-all"
              />
            </div>
          )}

          {/* Monto recibido en DÓLARES */}
          {paymentMethod === 'cash' && paymentCurrency === 'USD' && (
            <div className="space-y-3">
              <div>
                <label className="mb-3 block text-[9px] font-bold text-blue-400 uppercase tracking-wider">
                  Monto Recibido ($)
                </label>
                <input
                  ref={amountInputRef}
                  type="number"
                  step="0.01"
                  value={amountReceivedUsd}
                  onChange={(e) => setAmountReceivedUsd(e.target.value)}
                  placeholder="0.00"
                  required
                  className="w-full bg-slate-800 border-2 border-slate-600 px-4 py-3 text-2xl font-black text-white placeholder-slate-500 rounded-xl focus:border-blue-500 focus:bg-slate-700 focus:outline-none transition-all"
                />
              </div>

              {/* Conversión automática */}
              <div className="bg-amber-500/20 border border-amber-500/40 p-4 rounded-xl">
                <p className="text-[9px] text-amber-400 font-bold uppercase tracking-wider mb-2">
                  Tipo de Cambio: $1 = ₡{exchangeRate.toFixed(2)}
                </p>
                <p className="text-xs text-amber-400 mb-1">
                  Equivalente en colones:
                </p>
                <p className="text-2xl font-black text-white">
                  {amountReceivedUsd ? formatCurrency(parseFloat(amountReceivedUsd) * exchangeRate) : '₡0.00'}
                </p>
              </div>
            </div>
          )}

          {paymentMethod !== 'cash' && (
            <div className="bg-slate-800 border border-slate-600 p-4 rounded-xl">
              <p className="text-sm text-white font-bold">
                {paymentMethod === 'card' && 'Procesando pago con tarjeta...'}
                {paymentMethod === 'sinpe' && 'Esperando confirmación SINPE Móvil...'}
              </p>
            </div>
          )}

          {/* Cambio */}
          {paymentMethod === 'cash' && calculateChange() > 0 && (
            <div className="bg-emerald-500/20 border border-emerald-500/40 p-4 rounded-xl">
              <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mb-2">Cambio a Devolver:</p>
              <p className="text-3xl font-black text-white">
                {formatCurrency(calculateChange())}
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-2 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isProcessing}
              className="flex-1 bg-slate-800 hover:bg-slate-700 border-2 border-slate-600 px-4 py-3 text-sm font-bold text-white transition-all rounded-xl disabled:opacity-50"
            >
              ✖ CANCELAR (ESC)
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 px-4 py-3 text-sm font-bold text-white transition-all rounded-xl shadow-lg disabled:opacity-50"
            >
              {isProcessing ? '⏳ PROCESANDO...' : '✓ CONFIRMAR (ENTER)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

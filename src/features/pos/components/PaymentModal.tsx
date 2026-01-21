'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { usePOS, useProcessPayment } from '../hooks/usePOS';
import type { PaymentMethod } from '../types';

export function PaymentModal() {
  const { cart, isPaymentModalOpen, closePaymentModal } = usePOS();
  const { processPayment } = useProcessPayment();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Auto-focus al abrir modal
  useEffect(() => {
    if (isPaymentModalOpen) {
      // Pre-llenar con el total si es efectivo
      if (paymentMethod === 'cash') {
        setAmountReceived(cart.total.toString());
      } else {
        setAmountReceived(cart.total.toString());
      }

      // Focus en input de monto
      setTimeout(() => {
        amountInputRef.current?.select();
      }, 100);
    }
  }, [isPaymentModalOpen, cart.total, paymentMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(amountReceived);

    if (isNaN(amount) || amount < cart.total) {
      alert('Monto inválido o insuficiente');
      return;
    }

    setIsProcessing(true);

    const result = await processPayment(paymentMethod, amount);

    if (result.success) {
      // Mostrar cambio si es efectivo
      if (paymentMethod === 'cash' && result.change > 0) {
        alert(`Venta completada.\n\nCambio: ${formatCurrency(result.change)}`);
      } else {
        alert('Venta completada exitosamente');
      }

      // Resetear formulario
      setAmountReceived('');
      setPaymentMethod('cash');
    }

    setIsProcessing(false);
  };

  const handleCancel = () => {
    closePaymentModal();
    setAmountReceived('');
    setPaymentMethod('cash');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70">
      <div className="w-full max-w-md border-4 border-gray-400 bg-white shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-800 border-b-2 border-blue-950 px-4 py-3">
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: 'Arial, sans-serif' }}>
            PROCESAR PAGO
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Total a pagar */}
          <div className="bg-blue-100 border-2 border-blue-300 p-4">
            <p className="text-xs text-blue-800 font-semibold" style={{ fontFamily: 'Arial, sans-serif' }}>TOTAL A PAGAR:</p>
            <p className="text-3xl font-bold text-blue-900" style={{ fontFamily: 'Arial, sans-serif' }}>
              {formatCurrency(cart.total)}
            </p>
          </div>

          {/* Método de pago */}
          <div>
            <label className="mb-2 block text-xs font-bold text-gray-800" style={{ fontFamily: 'Arial, sans-serif' }}>
              MÉTODO DE PAGO
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                style={{ fontFamily: 'Arial, sans-serif' }}
                className={`border-2 px-3 py-3 text-xs font-bold transition-colors ${
                  paymentMethod === 'cash'
                    ? 'border-blue-600 bg-blue-100 text-blue-900 border-b-4'
                    : 'border-gray-400 bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                💵 EFECTIVO
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                style={{ fontFamily: 'Arial, sans-serif' }}
                className={`border-2 px-3 py-3 text-xs font-bold transition-colors ${
                  paymentMethod === 'card'
                    ? 'border-blue-600 bg-blue-100 text-blue-900 border-b-4'
                    : 'border-gray-400 bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                💳 TARJETA
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('sinpe')}
                style={{ fontFamily: 'Arial, sans-serif' }}
                className={`border-2 px-3 py-3 text-xs font-bold transition-colors ${
                  paymentMethod === 'sinpe'
                    ? 'border-blue-600 bg-blue-100 text-blue-900 border-b-4'
                    : 'border-gray-400 bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                📱 SINPE
              </button>
            </div>
          </div>

          {/* Monto recibido */}
          {paymentMethod === 'cash' && (
            <div>
              <label className="mb-2 block text-xs font-bold text-gray-800" style={{ fontFamily: 'Arial, sans-serif' }}>
                MONTO RECIBIDO (₡)
              </label>
              <input
                ref={amountInputRef}
                type="number"
                step="0.01"
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0.00"
                required
                style={{ fontFamily: 'Arial, sans-serif' }}
                className="w-full border-2 border-gray-400 px-3 py-2 text-sm font-bold text-gray-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          )}

          {paymentMethod !== 'cash' && (
            <div className="bg-gray-200 border-2 border-gray-300 p-4">
              <p className="text-xs text-gray-700 font-semibold" style={{ fontFamily: 'Arial, sans-serif' }}>
                {paymentMethod === 'card' && 'PROCESANDO PAGO CON TARJETA...'}
                {paymentMethod === 'sinpe' && 'ESPERANDO CONFIRMACIÓN SINPE MÓVIL...'}
              </p>
            </div>
          )}

          {/* Cambio */}
          {paymentMethod === 'cash' && calculateChange() > 0 && (
            <div className="bg-green-100 border-2 border-green-400 p-4">
              <p className="text-xs text-green-800 font-semibold" style={{ fontFamily: 'Arial, sans-serif' }}>CAMBIO A DEVOLVER:</p>
              <p className="text-2xl font-bold text-green-900" style={{ fontFamily: 'Arial, sans-serif' }}>
                {formatCurrency(calculateChange())}
              </p>
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-2 pt-4 border-t-2 border-gray-300">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isProcessing}
              style={{ fontFamily: 'Arial, sans-serif' }}
              className="flex-1 bg-gray-500 hover:bg-gray-600 border border-gray-600 border-b-4 px-4 py-3 text-sm font-bold text-white transition-colors disabled:opacity-50"
            >
              ✖ CANCELAR (ESC)
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              style={{ fontFamily: 'Arial, sans-serif' }}
              className="flex-1 bg-green-600 hover:bg-green-700 border border-green-700 border-b-4 px-4 py-3 text-sm font-bold text-white transition-colors disabled:opacity-50"
            >
              {isProcessing ? '⏳ PROCESANDO...' : '✓ CONFIRMAR (ENTER)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

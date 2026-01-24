'use client';

import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLoadProducts } from '@/features/products/hooks/useProducts';
import { useKeyboardShortcuts } from '@/shared/hooks/useElectron';
import { usePOSWindow } from '../hooks/usePOSWindow';
import { ProductSearchBar } from './ProductSearchBar';
import { CartTableMulti } from './CartTableMulti';
import { PaymentModalMulti } from './PaymentModalMulti';
import { CustomerSelector } from './CustomerSelector';
import { ExchangeRateEditor } from '@/features/cash-register/components/ExchangeRateEditor';
import { useDialog } from '@/shared/components/ConfirmDialog';
import {
  CreditCard,
  Trash2,
  ShoppingCart,
  CheckCircle2,
  AlertCircle,
  Home
} from 'lucide-react';
import Link from 'next/link';

interface POSWindowMultiProps {
  windowId: string;
  onClose?: () => void;
}

export function POSWindowMulti({ windowId, onClose }: POSWindowMultiProps) {
  const { user } = useAuth();
  useLoadProducts();
  const dialog = useDialog();

  const {
    cart,
    clearCart,
    openPaymentModal,
    removeSelectedItem,
    selectedItemId,
    customerId,
    setCustomerId,
    syncWithWindowManager,
  } = usePOSWindow(windowId);

  // Sincronizar estado del localStorage con el WindowManager al montar
  useEffect(() => {
    syncWithWindowManager();
  }, [syncWithWindowManager]);

  // Función para cancelar venta con confirmación
  const handleCancelSale = async () => {
    if (cart.items.length === 0) return;

    const confirmed = await dialog.confirm({
      title: 'Cancelar Venta',
      message: '¿Estás seguro de que deseas cancelar la venta actual? Se perderán todos los productos del carrito.',
      confirmText: 'Sí, cancelar',
      cancelText: 'No, continuar',
    });

    if (confirmed) {
      clearCart();
    }
  };

  // Atajos de teclado
  useKeyboardShortcuts({
    F9: () => {
      if (selectedItemId) {
        removeSelectedItem();
      }
    },
    F10: () => {
      if (cart.items.length > 0) {
        openPaymentModal();
      }
    },
    Escape: () => {
      handleCancelSale();
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="flex h-screen flex-col bg-[#020617] selection:bg-blue-100 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-indigo-500/5 pointer-events-none"></div>
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header Minimalista */}
      <div className="bg-white/5 backdrop-blur-3xl border-b border-white/10 shadow-2xl z-20 relative electron-safe-header">
        <div className="px-3 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
              {/* Botón Home en móvil */}
              <Link
                href="/dashboard"
                className="md:hidden flex-shrink-0 p-2 bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 rounded-xl shadow-lg transition-all electron-no-drag"
              >
                <Home className="w-4 h-4 text-white" />
              </Link>

              {/* Logo y Título */}
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <div className="hidden md:block bg-white rounded-xl p-1.5 shadow-lg flex-shrink-0">
                  <img
                    src="/images/sabrosita-logo.png"
                    alt="La Sabrosita"
                    className="h-11 w-11 object-contain"
                  />
                </div>
                <div className="min-w-0">
                  <h1 className="text-sm md:text-lg font-black text-white tracking-tight uppercase truncate">
                    Punto de Venta
                  </h1>
                  <span className="hidden md:block text-[9px] text-slate-500 font-bold uppercase tracking-wider truncate">
                    {user?.username}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
              {/* Editor de tipo de cambio */}
              <ExchangeRateEditor />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        {/* Left Panel - Products & Cart */}
        <div className="flex-1 flex flex-col p-3 md:p-6 space-y-3 md:space-y-4 overflow-hidden">
          {/* Search Bar & Customer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 md:gap-4 flex-none">
            <div className="lg:col-span-8">
              <ProductSearchBar windowId={windowId} />
            </div>
            <div className="lg:col-span-4">
              <CustomerSelector
                selectedCustomerId={customerId}
                onCustomerChange={setCustomerId}
              />
            </div>
          </div>

          {/* Cart Table - Envoltorio Moderno */}
          <div className="flex-1 overflow-hidden bg-white/5 backdrop-blur-3xl rounded-xl md:rounded-2xl border border-white/10 shadow-2xl flex flex-col relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500"></div>
            <CartTableMulti windowId={windowId} />
          </div>

          {/* Total y botones en móvil - Fixed bottom */}
          <div className="md:hidden flex-none bg-white/5 backdrop-blur-3xl border-t border-white/10 -mx-3 -mb-3 p-3 space-y-3">
            {/* Total compacto */}
            <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Total</p>
                  <div className="text-2xl font-black tabular-nums text-white">
                    {formatCurrency(cart.total)}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">Items</p>
                  <p className="text-xl font-bold text-white">{cart.items.length}</p>
                </div>
              </div>
            </div>

            {/* Botones de acción */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={openPaymentModal}
                disabled={cart.items.length === 0}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:bg-white/10 disabled:from-white/10 disabled:to-white/10 text-white font-bold py-4 rounded-xl shadow-lg disabled:shadow-none transition-all active:scale-95"
              >
                <CreditCard className="w-5 h-5" />
                <span className="text-sm">COBRAR</span>
              </button>

              <button
                onClick={handleCancelSale}
                disabled={cart.items.length === 0}
                className="flex items-center justify-center gap-2 bg-white/10 hover:bg-rose-500/20 border border-white/20 hover:border-rose-500/50 text-white disabled:text-slate-600 font-bold py-4 rounded-xl transition-all active:scale-95"
              >
                <Trash2 className="w-5 h-5" />
                <span className="text-sm">LIMPIAR</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel - Totals & Actions - Solo desktop */}
        <div className="hidden md:flex w-full max-w-[400px] bg-white/5 backdrop-blur-3xl border-l border-white/10 flex-col shadow-2xl relative z-10">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg backdrop-blur-xl border border-blue-500/30">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <h2 className="font-bold text-white text-lg tracking-tight">Resumen de Venta</h2>
            </div>
            <p className="text-xs text-slate-400">Detalle de la transacción actual</p>
          </div>

          <div className="flex-1 p-6 space-y-6 overflow-y-auto">
            {/* Financial Details */}
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400 font-medium">Subtotal</span>
                <span className="font-bold text-white tabular-nums">{formatCurrency(cart.subtotal)}</span>
              </div>
              {cart.discount > 0 && (
                <div className="flex justify-between text-sm text-rose-400">
                  <span className="font-medium flex items-center gap-1">
                    Descuento Aplicado
                  </span>
                  <span className="font-bold tabular-nums">-{formatCurrency(cart.discount)}</span>
                </div>
              )}
              <div className="h-px bg-white/10 my-4"></div>

              {/* Grand Total */}
              <div className="bg-gradient-to-br from-blue-500/20 to-indigo-500/20 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-125 group-hover:rotate-12">
                  <CreditCard className="w-16 h-16 text-white" />
                </div>
                <div className="relative z-10">
                  <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Total Neto a Pagar</p>
                  <div className="text-4xl font-black tabular-nums tracking-tighter text-white">
                    {formatCurrency(cart.total)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-6 space-y-3 bg-white/5 backdrop-blur-xl border-t border-white/10">
            <button
              onClick={openPaymentModal}
              disabled={cart.items.length === 0}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:bg-white/10 disabled:from-white/10 disabled:to-white/10 text-white font-bold py-5 rounded-2xl shadow-xl shadow-blue-500/20 disabled:shadow-none transition-all hover:-translate-y-1 active:scale-[0.98] text-lg group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <CreditCard className="w-6 h-6 transition-transform group-hover:scale-110 relative z-10" />
              <span className="relative z-10">COBRAR (F10)</span>
            </button>

            <button
              onClick={handleCancelSale}
              disabled={cart.items.length === 0}
              className="w-full flex items-center justify-center gap-2 text-red-400 hover:text-red-300 font-bold py-3 transition-colors text-sm disabled:opacity-50 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
              CANCELAR VENTA (ESC)
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModalMulti windowId={windowId} />

      {/* Status Bar */}
      <footer className="bg-white/5 backdrop-blur-3xl border-t border-white/10 px-6 py-2 flex items-center justify-between z-20 relative">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Sistema Operativo</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Base de Datos OK</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-slate-500" />
            <span className="text-[10px] font-medium text-slate-500 font-mono uppercase tracking-tighter">ID: {windowId.substring(0, 12)}</span>
          </div>
        </div>
        <div className="text-[10px] font-bold text-white tracking-tighter italic">
          SABROSITA <span className="text-blue-400">POS</span> v3.0
        </div>
      </footer>
    </div>
  );
}

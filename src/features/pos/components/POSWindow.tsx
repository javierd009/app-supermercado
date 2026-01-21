'use client';

import { useEffect } from 'react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useLoadProducts } from '@/features/products/hooks/useProducts';
import { useKeyboardShortcuts } from '@/shared/hooks/useElectron';
import { usePOS } from '../hooks/usePOS';
import { ProductSearchBar } from './ProductSearchBar';
import { CartTable } from './CartTable';
import { PaymentModal } from './PaymentModal';
import { CustomerSelector } from './CustomerSelector';
import Link from 'next/link';

export function POSWindow() {
  const { user } = useAuth();
  useLoadProducts();

  const { cart, itemCount, clearCart, openPaymentModal, removeSelectedItem, selectedItemId, customerId, setCustomerId } = usePOS();

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
      if (cart.items.length > 0) {
        if (confirm('¿Cancelar venta actual?')) {
          clearCart();
        }
      }
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
    <div className="flex h-screen flex-col bg-gray-100" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header Corporativo */}
      <div className="bg-gradient-to-r from-blue-900 to-blue-800 border-b-2 border-blue-950">
        <div className="px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white px-3 py-1 border border-gray-300">
                <h1 className="text-lg font-bold text-blue-900">PUNTO DE VENTA</h1>
              </div>
              <div className="text-white text-sm">
                <span>Cajero: <strong>{user?.username}</strong></span>
                <span className="mx-2">|</span>
                <span>Items: <strong>{itemCount}</strong></span>
              </div>
            </div>
            <div className="text-white text-xs text-right">
              <div>{new Date().toLocaleDateString('es-CR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
              <div>{new Date().toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-300 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Link href="/dashboard" className="bg-gray-200 hover:bg-gray-300 border border-gray-400 px-3 py-1 text-xs font-bold transition-colors">
            ← MENÚ
          </Link>
          <span className="text-gray-400">|</span>
          <span className="text-sm text-gray-700"><strong>POS</strong> &gt; Nueva Venta</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-xs text-gray-600">
            <kbd className="bg-gray-200 border border-gray-400 px-2 py-0.5 font-mono">F9</kbd> Eliminar
            <span className="mx-2">|</span>
            <kbd className="bg-gray-200 border border-gray-400 px-2 py-0.5 font-mono">F10</kbd> Cobrar
            <span className="mx-2">|</span>
            <kbd className="bg-gray-200 border border-gray-400 px-2 py-0.5 font-mono">ESC</kbd> Cancelar
          </div>
        </div>
      </div>

      {/* Main Content - 2 Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Products & Cart */}
        <div className="flex-1 flex flex-col p-4 space-y-3 overflow-hidden">
          {/* Search Bar */}
          <ProductSearchBar />

          {/* Customer Selector */}
          <CustomerSelector
            selectedCustomerId={customerId}
            onCustomerChange={setCustomerId}
          />

          {/* Cart Table */}
          <div className="flex-1 overflow-hidden">
            <CartTable />
          </div>
        </div>

        {/* Right Panel - Totals & Actions */}
        <div className="w-96 bg-white border-l-2 border-gray-300 flex flex-col">
          {/* Totals Section */}
          <div className="bg-gray-200 border-b border-gray-300 px-4 py-2">
            <h2 className="font-bold text-gray-800">RESUMEN DE VENTA</h2>
          </div>

          <div className="flex-1 p-4 space-y-4">
            {/* Items Count */}
            <div className="bg-blue-50 border border-blue-200 p-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-700">Productos diferentes:</span>
                <span className="font-bold text-gray-900">{cart.items.length}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-700">Unidades totales:</span>
                <span className="font-bold text-gray-900">{itemCount}</span>
              </div>
            </div>

            {/* Subtotal */}
            <div className="border-t-2 border-gray-300 pt-4">
              <table className="w-full text-sm">
                <tbody>
                  <tr>
                    <td className="py-1 text-gray-700">Subtotal:</td>
                    <td className="py-1 text-right font-bold">{formatCurrency(cart.subtotal)}</td>
                  </tr>
                  {cart.discount > 0 && (
                    <tr className="text-red-600">
                      <td className="py-1">Descuento:</td>
                      <td className="py-1 text-right font-bold">-{formatCurrency(cart.discount)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Total */}
            <div className="bg-green-600 text-white p-4 border-2 border-green-700">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold">TOTAL A PAGAR:</span>
                <span className="text-3xl font-bold">{formatCurrency(cart.total)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t-2 border-gray-300 p-4 space-y-2 bg-gray-50">
            <button
              onClick={openPaymentModal}
              disabled={cart.items.length === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-bold py-4 px-4 border-b-4 border-blue-800 disabled:border-gray-500 transition-colors text-lg"
            >
              💳 COBRAR (F10)
            </button>

            <button
              onClick={() => {
                if (cart.items.length > 0 && confirm('¿Cancelar venta actual?')) {
                  clearCart();
                }
              }}
              disabled={cart.items.length === 0}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-3 px-4 border-b-4 border-red-800 disabled:border-gray-500 transition-colors"
            >
              ✖ CANCELAR VENTA (ESC)
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <PaymentModal />

      {/* Status Bar */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-1 flex items-center justify-between text-xs text-gray-300">
        <span>Sistema listo | Base de datos conectada</span>
        <span>SABROSITA POS v3.0</span>
      </div>
    </div>
  );
}

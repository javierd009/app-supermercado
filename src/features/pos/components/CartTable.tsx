'use client';

import { usePOS } from '../hooks/usePOS';
import { Trash2, ShoppingCart } from 'lucide-react';

export function CartTable() {
  const { items, updateItemQuantity, removeItem, selectedItemId, setSelectedItemId } = usePOS();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#020617] border border-white/10 rounded-xl">
      <table className="w-full">
        <thead className="border-b border-white/10 bg-white/5">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-400 tracking-wide">
              Código
            </th>
            <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-400 tracking-wide">
              Producto
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-400 tracking-wide">
              Cantidad
            </th>
            <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-400 tracking-wide">
              Precio Unit.
            </th>
            <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-400 tracking-wide">
              Subtotal
            </th>
            <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-400 tracking-wide">
              Acción
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-12 text-center bg-[#020617]">
                <div className="flex flex-col items-center justify-center">
                  <div className="bg-white/5 border border-white/10 p-6 mb-3 rounded-xl">
                    <ShoppingCart className="h-12 w-12 text-slate-600" />
                  </div>
                  <p className="text-sm font-bold text-white uppercase tracking-wide">Carrito Vacío</p>
                  <p className="text-xs text-slate-500 mt-1 font-medium">Escanee o busque productos</p>
                </div>
              </td>
            </tr>
          ) : (
            items.map((item) => (
              <tr
                key={item.id}
                onClick={() => setSelectedItemId(item.id)}
                className={`cursor-pointer transition-all ${
                  selectedItemId === item.id
                    ? 'bg-blue-500/20 border-l-4 border-blue-500'
                    : 'hover:bg-white/5'
                }`}
              >
                <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-white">
                  {item.code}
                </td>
                <td className="px-4 py-4 text-sm font-medium text-slate-200">
                  {item.name}
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateItemQuantity(item.id, item.quantity - 1);
                      }}
                      className="flex h-10 w-10 items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-black text-lg transition-all active:scale-95"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const qty = parseInt(e.target.value, 10);
                        if (!isNaN(qty) && qty > 0) {
                          updateItemQuantity(item.id, qty);
                        }
                      }}
                      className="w-20 bg-white/10 border border-white/20 rounded-lg px-2 py-2 text-center text-lg font-black text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateItemQuantity(item.id, item.quantity + 1);
                      }}
                      className="flex h-10 w-10 items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-white font-black text-lg transition-all active:scale-95"
                    >
                      +
                    </button>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right text-base font-bold text-slate-300">
                  {formatCurrency(item.unitPrice)}
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-right text-lg font-black text-white">
                  {formatCurrency(item.subtotal)}
                </td>
                <td className="px-4 py-4 text-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeItem(item.id);
                    }}
                    className="inline-flex items-center justify-center bg-rose-500/20 hover:bg-rose-500 border border-rose-500/30 hover:border-rose-500 px-3 py-2 rounded-lg text-rose-400 hover:text-white transition-all active:scale-95"
                    title="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

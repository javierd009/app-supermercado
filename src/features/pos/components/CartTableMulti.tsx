'use client';

import { usePOSWindow } from '../hooks/usePOSWindow';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';

interface CartTableMultiProps {
  windowId: string;
}

export function CartTableMulti({ windowId }: CartTableMultiProps) {
  const { items, updateItemQuantity, removeItem, selectedItemId, setSelectedItemId } = usePOSWindow(windowId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="bg-white/10 backdrop-blur-sm sticky top-0 z-10">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10">
                Detalle del Producto
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 text-center">
                Cantidad
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 text-right">
                Precio Unit.
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 text-right">
                Total
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-white/10 text-center">
                Acción
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {items.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 bg-white/10 rounded-full">
                      <ShoppingBag className="h-12 w-12 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-white">El carrito está vacío</p>
                      <p className="text-xs text-slate-400 mt-1">Escanea un producto o búscalo manualmente</p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`group cursor-pointer transition-all ${
                    selectedItemId === item.id
                      ? 'bg-blue-500/20'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-blue-400 mb-0.5 tracking-tight">
                        {item.code}
                      </span>
                      <span className="text-sm font-semibold text-white">
                        {item.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center">
                      <div className="inline-flex items-center bg-white/95 border border-white/20 rounded-lg p-1 shadow-sm group-hover:border-blue-500/50 transition-colors">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateItemQuantity(item.id, item.quantity - 1);
                          }}
                          className="p-1 text-slate-600 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-all"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const qty = parseInt(e.target.value, 10);
                            if (!isNaN(qty) && qty > 0) {
                              updateItemQuantity(item.id, qty);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-12 text-center text-xl font-black text-slate-900 focus:outline-none bg-transparent"
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateItemQuantity(item.id, item.quantity + 1);
                          }}
                          className="p-1 text-slate-600 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-lg font-bold text-white tabular-nums">
                      {formatCurrency(item.unitPrice)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-2xl font-black text-white tabular-nums">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`¿Eliminar ${item.name}?`)) {
                          removeItem(item.id);
                        }
                      }}
                      className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

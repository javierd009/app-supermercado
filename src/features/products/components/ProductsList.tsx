'use client';

import { useState } from 'react';
import { Card } from '@/shared/components/Card';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useProducts, useDeleteProduct } from '../hooks/useProducts';
import type { Product } from '../types';

interface ProductsListProps {
  onEdit: (product: Product) => void;
}

export function ProductsList({ onEdit }: ProductsListProps) {
  const { user } = useAuth();
  const { filteredProducts, isLoading, setFilters, filters } = useProducts();
  const { deleteProduct } = useDeleteProduct();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Solo admin y super_admin pueden editar/eliminar
  const canModify = user?.role === 'admin' || user?.role === 'super_admin';

  const handleSearch = (value: string) => {
    setFilters({ search: value });
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirm === id) {
      const result = await deleteProduct(id);
      if (result.success) {
        setDeleteConfirm(null);
      }
    } else {
      setDeleteConfirm(id);
      // Auto-cancel después de 3 segundos
      setTimeout(() => setDeleteConfirm(null), 3000);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  if (isLoading && filteredProducts.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-12">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </div>
          <p className="mt-4 text-slate-400 font-bold uppercase tracking-wide text-sm">Cargando productos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      {/* Barra de búsqueda */}
      <div className="border-b border-white/10 bg-white/5 p-6">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
              value={filters.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            />
          </div>
          <button
            onClick={() => setFilters({ lowStock: !filters.lowStock })}
            className={`px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
              filters.lowStock
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
            }`}
          >
            <span className="flex items-center gap-2">
              {filters.lowStock && (
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              Stock Bajo
            </span>
          </button>
        </div>
      </div>

      {/* Tabla de productos */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-white/10 bg-white/5">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                Código
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                Producto
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-400">
                Categoría
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                Stock
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                Costo
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                Precio
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                Margen
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-400">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center">
                    <div className="rounded-full bg-white/10 p-6 mb-4">
                      <svg className="h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-lg font-semibold text-slate-400">
                      {filters.search ? 'No se encontraron productos' : 'No hay productos registrados'}
                    </p>
                    {!filters.search && (
                      <p className="text-sm text-slate-500 mt-1">
                        Agregue su primer producto
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => {
                const margin = ((product.price - product.cost) / product.price) * 100;
                const isLowStock = product.stock <= product.minStock;

                return (
                  <tr
                    key={product.id}
                    className={`transition-colors ${
                      isLowStock
                        ? 'bg-rose-500/10 hover:bg-rose-500/20'
                        : 'hover:bg-white/5'
                    }`}
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-white">
                      {product.code}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-white">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-400">
                      {product.category ? (
                        <span className="inline-flex items-center rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-400">
                          {product.category}
                        </span>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className={`font-bold ${
                            isLowStock ? 'text-rose-400' : 'text-white'
                          }`}
                        >
                          {product.stock}
                        </span>
                        {isLowStock && (
                          <span className="inline-flex items-center rounded-full border border-rose-500/30 bg-rose-500/20 px-2 py-0.5 text-xs font-bold text-rose-400">
                            ⚠ Bajo
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-400 font-medium">
                      {formatCurrency(product.cost)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-bold text-white">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      <span
                        className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold ${
                          margin > 50
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : margin > 30
                            ? 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                            : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                        }`}
                      >
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm">
                      {canModify ? (
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => onEdit(product)}
                            className="rounded-xl px-4 py-2 font-bold text-blue-400 transition-all hover:bg-blue-500/10 uppercase tracking-wide text-xs"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className={`rounded-xl px-4 py-2 font-bold transition-all uppercase tracking-wide text-xs ${
                              deleteConfirm === product.id
                                ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/30'
                                : 'text-rose-400 hover:bg-rose-500/10'
                            }`}
                          >
                            {deleteConfirm === product.id ? '✓ Confirmar' : 'Eliminar'}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-500 font-bold text-xs uppercase tracking-wide">
                          Solo lectura
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer con estadísticas */}
      <div className="border-t border-white/10 bg-white/5 px-6 py-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-slate-400">
            Total: <span className="text-white">{filteredProducts.length}</span> producto{filteredProducts.length !== 1 ? 's' : ''}
          </span>
          {filters.search && (
            <span className="text-slate-400">
              Filtrando por: <span className="font-bold text-blue-400">"{filters.search}"</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

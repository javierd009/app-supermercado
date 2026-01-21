'use client';

import { useMemo } from 'react';
import type { TaxBreakdownProps } from '../types';
import { calculateSaleTaxBreakdown, formatCurrency } from '../utils/taxCalculations';

/**
 * Componente que muestra el desglose detallado de IVA en el POS
 *
 * Muestra:
 * - IVA por tasa (0%, 4%, 13%) con cantidad de items
 * - Subtotal sin IVA
 * - Total de IVA
 * - Total con IVA
 *
 * @example
 * ```tsx
 * <TaxBreakdown items={cart.items} />
 * ```
 */
export function TaxBreakdown({ items, className = '' }: TaxBreakdownProps) {
  const breakdown = useMemo(() => {
    return calculateSaleTaxBreakdown(items);
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  // Ordenar tasas de menor a mayor (0%, 4%, 13%)
  const sortedRates = Object.entries(breakdown.byRate).sort(
    ([a], [b]) => parseFloat(a) - parseFloat(b)
  );

  return (
    <div className={`rounded-2xl border-2 border-slate-200 bg-white shadow-lg ${className}`}>
      <div className="border-b-2 border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-4">
        <h3 className="text-lg font-bold text-slate-900">Desglose de IVA</h3>
      </div>

      <div className="p-6">
        {/* Desglose por tasa de IVA */}
        {sortedRates.length > 0 && (
          <div className="mb-4 space-y-2">
            {sortedRates.map(([rate, data]) => {
              const rateNum = parseFloat(rate);
              const badgeColor =
                rateNum === 0
                  ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                  : rateNum === 4
                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                  : 'bg-amber-100 text-amber-700 border-amber-200';

              return (
                <div
                  key={rate}
                  className="flex items-center justify-between py-2 border-b border-slate-100"
                >
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center rounded-lg border px-2.5 py-0.5 text-xs font-semibold ${badgeColor}`}>
                      {rateNum === 0 ? 'Exento' : `IVA ${rate}%`}
                    </span>
                    <span className="text-sm text-slate-600">
                      ({data.count} {data.count === 1 ? 'item' : 'items'})
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-900">
                      {formatCurrency(data.tax)}
                    </p>
                    <p className="text-xs text-slate-500">
                      Base: {formatCurrency(data.subtotal)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Totales */}
        <div className="space-y-3 pt-3 border-t-2 border-slate-200">
          <div className="flex justify-between">
            <span className="text-slate-700 font-medium">Subtotal (sin IVA)</span>
            <span className="font-semibold text-slate-900">
              {formatCurrency(breakdown.subtotal)}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-slate-700 font-medium">Total IVA</span>
            <span className="font-semibold text-blue-600">
              {formatCurrency(breakdown.totalTax)}
            </span>
          </div>

          <div className="flex justify-between pt-3 border-t-2 border-slate-300">
            <span className="text-lg font-bold text-slate-900">TOTAL</span>
            <span className="text-2xl font-bold text-emerald-600">
              {formatCurrency(breakdown.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Versión compacta del desglose de IVA (solo totales)
 *
 * Útil para espacios reducidos como el sidebar del POS
 */
export function TaxBreakdownCompact({ items }: TaxBreakdownProps) {
  const breakdown = useMemo(() => {
    return calculateSaleTaxBreakdown(items);
  }, [items]);

  if (items.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 p-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-blue-700 font-medium">Subtotal</span>
          <span className="text-blue-900 font-semibold">
            {formatCurrency(breakdown.subtotal)}
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-blue-700 font-medium">IVA</span>
          <span className="text-blue-900 font-semibold">
            {formatCurrency(breakdown.totalTax)}
          </span>
        </div>

        <div className="flex justify-between pt-2 border-t-2 border-blue-300">
          <span className="text-blue-900 font-bold">Total</span>
          <span className="text-lg font-bold text-blue-900">
            {formatCurrency(breakdown.total)}
          </span>
        </div>
      </div>
    </div>
  );
}

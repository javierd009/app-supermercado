'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { useCreateProduct, useUpdateProduct } from '../hooks/useProducts';
import type { Product } from '../types';
import { TaxRateSelector } from '@/features/tax/components/TaxRateSelector';
import { calculateTaxFromTotal, calculateTaxFromSubtotal } from '@/features/tax/utils/taxCalculations';

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const { createProduct } = useCreateProduct();
  const { updateProduct } = useUpdateProduct();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    cost: '',
    price: '',
    stock: '',
    minStock: '10',
    taxRate: 13, // Default: IVA general
  });

  const [priceIncludesTax, setPriceIncludesTax] = useState(true); // Modo de cálculo de IVA
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar datos del producto si estamos editando
  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code,
        name: product.name,
        category: product.category || '',
        cost: product.cost.toString(),
        price: product.price.toString(),
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
        taxRate: product.taxRate,
      });
    }
  }, [product]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = 'El código es obligatorio';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    const cost = parseFloat(formData.cost);
    if (isNaN(cost) || cost < 0) {
      newErrors.cost = 'Costo inválido';
    }

    const price = parseFloat(formData.price);
    if (isNaN(price) || price < 0) {
      newErrors.price = 'Precio inválido';
    }

    if (cost > price) {
      newErrors.price = 'El precio debe ser mayor al costo';
    }

    const stock = parseInt(formData.stock, 10);
    if (isNaN(stock) || stock < 0) {
      newErrors.stock = 'Stock inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);

    try {
      // Calcular precio final según modo de ingreso
      const enteredPrice = parseFloat(formData.price);
      const finalPrice = priceIncludesTax
        ? enteredPrice  // Ya incluye IVA
        : calculateTaxFromSubtotal(enteredPrice, formData.taxRate as any).total;  // Calcular con IVA

      const input = {
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        category: formData.category.trim() || undefined,
        cost: parseFloat(formData.cost),
        price: finalPrice,  // Siempre guardar precio CON IVA en BD
        stock: parseInt(formData.stock, 10),
        minStock: parseInt(formData.minStock, 10) || 10,
        taxRate: formData.taxRate,
      };

      let result;

      if (product) {
        // Actualizar
        result = await updateProduct({
          id: product.id,
          ...input,
        });
      } else {
        // Crear
        result = await createProduct(input);
      }

      if (result.success) {
        onSuccess();
      } else {
        setErrors({ submit: result.error || 'Error al guardar producto' });
      }
    } catch (err: any) {
      setErrors({ submit: err.message || 'Error inesperado' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const margin = (() => {
    const cost = parseFloat(formData.cost);
    const price = parseFloat(formData.price);
    if (isNaN(cost) || isNaN(price) || price === 0) return 0;
    return ((price - cost) / price) * 100;
  })();

  return (
    <div className="rounded-2xl bg-white shadow-xl border border-slate-200/60 overflow-hidden">
      {/* Header mejorado */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-6">
        <div className="flex items-center">
          <div className="rounded-xl bg-white/20 p-3 mr-4">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={product ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <p className="text-orange-100 mt-1">
              {product ? 'Actualiza la información del producto' : 'Completa la información del nuevo producto'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <div className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 p-4 text-sm text-white shadow-lg shadow-red-500/20">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {errors.submit}
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Código *</label>
              <input
                type="text"
                placeholder="Ej: 7501055300082"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                disabled={isSubmitting || !!product}
                className={`w-full rounded-xl border-2 ${
                  errors.code ? 'border-red-500' : 'border-slate-200'
                } bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-50`}
              />
              {errors.code && (
                <p className="text-sm text-red-600">{errors.code}</p>
              )}
              {product && (
                <p className="text-xs text-slate-500">No se puede modificar el código</p>
              )}
              {!product && (
                <p className="text-xs text-slate-500">Código de barras o código interno</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Nombre del Producto *</label>
              <input
                type="text"
                placeholder="Ej: Coca Cola 500ml"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={isSubmitting}
                className={`w-full rounded-xl border-2 ${
                  errors.name ? 'border-red-500' : 'border-slate-200'
                } bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10 disabled:opacity-50`}
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Categoría</label>
            <input
              type="text"
              placeholder="Ej: Bebidas"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              disabled={isSubmitting}
              className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10 disabled:opacity-50"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Costo (₡) *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="text-slate-500">₡</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) => handleChange('cost', e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border-2 ${
                    errors.cost ? 'border-red-500' : 'border-slate-200'
                  } bg-white pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10 disabled:opacity-50`}
                />
              </div>
              {errors.cost && (
                <p className="text-sm text-red-600">{errors.cost}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Precio de Venta (₡) *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="text-slate-500">₡</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border-2 ${
                    errors.price ? 'border-red-500' : 'border-slate-200'
                  } bg-white pl-10 pr-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10 disabled:opacity-50`}
                />
              </div>
              {errors.price && (
                <p className="text-sm text-red-600">{errors.price}</p>
              )}
            </div>
          </div>

          {/* Selector de Tasa de IVA */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Tasa de IVA *</label>
            <TaxRateSelector
              value={formData.taxRate}
              onChange={(rate) => setFormData({ ...formData, taxRate: rate })}
              disabled={isSubmitting}
            />
          </div>

          {/* Modo de cálculo de IVA */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Modo de ingreso de precio</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPriceIncludesTax(true)}
                className={`border-2 p-3 text-left transition-all ${
                  priceIncludesTax
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
                      Precio INCLUYE IVA
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
                      Sistema calcula IVA hacia atrás
                    </p>
                  </div>
                  {priceIncludesTax && (
                    <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPriceIncludesTax(false)}
                className={`border-2 p-3 text-left transition-all ${
                  !priceIncludesTax
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-900 text-sm" style={{ fontFamily: 'Arial, sans-serif' }}>
                      Precio SIN IVA
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5" style={{ fontFamily: 'Arial, sans-serif' }}>
                      Sistema suma el IVA al precio
                    </p>
                  </div>
                  {!priceIncludesTax && (
                    <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Desglose de precio con IVA */}
          {formData.price && parseFloat(formData.price) > 0 && (() => {
            const price = parseFloat(formData.price);
            const taxCalc = priceIncludesTax
              ? calculateTaxFromTotal(price, formData.taxRate as any)
              : calculateTaxFromSubtotal(price, formData.taxRate as any);

            return (
              <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200 p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-blue-900">Desglose del Precio</h3>
                  <span className="text-xs font-bold text-blue-700 bg-blue-200 px-2 py-1 rounded">
                    {priceIncludesTax ? 'Precio incluye IVA' : 'Precio sin IVA'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-blue-700 font-medium mb-1">
                      {priceIncludesTax ? 'Precio sin IVA' : 'Precio base'}
                    </p>
                    <p className="text-lg font-bold text-blue-900">
                      ₡{taxCalc.subtotalBeforeTax.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 font-medium mb-1">IVA ({formData.taxRate}%)</p>
                    <p className="text-lg font-bold text-blue-900">
                      ₡{taxCalc.taxAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-700 font-medium mb-1">
                      {priceIncludesTax ? 'Precio ingresado' : 'Precio FINAL'}
                    </p>
                    <p className="text-lg font-bold text-emerald-600">
                      ₡{taxCalc.total.toFixed(2)}
                    </p>
                  </div>
                </div>
                {!priceIncludesTax && (
                  <div className="mt-3 pt-3 border-t border-blue-300">
                    <p className="text-xs text-blue-700">
                      💡 <strong>Precio de venta final:</strong> El cliente pagará ₡{taxCalc.total.toFixed(2)} (₡{price.toFixed(2)} + ₡{taxCalc.taxAmount.toFixed(2)} IVA)
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Indicador de margen mejorado */}
          {margin > 0 && (
            <div className={`rounded-xl p-4 ${
              margin > 50
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200'
                : margin > 30
                ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200'
                : 'bg-gradient-to-r from-slate-50 to-gray-50 border-2 border-slate-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`rounded-lg p-2 mr-3 ${
                    margin > 50 ? 'bg-green-500' : margin > 30 ? 'bg-blue-500' : 'bg-slate-500'
                  }`}>
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${
                      margin > 50 ? 'text-green-700' : margin > 30 ? 'text-blue-700' : 'text-slate-700'
                    }`}>
                      Margen de ganancia
                    </p>
                    <p className={`text-2xl font-bold ${
                      margin > 50 ? 'text-green-600' : margin > 30 ? 'text-blue-600' : 'text-slate-600'
                    }`}>
                      {margin.toFixed(1)}%
                    </p>
                  </div>
                </div>
                {margin > 50 && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                    Excelente
                  </span>
                )}
                {margin > 30 && margin <= 50 && (
                  <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
                    Bueno
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Stock Inicial *</label>
              <input
                type="number"
                placeholder="0"
                value={formData.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                disabled={isSubmitting}
                className={`w-full rounded-xl border-2 ${
                  errors.stock ? 'border-red-500' : 'border-slate-200'
                } bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10 disabled:opacity-50`}
              />
              {errors.stock && (
                <p className="text-sm text-red-600">{errors.stock}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Stock Mínimo (Alerta)</label>
              <input
                type="number"
                placeholder="10"
                value={formData.minStock}
                onChange={(e) => handleChange('minStock', e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder-slate-400 transition-all focus:border-orange-500 focus:outline-none focus:ring-4 focus:ring-orange-500/10 disabled:opacity-50"
              />
              <p className="text-xs text-slate-500">Se alertará cuando el stock baje de este número</p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-700 border-2 border-slate-200 transition-all hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3 font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:shadow-xl hover:shadow-orange-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {product ? 'Actualizando...' : 'Creando...'}
                </span>
              ) : (
                <span>{product ? 'Actualizar' : 'Crear'} Producto</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

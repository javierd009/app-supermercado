'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/Card';
import { useCreateProduct, useUpdateProduct } from '../hooks/useProducts';
import { useCategories } from '../hooks/useCategories';
import type { Product } from '../types';
import { TaxRateSelector } from '@/features/tax/components/TaxRateSelector';
import { calculateTaxFromTotal, calculateTaxFromSubtotal } from '@/features/tax/utils/taxCalculations';
import { CABYSSearch } from './CABYSSearch';

interface ProductFormProps {
  product?: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ProductForm({ product, onSuccess, onCancel }: ProductFormProps) {
  const { createProduct } = useCreateProduct();
  const { updateProduct } = useUpdateProduct();
  const { categories, isLoading: categoriesLoading } = useCategories();

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    category: '',
    categoryId: '', // ID de la categoría seleccionada
    cost: '',
    price: '',
    stock: '',
    minStock: '10',
    taxRate: 13, // Default: IVA general
    // Campos para Facturación Electrónica
    cabysCode: '',
    unitMeasure: 'Unid',
    commercialCode: '',
  });

  const [showFEFields, setShowFEFields] = useState(false); // Mostrar campos de FE

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
        categoryId: product.categoryId || '',
        cost: product.cost.toString(),
        price: product.price.toString(),
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
        taxRate: product.taxRate,
        // Campos para Facturación Electrónica
        cabysCode: product.cabysCode || '',
        unitMeasure: product.unitMeasure || 'Unid',
        commercialCode: product.commercialCode || '',
      });
      // Mostrar campos de FE si el producto ya tiene código CABYS
      if (product.cabysCode) {
        setShowFEFields(true);
      }
    }
  }, [product]);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  // Manejar selección de código CABYS
  const handleCABYSSelect = (result: { codigo: string; impuesto: number; descripcion: string }) => {
    setFormData((prev) => ({
      ...prev,
      cabysCode: result.codigo,
      taxRate: result.impuesto, // Asignar IVA automáticamente del catálogo oficial
    }));
  };

  // Manejar cambio de categoría - auto-poblar CABYS y tasa de IVA
  const handleCategoryChange = (categoryId: string) => {
    const selectedCategory = categories.find(c => c.id === categoryId);
    if (selectedCategory) {
      setFormData((prev) => ({
        ...prev,
        categoryId: categoryId,
        category: selectedCategory.name,
        // Auto-poblar CABYS si la categoría tiene uno definido
        cabysCode: selectedCategory.cabysCode || prev.cabysCode,
        // Auto-poblar tasa de IVA de la categoría
        taxRate: selectedCategory.taxRate || prev.taxRate,
      }));
      // Mostrar campos de FE si la categoría tiene CABYS
      if (selectedCategory.cabysCode) {
        setShowFEFields(true);
      }
    } else {
      // Si no hay categoría seleccionada
      setFormData((prev) => ({
        ...prev,
        categoryId: '',
        category: '',
      }));
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
        categoryId: formData.categoryId || undefined,
        cost: parseFloat(formData.cost),
        price: finalPrice,  // Siempre guardar precio CON IVA en BD
        stock: parseInt(formData.stock, 10),
        minStock: parseInt(formData.minStock, 10) || 10,
        taxRate: formData.taxRate,
        // Campos para Facturación Electrónica (solo si tienen valor)
        cabysCode: formData.cabysCode.trim() || undefined,
        unitMeasure: formData.unitMeasure || undefined,
        commercialCode: formData.commercialCode.trim() || undefined,
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
    <div className="rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 overflow-hidden">
      {/* Header moderno oscuro */}
      <div className="border-b border-white/10 bg-gradient-to-r from-emerald-600 to-teal-600 px-6 md:px-8 py-5 md:py-6">
        <div className="flex items-center">
          <div className="rounded-xl bg-white/20 p-2.5 md:p-3 mr-3 md:mr-4">
            <svg className="h-5 w-5 md:h-7 md:w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={product ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 4v16m8-8H4"} />
            </svg>
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
              {product ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <p className="text-xs md:text-sm text-emerald-100 mt-1 font-medium">
              {product ? 'Actualiza la información del producto' : 'Completa la información del nuevo producto'}
            </p>
          </div>
        </div>
      </div>

      <div className="p-5 md:p-8">
        <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
          {errors.submit && (
            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium">{errors.submit}</span>
              </div>
            </div>
          )}

          <div className="grid gap-5 md:gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Código *</label>
              <input
                type="text"
                placeholder="Ej: 7501055300082"
                value={formData.code}
                onChange={(e) => handleChange('code', e.target.value)}
                disabled={isSubmitting || !!product}
                className={`w-full rounded-xl border ${
                  errors.code ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/10'
                } bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed`}
              />
              {errors.code && (
                <p className="text-xs text-rose-400 font-medium">{errors.code}</p>
              )}
              {product && (
                <p className="text-xs text-slate-500">No se puede modificar el código</p>
              )}
              {!product && (
                <p className="text-xs text-slate-500">Código de barras o código interno</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Nombre del Producto *</label>
              <input
                type="text"
                placeholder="Ej: Coca Cola 500ml"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                disabled={isSubmitting}
                className={`w-full rounded-xl border ${
                  errors.name ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/10'
                } bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50`}
              />
              {errors.name && (
                <p className="text-xs text-rose-400 font-medium">{errors.name}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Categoría</label>
            <select
              value={formData.categoryId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              disabled={isSubmitting || categoriesLoading}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
            >
              <option value="" className="bg-slate-800">Seleccionar categoría...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-slate-800">
                  {cat.name} {cat.cabysCode ? `(CABYS: ${cat.cabysCode.substring(0, 8)}...)` : ''}
                </option>
              ))}
            </select>
            {formData.categoryId && (
              <p className="text-xs text-emerald-400">
                {categories.find(c => c.id === formData.categoryId)?.cabysCode
                  ? '✓ CABYS y tasa de IVA aplicados automáticamente'
                  : 'Categoría sin CABYS predefinido'}
              </p>
            )}
          </div>

          <div className="grid gap-5 md:gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Costo (₡) *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="text-emerald-400 font-bold">₡</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={(e) => handleChange('cost', e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border ${
                    errors.cost ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/10'
                  } bg-white/5 pl-10 pr-4 py-3 text-white placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50`}
                />
              </div>
              {errors.cost && (
                <p className="text-xs text-rose-400 font-medium">{errors.cost}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Precio de Venta (₡) *</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                  <span className="text-emerald-400 font-bold">₡</span>
                </div>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={(e) => handleChange('price', e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full rounded-xl border ${
                    errors.price ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/10'
                  } bg-white/5 pl-10 pr-4 py-3 text-white placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50`}
                />
              </div>
              {errors.price && (
                <p className="text-xs text-rose-400 font-medium">{errors.price}</p>
              )}
            </div>
          </div>

          {/* Selector de Tasa de IVA */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Tasa de IVA *</label>
            <TaxRateSelector
              value={formData.taxRate}
              onChange={(rate) => setFormData({ ...formData, taxRate: rate })}
              disabled={isSubmitting}
            />
          </div>

          {/* Modo de cálculo de IVA */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Modo de ingreso de precio</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPriceIncludesTax(true)}
                className={`border rounded-xl p-3 md:p-4 text-left transition-all ${
                  priceIncludesTax
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-sm">
                      Precio INCLUYE IVA
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Sistema calcula IVA hacia atrás
                    </p>
                  </div>
                  {priceIncludesTax && (
                    <svg className="h-5 w-5 text-emerald-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPriceIncludesTax(false)}
                className={`border rounded-xl p-3 md:p-4 text-left transition-all ${
                  !priceIncludesTax
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white text-sm">
                      Precio SIN IVA
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Sistema suma el IVA al precio
                    </p>
                  </div>
                  {!priceIncludesTax && (
                    <svg className="h-5 w-5 text-blue-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
              <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-4 md:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wide">Desglose del Precio</h3>
                  <span className="text-[10px] font-bold text-blue-300 bg-blue-500/20 px-2 py-1 rounded w-fit uppercase tracking-wider">
                    {priceIncludesTax ? 'Precio incluye IVA' : 'Precio sin IVA'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1.5">
                      {priceIncludesTax ? 'Precio sin IVA' : 'Precio base'}
                    </p>
                    <p className="text-lg md:text-xl font-black text-white tabular-nums">
                      ₡{taxCalc.subtotalBeforeTax.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mb-1.5">IVA ({formData.taxRate}%)</p>
                    <p className="text-lg md:text-xl font-black text-white tabular-nums">
                      ₡{taxCalc.taxAmount.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-lg">
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wide mb-1.5">
                      {priceIncludesTax ? 'Precio ingresado' : 'Precio FINAL'}
                    </p>
                    <p className="text-lg md:text-xl font-black text-emerald-400 tabular-nums">
                      ₡{taxCalc.total.toFixed(2)}
                    </p>
                  </div>
                </div>
                {!priceIncludesTax && (
                  <div className="mt-3 pt-3 border-t border-blue-500/20">
                    <p className="text-xs text-slate-300 font-medium">
                      💡 <strong className="text-blue-300">Precio de venta final:</strong> El cliente pagará ₡{taxCalc.total.toFixed(2)} (₡{price.toFixed(2)} + ₡{taxCalc.taxAmount.toFixed(2)} IVA)
                    </p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Indicador de margen mejorado */}
          {margin > 0 && (
            <div className={`rounded-xl p-4 border ${
              margin > 50
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : margin > 30
                ? 'bg-blue-500/10 border-blue-500/30'
                : 'bg-slate-500/10 border-slate-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`rounded-lg p-2 mr-3 ${
                    margin > 50 ? 'bg-emerald-500' : margin > 30 ? 'bg-blue-500' : 'bg-slate-500'
                  }`}>
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wide ${
                      margin > 50 ? 'text-emerald-400' : margin > 30 ? 'text-blue-400' : 'text-slate-400'
                    }`}>
                      Margen de ganancia
                    </p>
                    <p className={`text-2xl md:text-3xl font-black tabular-nums ${
                      margin > 50 ? 'text-emerald-400' : margin > 30 ? 'text-blue-400' : 'text-slate-400'
                    }`}>
                      {margin.toFixed(1)}%
                    </p>
                  </div>
                </div>
                {margin > 50 && (
                  <span className="inline-flex items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 uppercase tracking-wide">
                    Excelente
                  </span>
                )}
                {margin > 30 && margin <= 50 && (
                  <span className="inline-flex items-center rounded-full bg-blue-500/20 px-3 py-1 text-xs font-bold text-blue-300 uppercase tracking-wide">
                    Bueno
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Sección de Facturación Electrónica (colapsable) */}
          <div className="border border-white/10 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowFEFields(!showFEFields)}
              className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 transition-all"
            >
              <div className="flex items-center">
                <svg className="h-5 w-5 text-violet-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-bold text-white uppercase tracking-wide">
                  Facturación Electrónica
                </span>
                <span className="ml-2 text-xs text-slate-500">(Opcional)</span>
              </div>
              <svg
                className={`h-5 w-5 text-slate-400 transition-transform ${showFEFields ? 'rotate-180' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showFEFields && (
              <div className="p-4 space-y-4 bg-violet-500/5 border-t border-white/10">
                <p className="text-xs text-slate-400 mb-3">
                  Busca el código CABYS del producto. Al seleccionar uno, se asignará automáticamente el IVA correcto.
                </p>

                {/* Buscador de CABYS */}
                <CABYSSearch
                  onSelect={handleCABYSSelect}
                  currentCode={formData.cabysCode}
                  disabled={isSubmitting}
                />

                {/* Mostrar código seleccionado con validación */}
                {formData.cabysCode && (
                  <div className={`rounded-lg p-3 ${
                    formData.cabysCode.length === 13
                      ? 'bg-emerald-500/10 border border-emerald-500/30'
                      : 'bg-amber-500/10 border border-amber-500/30'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-slate-400">Código CABYS asignado:</p>
                        <p className="font-mono text-lg font-bold text-white">{formData.cabysCode}</p>
                      </div>
                      {formData.cabysCode.length === 13 ? (
                        <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <span className="text-xs text-amber-400">
                          ({formData.cabysCode.length}/13 dígitos)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">

                  {/* Unidad de Medida */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                      Unidad de Medida
                    </label>
                    <select
                      value={formData.unitMeasure}
                      onChange={(e) => handleChange('unitMeasure', e.target.value)}
                      disabled={isSubmitting}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                    >
                      <option value="Unid">Unid - Unidad</option>
                      <option value="Kg">Kg - Kilogramo</option>
                      <option value="g">g - Gramo</option>
                      <option value="Lt">Lt - Litro</option>
                      <option value="ml">ml - Mililitro</option>
                      <option value="m">m - Metro</option>
                      <option value="cm">cm - Centímetro</option>
                      <option value="m2">m² - Metro cuadrado</option>
                      <option value="m3">m³ - Metro cúbico</option>
                      <option value="Sp">Sp - Servicio Profesional</option>
                      <option value="Os">Os - Otro (especificar)</option>
                    </select>
                    <p className="text-xs text-slate-500">
                      Unidad para factura electrónica
                    </p>
                  </div>
                </div>

                {/* Código Comercial */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">
                    Código Comercial (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Código interno para factura electrónica"
                    value={formData.commercialCode}
                    onChange={(e) => handleChange('commercialCode', e.target.value)}
                    disabled={isSubmitting}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                  />
                  <p className="text-xs text-slate-500">
                    Si no se especifica, se usa el código de barras
                  </p>
                </div>

                {/* Link a consultar CABYS */}
                <div className="flex items-center gap-2 pt-2">
                  <a
                    href="https://www.bccr.fi.cr/seccion-indicadores-economicos/servicios-web/cabys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-violet-400 hover:text-violet-300 underline flex items-center"
                  >
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Consultar catálogo CABYS (BCCR)
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-5 md:gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Stock Inicial *</label>
              <input
                type="number"
                placeholder="0"
                value={formData.stock}
                onChange={(e) => handleChange('stock', e.target.value)}
                disabled={isSubmitting}
                className={`w-full rounded-xl border ${
                  errors.stock ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/10'
                } bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50`}
              />
              {errors.stock && (
                <p className="text-xs text-rose-400 font-medium">{errors.stock}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide">Stock Mínimo (Alerta)</label>
              <input
                type="number"
                placeholder="10"
                value={formData.minStock}
                onChange={(e) => handleChange('minStock', e.target.value)}
                disabled={isSubmitting}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
              />
              <p className="text-xs text-slate-500">Se alertará cuando el stock baje de este número</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-xl bg-white/5 px-6 py-3 font-bold text-white border border-white/10 transition-all hover:bg-white/10 hover:border-white/20 disabled:opacity-50 uppercase tracking-wide"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none uppercase tracking-wide"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
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

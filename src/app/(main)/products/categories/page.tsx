'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/features/products/hooks/useCategories';
import type { Category } from '@/features/products/services/categoriesService';
import {
  Home,
  LogOut,
  ArrowLeft,
  Folder,
  Plus,
  Edit2,
  Trash2,
  X,
  Check,
  RefreshCw,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export default function CategoriesPage() {
  const { user } = useAuth();
  const { categories, isLoading, error, loadCategories } = useCategories();
  const { createCategory, isCreating } = useCreateCategory();
  const { updateCategory, isUpdating } = useUpdateCategory();
  const { deleteCategory, isDeleting } = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    cabysCode: '',
    taxRate: '13',
    description: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Verificar permisos
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h1>
          <p className="text-slate-400">Solo administradores pueden gestionar categorías</p>
          <Link href="/products" className="mt-4 inline-block text-blue-400 hover:underline">
            Volver a Inventario
          </Link>
        </div>
      </div>
    );
  }

  const resetForm = () => {
    setFormData({ name: '', cabysCode: '', taxRate: '13', description: '' });
    setEditingCategory(null);
    setShowForm(false);
    setFormError(null);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      cabysCode: category.cabysCode || '',
      taxRate: category.taxRate?.toString() || '13',
      description: category.description || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('El nombre es obligatorio');
      return;
    }

    const taxRate = parseFloat(formData.taxRate);
    if (isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      setFormError('Tasa de IVA inválida (0-100)');
      return;
    }

    try {
      if (editingCategory) {
        const result = await updateCategory(editingCategory.id, {
          name: formData.name.trim(),
          cabysCode: formData.cabysCode.trim() || null,
          taxRate,
          description: formData.description.trim() || null,
        });
        if (!result.success) {
          setFormError(result.error || 'Error al actualizar');
          return;
        }
      } else {
        const result = await createCategory({
          name: formData.name.trim(),
          cabysCode: formData.cabysCode.trim() || undefined,
          taxRate,
          description: formData.description.trim() || undefined,
        });
        if (!result.success) {
          setFormError(result.error || 'Error al crear');
          return;
        }
      }

      resetForm();
      loadCategories();
    } catch (err: any) {
      setFormError(err.message || 'Error inesperado');
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteCategory(id);
    if (result.success) {
      setDeleteConfirm(null);
      loadCategories();
    } else {
      alert(result.error || 'Error al eliminar categoría');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Header */}
      <header className="min-h-[4.5rem] md:h-20 px-3 md:px-8 flex items-center justify-between border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-2 md:gap-6 flex-1 min-w-0">
          <Link href="/dashboard" className="flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-700 p-2 md:p-2.5 rounded-xl border border-white/20 shadow-xl hover:scale-105 transition-transform">
            <Home className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 md:gap-2">
              <Folder className="w-4 h-4 md:w-5 md:h-5 text-purple-500 flex-shrink-0" />
              <p className="text-base md:text-xl font-black text-white tracking-tight uppercase truncate">Categorías</p>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider hidden sm:block">
              Gestión de categorías con CABYS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-3 md:px-6 py-2.5 md:py-3 rounded-xl text-white font-bold text-xs md:text-sm transition-all flex items-center gap-1.5 md:gap-2 shadow-lg shadow-purple-500/30 uppercase tracking-wide"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nueva</span>
          </button>

          <Link href="/products" className="hidden md:block">
            <button className="px-4 py-2 bg-white/5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all border border-white/5 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">Inventario</span>
            </button>
          </Link>

          <Link href="/logout" className="hidden md:block">
            <button className="p-3 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-white/5">
              <LogOut className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
        {/* Info */}
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <FileText className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-purple-400 mb-1">Categorías con CABYS</h3>
              <p className="text-sm text-purple-300">
                Asigne un código CABYS a cada categoría. Cuando agregue productos, el sistema
                auto-poblará el CABYS según la categoría seleccionada.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
            <p className="text-rose-400">{error}</p>
          </div>
        )}

        {/* Lista de categorías */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="bg-white/5 rounded-xl border border-white/10 p-12 text-center">
            <Folder className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No hay categorías</h3>
            <p className="text-slate-400 mb-4">Cree categorías para organizar sus productos y asignar CABYS</p>
            <button
              onClick={() => { resetForm(); setShowForm(true); }}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 rounded-xl text-white font-bold"
            >
              Crear Primera Categoría
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-white/5 rounded-xl border border-white/10 p-5 hover:bg-white/[0.08] transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Folder className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-slate-400">{category.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mt-3">
                      <div className="bg-white/5 rounded-lg px-3 py-2">
                        <span className="text-xs text-slate-400 uppercase font-bold">CABYS:</span>
                        <span className={`ml-2 font-mono ${category.cabysCode ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {category.cabysCode || 'No asignado'}
                        </span>
                      </div>
                      <div className="bg-white/5 rounded-lg px-3 py-2">
                        <span className="text-xs text-slate-400 uppercase font-bold">IVA:</span>
                        <span className="ml-2 text-blue-400 font-bold">{category.taxRate}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="p-3 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-all"
                      title="Editar"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {deleteConfirm === category.id ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(category.id)}
                          disabled={isDeleting}
                          className="p-3 bg-rose-500 text-white rounded-xl transition-all disabled:opacity-50"
                          title="Confirmar"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="p-3 bg-white/10 text-slate-400 rounded-xl transition-all"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(category.id)}
                        className="p-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-xl transition-all"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de formulario */}
      {showForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-2xl border border-white/10 max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Folder className="w-5 h-5 text-purple-400" />
                </div>
                <h2 className="text-xl font-bold text-white">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h2>
              </div>
              <button
                onClick={resetForm}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                <p className="text-sm text-rose-400">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                  Nombre *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Bebidas"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                  Código CABYS
                </label>
                <input
                  type="text"
                  value={formData.cabysCode}
                  onChange={(e) => setFormData({ ...formData, cabysCode: e.target.value })}
                  placeholder="Ej: 2211001000000 (13 dígitos)"
                  maxLength={13}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 font-mono"
                />
                <p className="text-xs text-slate-500 mt-1">
                  {formData.cabysCode.length}/13 dígitos -
                  <a href="https://www.bccr.fi.cr/seccion-indicadores-economicos/servicios-web/cabys" target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:underline ml-1">
                    Consultar catálogo CABYS
                  </a>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                  Tasa de IVA (%)
                </label>
                <select
                  value={formData.taxRate}
                  onChange={(e) => setFormData({ ...formData, taxRate: e.target.value })}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="13" className="bg-slate-800">13% - IVA General</option>
                  <option value="4" className="bg-slate-800">4% - IVA Reducido</option>
                  <option value="2" className="bg-slate-800">2% - IVA Super Reducido</option>
                  <option value="1" className="bg-slate-800">1% - IVA Mínimo</option>
                  <option value="0" className="bg-slate-800">0% - Exento</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción de la categoría..."
                  rows={2}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={isCreating || isUpdating}
                  className="flex-1 bg-white/5 hover:bg-white/10 px-4 py-3 rounded-xl text-white font-bold transition-all border border-white/10 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-4 py-3 rounded-xl text-white font-bold transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50"
                >
                  {isCreating || isUpdating ? 'Guardando...' : editingCategory ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <footer className="py-6 px-8 bg-[#020617]/80 backdrop-blur-xl border-t border-white/5 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-lg font-black text-white uppercase tracking-wider">SABROSITA</p>
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wide">
            Gestión de Categorías
          </p>
        </div>
      </footer>
    </div>
  );
}

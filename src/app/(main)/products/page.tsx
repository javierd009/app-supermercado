'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ProductsList, ProductForm, CSVImporter } from '@/features/products/components';
import { useLoadProducts, useProducts } from '@/features/products/hooks/useProducts';
import type { Product } from '@/features/products/types';
import {
  Package,
  TrendingDown,
  DollarSign,
  TrendingUp,
  Layers,
  AlertTriangle,
  Upload,
  Plus,
  FileSpreadsheet,
  FileText,
  Barcode,
  ArrowLeft,
  Home,
  Clock,
  LogOut
} from 'lucide-react';

type View = 'list' | 'create' | 'edit' | 'import';

export default function ProductsPage() {
  const { user } = useAuth();
  const { products } = useProducts();
  useLoadProducts();

  const [view, setView] = useState<View>('list');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCreate = () => {
    setSelectedProduct(null);
    setView('create');
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setView('edit');
  };

  const handleImport = () => {
    setView('import');
  };

  const handleSuccess = () => {
    setView('list');
    setSelectedProduct(null);
  };

  const handleCancel = () => {
    setView('list');
    setSelectedProduct(null);
  };

  const handleExportCSV = () => {
    alert('Exportando inventario a CSV... (Funcionalidad próximamente)');
  };

  const handleExportPDF = () => {
    alert('Exportando inventario a PDF... (Funcionalidad próximamente)');
  };

  const handlePrintBarcodes = () => {
    alert('Imprimiendo códigos de barras... (Funcionalidad próximamente)');
  };

  // Estadísticas
  const totalProducts = products.length;
  const lowStockProducts = products.filter(p => p.stock <= p.minStock).length;
  const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
  const totalCost = products.reduce((sum, p) => sum + (p.cost * p.stock), 0);
  const totalProfit = totalValue - totalCost;
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))].length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getViewTitle = () => {
    switch (view) {
      case 'create': return 'Nuevo Producto';
      case 'edit': return 'Editar Producto';
      case 'import': return 'Importar CSV';
      default: return 'Inventario';
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Header */}
      <header className="h-20 px-6 md:px-8 flex items-center justify-between border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl border border-white/20 shadow-xl hover:scale-105 transition-transform">
            <Home className="h-5 w-5 text-white" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-emerald-500" />
              <p className="text-xl font-black text-white tracking-tight uppercase">{getViewTitle()}</p>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{totalProducts} productos</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-lg font-bold text-white tabular-nums">{currentTime.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</p>
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{currentTime.toLocaleDateString('es-CR', { weekday: 'short', day: '2-digit', month: 'short' })}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm">
                {user?.username?.substring(0, 1).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">{user?.username}</p>
                <p className="text-[8px] text-slate-500 uppercase tracking-wide">
                  {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Cajero'}
                </p>
              </div>
            </div>

            <Link href="/logout">
              <button className="p-3 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-white/5">
                <LogOut className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Action Bar */}
      <div className="px-6 md:px-8 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {view !== 'list' && (
            <button
              onClick={handleCancel}
              className="bg-slate-600 hover:bg-slate-700 px-4 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-wide transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Volver
            </button>
          )}
        </div>

        {view === 'list' && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="bg-white/5 hover:bg-emerald-500/20 px-4 py-2 rounded-xl text-emerald-400 font-bold text-xs uppercase tracking-wide transition-all border border-white/5 flex items-center gap-2"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-white/5 hover:bg-rose-500/20 px-4 py-2 rounded-xl text-rose-400 font-bold text-xs uppercase tracking-wide transition-all border border-white/5 flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              onClick={handlePrintBarcodes}
              className="bg-white/5 hover:bg-amber-500/20 px-4 py-2 rounded-xl text-amber-400 font-bold text-xs uppercase tracking-wide transition-all border border-white/5 flex items-center gap-2"
            >
              <Barcode className="w-3.5 h-3.5" />
              Códigos
            </button>

            {(user?.role === 'admin' || user?.role === 'super_admin') && (
              <>
                <button
                  onClick={handleImport}
                  className="bg-amber-600 hover:bg-amber-700 px-4 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-wide transition-all flex items-center gap-2"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Importar
                </button>
                <button
                  onClick={handleCreate}
                  className="bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-wide transition-all flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nuevo
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Stats - Solo en vista lista */}
        {view === 'list' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-4">
            <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
              <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
                <Package className="w-4 h-4" />
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Productos</p>
              <h3 className="text-2xl font-black text-white tabular-nums">{totalProducts}</h3>
            </div>

            <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
              <div className="p-3 bg-gradient-to-tr from-amber-400 to-orange-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
                <Layers className="w-4 h-4" />
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Categorías</p>
              <h3 className="text-2xl font-black text-white tabular-nums">{categories}</h3>
            </div>

            <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
              <div className="p-3 bg-gradient-to-tr from-rose-400 to-red-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
                <TrendingDown className="w-4 h-4" />
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Stock Bajo</p>
              <h3 className="text-2xl font-black text-rose-400 tabular-nums">{lowStockProducts}</h3>
            </div>

            <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
              <div className="p-3 bg-gradient-to-tr from-emerald-400 to-teal-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
                <DollarSign className="w-4 h-4" />
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Valor Total</p>
              <h3 className="text-lg font-black text-emerald-400 tabular-nums">{formatCurrency(totalValue)}</h3>
            </div>

            <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
              <div className="p-3 bg-gradient-to-tr from-amber-400 to-orange-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
                <TrendingDown className="w-4 h-4" />
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Costo Total</p>
              <h3 className="text-lg font-black text-amber-400 tabular-nums">{formatCurrency(totalCost)}</h3>
            </div>

            <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
              <div className="p-3 bg-gradient-to-tr from-teal-400 to-cyan-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
                <TrendingUp className="w-4 h-4" />
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Utilidad</p>
              <h3 className="text-lg font-black text-teal-400 tabular-nums">{formatCurrency(totalProfit)}</h3>
            </div>
          </div>
        )}

        {/* Alerta de Stock Bajo */}
        {view === 'list' && lowStockProducts > 0 && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-rose-500 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-black text-rose-400 text-lg uppercase">Alerta de Inventario</h3>
                <p className="text-sm text-slate-300 font-medium mt-1">
                  Hay {lowStockProducts} producto{lowStockProducts !== 1 ? 's' : ''} con stock por debajo del mínimo.
                </p>
              </div>
              <div className="bg-rose-500 px-4 py-2 rounded-xl">
                <span className="text-white font-black text-lg">{lowStockProducts}</span>
              </div>
            </div>
          </div>
        )}

        {/* Content Views */}
        {view === 'list' && <ProductsList onEdit={handleEdit} />}
        {(view === 'create' || view === 'edit') && (
          <ProductForm product={selectedProduct} onSuccess={handleSuccess} onCancel={handleCancel} />
        )}
        {view === 'import' && <CSVImporter onSuccess={handleSuccess} />}
      </main>

      <footer className="py-6 px-8 bg-[#020617]/80 backdrop-blur-xl border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-lg font-black text-white uppercase tracking-wider">SABROSITA</p>
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wide">
            © 2026 Sabrosita POS v1.0
          </p>
        </div>
      </footer>
    </div>
  );
}

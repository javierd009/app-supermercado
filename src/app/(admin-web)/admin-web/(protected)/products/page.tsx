'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Search,
  Package,
  Edit2,
  Save,
  X,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Hash,
} from 'lucide-react';

interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  barcode?: string;
  image_url?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Product>>({});
  const [isSaving, setIsSaving] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadProducts();

    // Suscribirse a cambios en tiempo real
    const productsChannel = supabase
      .channel('admin-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, (payload) => {
        console.log('[Admin Products] Cambio detectado:', payload);
        loadProducts();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsChannel);
    };
  }, []);

  useEffect(() => {
    // Filtrar productos según búsqueda
    if (searchTerm.trim() === '') {
      setFilteredProducts(products);
    } else {
      const term = searchTerm.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.code.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          p.barcode?.toLowerCase().includes(term)
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setProducts(data || []);
      setFilteredProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setEditForm({
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      min_stock: product.min_stock,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async (productId: string) => {
    try {
      setIsSaving(true);
      const { error } = await supabase
        .from('products')
        .update({
          price: editForm.price,
          cost: editForm.cost,
          stock: editForm.stock,
          min_stock: editForm.min_stock,
          updated_at: new Date().toISOString(),
        })
        .eq('id', productId);

      if (error) throw error;

      console.log(`[Admin Products] Producto ${productId} actualizado. Sincronizando a POS...`);

      // La sincronización se maneja automáticamente por realtime-sync.ts
      await loadProducts();
      setEditingId(null);
      setEditForm({});
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error al guardar cambios');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock === 0) return { text: 'Sin Stock', color: 'text-red-400', bg: 'bg-red-500/10' };
    if (stock <= minStock) return { text: 'Stock Bajo', color: 'text-yellow-400', bg: 'bg-yellow-500/10' };
    return { text: 'Stock OK', color: 'text-green-400', bg: 'bg-green-500/10' };
  };

  const calculateMargin = (price: number, cost: number) => {
    if (cost === 0) return 0;
    return ((price - cost) / price) * 100;
  };

  return (
    <div className="min-h-screen bg-[#020617] pb-20 lg:pb-6">
      {/* Header */}
      <div className="bg-[#020617]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10 px-4 lg:px-8 py-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-white">Gestión de Productos</h1>
            <p className="text-slate-400 text-sm font-medium mt-1">
              Actualiza precios y stock en tiempo real
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 lg:max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre, código, categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-slate-400 text-xs font-bold uppercase">Total</p>
            <p className="text-white text-xl font-black">{products.length}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-slate-400 text-xs font-bold uppercase">Stock Bajo</p>
            <p className="text-yellow-400 text-xl font-black">
              {products.filter((p) => p.stock <= p.min_stock && p.stock > 0).length}
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-3">
            <p className="text-slate-400 text-xs font-bold uppercase">Sin Stock</p>
            <p className="text-red-400 text-xl font-black">
              {products.filter((p) => p.stock === 0).length}
            </p>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="px-4 lg:px-8 py-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-slate-400 mt-4 font-medium">Cargando productos...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg font-bold">
              {searchTerm ? 'No se encontraron productos' : 'No hay productos registrados'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredProducts.map((product) => {
              const isEditing = editingId === product.id;
              const stockStatus = getStockStatus(product.stock, product.min_stock);
              const margin = calculateMargin(product.price, product.cost);

              return (
                <div
                  key={product.id}
                  className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/[0.08] transition-all"
                >
                  {/* Product Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-black text-lg">{product.name}</h3>
                        <span className={`px-2 py-1 rounded-lg text-xs font-bold ${stockStatus.bg} ${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 text-sm font-medium">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {product.code}
                        </span>
                        <span>•</span>
                        <span>{product.category}</span>
                      </div>
                    </div>

                    {/* Edit Button */}
                    {!isEditing && (
                      <button
                        onClick={() => startEdit(product)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Product Details / Edit Form */}
                  {isEditing ? (
                    <div className="space-y-3">
                      {/* Edit Form */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-slate-400 text-xs font-bold uppercase block mb-1">
                            Precio Venta
                          </label>
                          <input
                            type="number"
                            value={editForm.price || ''}
                            onChange={(e) => setEditForm({ ...editForm, price: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-xs font-bold uppercase block mb-1">
                            Costo
                          </label>
                          <input
                            type="number"
                            value={editForm.cost || ''}
                            onChange={(e) => setEditForm({ ...editForm, cost: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-xs font-bold uppercase block mb-1">
                            Stock Actual
                          </label>
                          <input
                            type="number"
                            value={editForm.stock || ''}
                            onChange={(e) => setEditForm({ ...editForm, stock: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="text-slate-400 text-xs font-bold uppercase block mb-1">
                            Stock Mínimo
                          </label>
                          <input
                            type="number"
                            value={editForm.min_stock || ''}
                            onChange={(e) => setEditForm({ ...editForm, min_stock: parseInt(e.target.value) })}
                            className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => saveEdit(product.id)}
                          disabled={isSaving}
                          className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-xl transition-all disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {isSaving ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={isSaving}
                          className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-xl transition-all disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Sync Info */}
                      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-2">
                        <p className="text-blue-200 text-xs font-medium">
                          💡 Los cambios se sincronizarán automáticamente con todos los POS en tiempo real
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Precio */}
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-1">Precio</p>
                        <p className="text-white text-xl font-black">{formatCurrency(product.price)}</p>
                      </div>

                      {/* Costo */}
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-1">Costo</p>
                        <p className="text-white text-xl font-black">{formatCurrency(product.cost)}</p>
                      </div>

                      {/* Stock */}
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-1">Stock</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-white text-xl font-black">{product.stock}</p>
                          <p className="text-slate-500 text-sm font-medium">/ {product.min_stock}</p>
                        </div>
                      </div>

                      {/* Margen */}
                      <div className="bg-white/5 rounded-lg p-3">
                        <p className="text-slate-400 text-xs font-bold uppercase mb-1">Margen</p>
                        <div className="flex items-center gap-2">
                          {margin > 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-400" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-400" />
                          )}
                          <p className={`text-xl font-black ${margin > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {margin.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="px-4 lg:px-8 pb-6">
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <div className="bg-green-500 p-2 rounded-lg">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-sm mb-1">
                Actualización en Tiempo Real
              </h4>
              <p className="text-green-200 text-sm font-medium">
                Los cambios de precio y stock se sincronizan automáticamente con todos los POS.
                Las ventas antiguas mantienen sus precios históricos.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

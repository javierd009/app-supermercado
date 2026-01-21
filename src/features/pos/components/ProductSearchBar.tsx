'use client';

import { useState, useRef, useEffect } from 'react';
import { useAddProductByCode } from '../hooks/usePOS';
import { useAddProductByCode as useAddProductByCodeMulti } from '../hooks/usePOSWindow';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useScanner } from '@/features/scanner/hooks';
import { Search, Loader2, ScanBarcode, Plus } from 'lucide-react';
import type { Product } from '@/features/products/types';

interface ProductSearchBarProps {
  autoFocus?: boolean;
  windowId?: string;
}

export function ProductSearchBar({ autoFocus = true, windowId }: ProductSearchBarProps) {
  const { addProductByCode: addProductSingle } = useAddProductByCode();
  const { addProductByCode: addProductMulti } = windowId ? useAddProductByCodeMulti(windowId) : { addProductByCode: addProductSingle };
  const { products } = useProducts();

  const addProductByCode = windowId ? addProductMulti : addProductSingle;
  const [query, setQuery] = useState('');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { isScanning, lastScan } = useScanner();

  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Filtrar productos mientras el usuario escribe
  useEffect(() => {
    if (query.trim().length === 0) {
      setFilteredProducts([]);
      setShowDropdown(false);
      return;
    }

    const search = query.toLowerCase().trim();
    const matches = products.filter(
      (p) =>
        p.code.toLowerCase().includes(search) ||
        p.name.toLowerCase().includes(search)
    ).slice(0, 10); // Limitar a 10 resultados

    setFilteredProducts(matches);
    setShowDropdown(matches.length > 0);
    setSelectedIndex(0);
  }, [query, products]);

  // Scanner
  useEffect(() => {
    if (lastScan && lastScan.source === 'scanner' && lastScan.code) {
      handleAddProduct(lastScan.code);
    }
  }, [lastScan]);

  const handleAddProduct = async (productQuery: string) => {
    const success = await addProductByCode(productQuery);
    if (success) {
      setQuery('');
      setShowDropdown(false);
      inputRef.current?.focus();
    } else {
      alert(`Producto "${productQuery}" no encontrado en el catálogo.`);
      setQuery('');
      setShowDropdown(false);
      inputRef.current?.focus();
    }
  };

  const handleSelectProduct = async (product: Product) => {
    await handleAddProduct(product.code);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown || filteredProducts.length === 0) {
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredProducts.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredProducts[selectedIndex]) {
          handleSelectProduct(filteredProducts[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowDropdown(false);
        setQuery('');
        break;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Si hay resultados y dropdown visible, seleccionar el primero
    if (showDropdown && filteredProducts.length > 0) {
      handleSelectProduct(filteredProducts[selectedIndex]);
    } else {
      // Si no hay dropdown, buscar por código exacto
      handleAddProduct(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
            {isScanning ? (
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-slate-500" />
            )}
          </div>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            onFocus={() => query.trim() && filteredProducts.length > 0 && setShowDropdown(true)}
            placeholder="Escanear código de barras o escribir nombre del producto..."
            autoComplete="off"
            className={`w-full bg-white/10 border py-4 pl-12 pr-4 rounded-xl text-sm font-bold text-white placeholder:text-slate-500 transition-all focus:outline-none ${
              isScanning
                ? 'border-blue-500 ring-2 ring-blue-500/20'
                : showDropdown
                ? 'border-blue-500 ring-2 ring-blue-500/20 rounded-b-none'
                : 'border-white/20 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20'
            }`}
          />

          {isScanning && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-black uppercase tracking-wide animate-pulse border border-blue-500/30">
              <ScanBarcode className="w-3.5 h-3.5" />
              Scanner Listo
            </div>
          )}

          {/* Dropdown de resultados */}
          {showDropdown && filteredProducts.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 bg-slate-900/95 backdrop-blur-xl border border-blue-500 border-t-0 rounded-b-xl shadow-2xl max-h-80 overflow-y-auto z-50"
            >
              {filteredProducts.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => handleSelectProduct(product)}
                  className={`w-full px-4 py-3 text-left transition-colors border-b border-white/10 last:border-b-0 ${
                    index === selectedIndex
                      ? 'bg-blue-500/30'
                      : 'hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-bold text-white">{product.name}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Código: {product.code} | Stock: {product.stock}
                      </p>
                    </div>
                    <p className="text-sm font-black text-white ml-3">
                      {new Intl.NumberFormat('es-CR', {
                        style: 'currency',
                        currency: 'CRC',
                      }).format(product.price)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-4 rounded-xl text-sm transition-all active:scale-95 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Agregar
        </button>
      </div>
    </form>
  );
}

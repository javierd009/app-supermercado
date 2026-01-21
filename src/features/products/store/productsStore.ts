import { create } from 'zustand';
import type { Product, ProductsState, ProductFilters } from '../types';

interface ProductsStore extends ProductsState {
  // Actions
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setFilters: (filters: Partial<ProductFilters>) => void;
  clearFilters: () => void;

  // Selectors
  getProductByCode: (code: string) => Product | undefined;
  getProductById: (id: string) => Product | undefined;
  searchProduct: (query: string) => Product | undefined;
  getLowStockProducts: () => Product[];
  getFilteredProducts: () => Product[];
}

export const useProductsStore = create<ProductsStore>((set, get) => ({
  // State inicial
  products: [],
  isLoading: false,
  error: null,
  filters: {},

  // Establecer lista completa de productos
  setProducts: (products) => set({ products, error: null }),

  // Agregar producto
  addProduct: (product) =>
    set((state) => ({
      products: [...state.products, product],
    })),

  // Actualizar producto
  updateProduct: (updatedProduct) =>
    set((state) => ({
      products: state.products.map((p) =>
        p.id === updatedProduct.id ? updatedProduct : p
      ),
    })),

  // Eliminar producto
  removeProduct: (id) =>
    set((state) => ({
      products: state.products.filter((p) => p.id !== id),
    })),

  // Establecer loading
  setLoading: (isLoading) => set({ isLoading }),

  // Establecer error
  setError: (error) => set({ error, isLoading: false }),

  // Establecer filtros
  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  // Limpiar filtros
  clearFilters: () => set({ filters: {} }),

  // Buscar producto por código
  getProductByCode: (code) => {
    const { products } = get();
    return products.find((p) => p.code === code);
  },

  // Buscar producto por ID
  getProductById: (id) => {
    const { products } = get();
    return products.find((p) => p.id === id);
  },

  // Buscar producto por código O nombre
  searchProduct: (query) => {
    const { products } = get();
    const search = query.toLowerCase().trim();

    // Primero buscar por código exacto
    let product = products.find((p) => p.code.toLowerCase() === search);

    // Si no encuentra, buscar por nombre (match parcial)
    if (!product) {
      product = products.find((p) => p.name.toLowerCase().includes(search));
    }

    return product;
  },

  // Obtener productos con stock bajo
  getLowStockProducts: () => {
    const { products } = get();
    return products.filter((p) => p.stock <= p.minStock);
  },

  // Obtener productos filtrados
  getFilteredProducts: () => {
    const { products, filters } = get();
    let filtered = [...products];

    // Filtro de búsqueda (código o nombre)
    if (filters.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.code.toLowerCase().includes(search) ||
          p.name.toLowerCase().includes(search)
      );
    }

    // Filtro de categoría
    if (filters.category) {
      filtered = filtered.filter((p) => p.category === filters.category);
    }

    // Filtro de stock bajo
    if (filters.lowStock) {
      filtered = filtered.filter((p) => p.stock <= p.minStock);
    }

    return filtered;
  },
}));

// Selector helpers
export const selectProducts = (state: ProductsStore) => state.products;
export const selectFilteredProducts = (state: ProductsStore) => state.getFilteredProducts();
export const selectLowStockProducts = (state: ProductsStore) => state.getLowStockProducts();

import { useEffect, useMemo } from 'react';
import { useProductsStore } from '../store/productsStore';
import { productsService } from '../services/productsService';
import type { CreateProductInput, UpdateProductInput, ProductCSVRow } from '../types';

/**
 * Hook principal para gestión de productos
 */
export function useProducts() {
  const products = useProductsStore((state) => state.products);
  const isLoading = useProductsStore((state) => state.isLoading);
  const error = useProductsStore((state) => state.error);
  const filters = useProductsStore((state) => state.filters);

  const setProducts = useProductsStore((state) => state.setProducts);
  const addProduct = useProductsStore((state) => state.addProduct);
  const updateProduct = useProductsStore((state) => state.updateProduct);
  const removeProduct = useProductsStore((state) => state.removeProduct);
  const setLoading = useProductsStore((state) => state.setLoading);
  const setError = useProductsStore((state) => state.setError);
  const setFilters = useProductsStore((state) => state.setFilters);
  const clearFilters = useProductsStore((state) => state.clearFilters);

  const getProductByCode = useProductsStore((state) => state.getProductByCode);
  const getProductById = useProductsStore((state) => state.getProductById);
  const searchProduct = useProductsStore((state) => state.searchProduct);

  // FIXED: Compute filtered products with useMemo to avoid infinite loops
  const filteredProducts = useMemo(() => {
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
  }, [products, filters]);

  // Compute low stock products with useMemo
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.stock <= p.minStock);
  }, [products]);

  return {
    products,
    filteredProducts,
    lowStockProducts,
    isLoading,
    error,
    filters,
    setFilters,
    clearFilters,
    getProductByCode,
    getProductById,
    searchProduct,
    setProducts,
    addProduct,
    updateProduct,
    removeProduct,
    setLoading,
    setError,
  };
}

/**
 * Hook para cargar productos desde Supabase
 */
export function useLoadProducts() {
  const { setProducts, setLoading, setError } = useProducts();

  const loadProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const products = await productsService.getAll();
      setProducts(products);
    } catch (err: any) {
      setError(err.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  // Cargar productos al montar
  useEffect(() => {
    loadProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { loadProducts };
}

/**
 * Hook para crear producto
 */
export function useCreateProduct() {
  const { addProduct, setLoading, setError } = useProducts();

  const createProduct = async (input: CreateProductInput) => {
    setLoading(true);
    setError(null);

    const result = await productsService.create(input);

    if (result.success && result.product) {
      addProduct(result.product);
      return { success: true, product: result.product };
    } else {
      setError(result.error || 'Error al crear producto');
      return { success: false, error: result.error };
    }
  };

  return { createProduct };
}

/**
 * Hook para actualizar producto
 */
export function useUpdateProduct() {
  const { updateProduct: updateInStore, setLoading, setError } = useProducts();

  const updateProduct = async (input: UpdateProductInput) => {
    setLoading(true);
    setError(null);

    const result = await productsService.update(input);

    if (result.success && result.product) {
      updateInStore(result.product);
      return { success: true, product: result.product };
    } else {
      setError(result.error || 'Error al actualizar producto');
      return { success: false, error: result.error };
    }
  };

  return { updateProduct };
}

/**
 * Hook para eliminar producto
 */
export function useDeleteProduct() {
  const { removeProduct, setLoading, setError } = useProducts();

  const deleteProduct = async (id: string) => {
    setLoading(true);
    setError(null);

    const result = await productsService.delete(id);

    if (result.success) {
      removeProduct(id);
      return { success: true };
    } else {
      setError(result.error || 'Error al eliminar producto');
      return { success: false, error: result.error };
    }
  };

  return { deleteProduct };
}

/**
 * Hook para importar desde CSV
 */
export function useImportCSV() {
  const { setProducts, setLoading, setError } = useProducts();

  const importCSV = async (rows: ProductCSVRow[]) => {
    setLoading(true);
    setError(null);

    const result = await productsService.importFromCSV(rows);

    if (result.success) {
      // Recargar productos
      const products = await productsService.getAll();
      setProducts(products);
    }

    setLoading(false);

    return result;
  };

  return { importCSV };
}

/**
 * Hook para buscar producto en tiempo real
 */
export function useProductSearch() {
  const { setFilters } = useProducts();

  const search = (query: string) => {
    setFilters({ search: query });
  };

  return { search };
}

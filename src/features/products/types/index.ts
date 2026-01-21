export interface Product {
  id: string;
  code: string;  // Código de barras o código interno
  name: string;
  category?: string;
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  taxRate: number;  // Tasa de IVA (0, 4, o 13)
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  code: string;
  name: string;
  category?: string;
  cost: number;
  price: number;
  stock: number;
  minStock?: number;
  taxRate?: number;  // Tasa de IVA (default 13)
}

export interface UpdateProductInput extends Partial<CreateProductInput> {
  id: string;
}

export interface ProductFilters {
  search?: string;  // Buscar por código o nombre
  category?: string;
  lowStock?: boolean;  // Productos con stock bajo
}

// Para importación CSV
export interface ProductCSVRow {
  code: string;
  name: string;
  quantity?: number | string;  // stock
  cost?: number | string;
  price?: number | string;
  category?: string;
}

export interface CSVImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
    data: any;
  }>;
}

export interface ProductsState {
  products: Product[];
  isLoading: boolean;
  error: string | null;
  filters: ProductFilters;
}

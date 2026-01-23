export interface Product {
  id: string;
  code: string;  // Código de barras o código interno
  name: string;
  category?: string;
  categoryId?: string;  // FK a tabla categories
  cost: number;
  price: number;
  stock: number;
  minStock: number;
  taxRate: number;  // Tasa de IVA (0, 1, 2, 4, o 13)
  // Campos para Facturación Electrónica
  cabysCode?: string;       // Código CABYS de 13 dígitos
  unitMeasure?: string;     // Unidad de medida (Unid, Kg, Lt, etc.)
  commercialCode?: string;  // Código comercial interno para FE
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductInput {
  code: string;
  name: string;
  category?: string;
  categoryId?: string;  // FK a tabla categories
  cost: number;
  price: number;
  stock: number;
  minStock?: number;
  taxRate?: number;  // Tasa de IVA (default 13)
  // Campos para Facturación Electrónica
  cabysCode?: string;       // Código CABYS de 13 dígitos
  unitMeasure?: string;     // Unidad de medida (default: Unid)
  commercialCode?: string;  // Código comercial interno para FE
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

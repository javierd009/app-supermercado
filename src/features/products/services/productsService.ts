import { createClient } from '@/lib/supabase/client';
import { sqliteClient } from '@/lib/database/sqlite-client';
import { connectionMonitor } from '@/lib/database/connection-monitor';
import { databaseAdapter } from '@/lib/database';
import type {
  Product,
  CreateProductInput,
  UpdateProductInput,
  ProductCSVRow,
  CSVImportResult,
} from '../types';

class ProductsService {
  private supabase = createClient();

  /**
   * Obtener todos los productos
   */
  async getAll(): Promise<Product[]> {
    try {
      // Si estamos offline y en Electron, usar SQLite
      if (!connectionMonitor.isOnline() && sqliteClient.isAvailable()) {
        const data = await sqliteClient.query<any>(
          'SELECT * FROM products ORDER BY name ASC'
        );
        return data.map(this.mapToProduct);
      }

      // Si estamos online, usar Supabase
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        // Fallback a SQLite si está disponible
        if (sqliteClient.isAvailable()) {
          console.warn('Error en Supabase, usando SQLite como fallback');
          const sqliteData = await sqliteClient.query<any>(
            'SELECT * FROM products ORDER BY name ASC'
          );
          return sqliteData.map(this.mapToProduct);
        }
        throw error;
      }

      // Si estamos en Electron, sincronizar con SQLite local
      if (sqliteClient.isAvailable() && data) {
        this.syncProductsToLocal(data);
      }

      return (data || []).map(this.mapToProduct);
    } catch (error) {
      console.error('Get products error:', error);
      return [];
    }
  }

  /**
   * Buscar producto por código
   */
  async getByCode(code: string): Promise<Product | null> {
    try {
      // Si estamos offline y en Electron, usar SQLite
      if (!connectionMonitor.isOnline() && sqliteClient.isAvailable()) {
        const data = await sqliteClient.query<any>(
          'SELECT * FROM products WHERE code = ? LIMIT 1',
          [code]
        );
        return data[0] ? this.mapToProduct(data[0]) : null;
      }

      // Si estamos online, usar Supabase
      const { data, error } = await this.supabase
        .from('products')
        .select('*')
        .eq('code', code)
        .single();

      if (error || !data) {
        // Fallback a SQLite si está disponible
        if (sqliteClient.isAvailable()) {
          const sqliteData = await sqliteClient.query<any>(
            'SELECT * FROM products WHERE code = ? LIMIT 1',
            [code]
          );
          return sqliteData[0] ? this.mapToProduct(sqliteData[0]) : null;
        }
        return null;
      }

      return this.mapToProduct(data);
    } catch (error) {
      console.error('Get product by code error:', error);
      return null;
    }
  }

  /**
   * Crear producto
   */
  async create(input: CreateProductInput): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
      // Verificar si el código ya existe
      const existing = await this.getByCode(input.code);
      if (existing) {
        return {
          success: false,
          error: 'Ya existe un producto con ese código',
        };
      }

      const productId = crypto.randomUUID();
      const now = new Date().toISOString();

      const productData = {
        id: productId,
        code: input.code,
        name: input.name,
        category: input.category || null,
        cost: input.cost,
        price: input.price,
        stock: input.stock,
        min_stock: input.minStock || 10,
        tax_rate: input.taxRate || 13,
        created_at: now,
        updated_at: now,
      };

      // Usar databaseAdapter para manejar online/offline automáticamente
      await databaseAdapter.insert('products', productData);

      console.log('[ProductsService] ✅ Producto creado:', input.name);

      return {
        success: true,
        product: this.mapToProduct(productData),
      };
    } catch (error: any) {
      console.error('Create product error:', error);
      return {
        success: false,
        error: error.message || 'Error al crear producto',
      };
    }
  }

  /**
   * Actualizar producto
   */
  async update(input: UpdateProductInput): Promise<{ success: boolean; product?: Product; error?: string }> {
    try {
      const updates: any = { updated_at: new Date().toISOString() };

      if (input.code !== undefined) updates.code = input.code;
      if (input.name !== undefined) updates.name = input.name;
      if (input.category !== undefined) updates.category = input.category;
      if (input.cost !== undefined) updates.cost = input.cost;
      if (input.price !== undefined) updates.price = input.price;
      if (input.stock !== undefined) updates.stock = input.stock;
      if (input.minStock !== undefined) updates.min_stock = input.minStock;
      if (input.taxRate !== undefined) updates.tax_rate = input.taxRate;

      // Usar databaseAdapter para manejar online/offline automáticamente
      await databaseAdapter.update('products', input.id, updates);

      console.log('[ProductsService] ✅ Producto actualizado:', input.id);

      // Obtener el producto actualizado
      const updatedProduct = await databaseAdapter.query<any>(
        'SELECT * FROM products WHERE id = ? LIMIT 1',
        [input.id]
      );

      if (!updatedProduct || updatedProduct.length === 0) {
        throw new Error('Producto no encontrado después de actualizar');
      }

      return {
        success: true,
        product: this.mapToProduct(updatedProduct[0]),
      };
    } catch (error: any) {
      console.error('Update product error:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar producto',
      };
    }
  }

  /**
   * Eliminar producto
   */
  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Usar databaseAdapter para manejar online/offline automáticamente
      await databaseAdapter.delete('products', id);

      console.log('[ProductsService] ✅ Producto eliminado:', id);

      return { success: true };
    } catch (error: any) {
      console.error('Delete product error:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar producto',
      };
    }
  }

  /**
   * Importar productos desde CSV
   */
  async importFromCSV(rows: ProductCSVRow[]): Promise<CSVImportResult> {
    const result: CSVImportResult = {
      success: true,
      imported: 0,
      failed: 0,
      errors: [],
    };

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      try {
        // Validar datos mínimos
        if (!row.code || !row.name) {
          result.errors.push({
            row: i + 1,
            error: 'Código y nombre son obligatorios',
            data: row,
          });
          result.failed++;
          continue;
        }

        // Parsear números
        const stock = typeof row.quantity === 'string'
          ? parseFloat(row.quantity) || 0
          : row.quantity || 0;

        const cost = typeof row.cost === 'string'
          ? parseFloat(row.cost) || 0
          : row.cost || 0;

        const price = typeof row.price === 'string'
          ? parseFloat(row.price) || 0
          : row.price || 0;

        // Intentar crear producto
        const createResult = await this.create({
          code: row.code,
          name: row.name,
          category: row.category,
          cost,
          price,
          stock,
          minStock: 10,
        });

        if (createResult.success) {
          result.imported++;
        } else {
          result.errors.push({
            row: i + 1,
            error: createResult.error || 'Error desconocido',
            data: row,
          });
          result.failed++;
        }
      } catch (error: any) {
        result.errors.push({
          row: i + 1,
          error: error.message || 'Error inesperado',
          data: row,
        });
        result.failed++;
      }
    }

    result.success = result.failed === 0;

    return result;
  }

  /**
   * Ajustar stock de un producto
   */
  async adjustStock(id: string, quantity: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Si estamos offline y en Electron, usar SQLite
      if (!connectionMonitor.isOnline() && sqliteClient.isAvailable()) {
        // Obtener stock actual
        const product = await sqliteClient.query<{ stock: number }>(
          'SELECT stock FROM products WHERE id = ? LIMIT 1',
          [id]
        );

        if (!product || product.length === 0) {
          return { success: false, error: 'Producto no encontrado' };
        }

        const newStock = product[0].stock + quantity;

        if (newStock < 0) {
          return { success: false, error: 'Stock no puede ser negativo' };
        }

        // Actualizar stock en SQLite
        await sqliteClient.run(
          'UPDATE products SET stock = ?, updated_at = ? WHERE id = ?',
          [newStock, new Date().toISOString(), id]
        );

        // Agregar a cola de sincronización
        await databaseAdapter.update('products', id, { stock: newStock });

        return { success: true };
      }

      // Si estamos online, usar Supabase
      const { data: current, error: fetchError } = await this.supabase
        .from('products')
        .select('stock')
        .eq('id', id)
        .single();

      if (fetchError || !current) {
        return { success: false, error: 'Producto no encontrado' };
      }

      const newStock = current.stock + quantity;

      if (newStock < 0) {
        return { success: false, error: 'Stock no puede ser negativo' };
      }

      const { error } = await this.supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', id);

      if (error) throw error;

      // Si estamos en Electron, también actualizar SQLite local
      if (sqliteClient.isAvailable()) {
        await sqliteClient.run(
          'UPDATE products SET stock = ?, updated_at = ? WHERE id = ?',
          [newStock, new Date().toISOString(), id]
        );
      }

      return { success: true };
    } catch (error: any) {
      console.error('Adjust stock error:', error);
      return {
        success: false,
        error: error.message || 'Error al ajustar stock',
      };
    }
  }

  /**
   * Mapear datos de Supabase a Product
   */
  private mapToProduct(data: any): Product {
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      category: data.category,
      cost: parseFloat(data.cost) || 0,
      price: parseFloat(data.price) || 0,
      stock: data.stock,
      minStock: data.min_stock || data.minStock,
      taxRate: parseFloat(data.tax_rate || data.taxRate) || 13,
      createdAt: data.created_at || data.createdAt,
      updatedAt: data.updated_at || data.updatedAt,
    };
  }

  /**
   * Sincronizar productos de Supabase a SQLite local
   * (Solo cuando estamos en Electron)
   */
  private async syncProductsToLocal(products: any[]): Promise<void> {
    if (!sqliteClient.isAvailable()) return;

    try {
      // Obtener productos existentes en SQLite
      const existingProducts = await sqliteClient.query<{ id: string }>(
        'SELECT id FROM products'
      );
      const existingIds = new Set(existingProducts.map((p) => p.id));

      // Actualizar o insertar cada producto
      for (const product of products) {
        const productData = {
          id: product.id,
          code: product.code,
          name: product.name,
          category: product.category || null,
          cost: product.cost,
          price: product.price,
          stock: product.stock,
          min_stock: product.min_stock,
          tax_rate: product.tax_rate,
          created_at: product.created_at,
          updated_at: product.updated_at,
        };

        if (existingIds.has(product.id)) {
          // Actualizar
          await sqliteClient.run(
            `UPDATE products SET
              code = ?, name = ?, category = ?, cost = ?,
              price = ?, stock = ?, min_stock = ?, tax_rate = ?,
              updated_at = ?
            WHERE id = ?`,
            [
              productData.code,
              productData.name,
              productData.category,
              productData.cost,
              productData.price,
              productData.stock,
              productData.min_stock,
              productData.tax_rate,
              productData.updated_at,
              productData.id,
            ]
          );
        } else {
          // Insertar
          await sqliteClient.run(
            `INSERT INTO products (
              id, code, name, category, cost, price, stock, min_stock, tax_rate, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              productData.id,
              productData.code,
              productData.name,
              productData.category,
              productData.cost,
              productData.price,
              productData.stock,
              productData.min_stock,
              productData.tax_rate,
              productData.created_at,
              productData.updated_at,
            ]
          );
        }
      }

      console.log(`✅ Sincronizados ${products.length} productos a SQLite local`);
    } catch (error) {
      console.error('Error sincronizando productos a SQLite:', error);
    }
  }
}

export const productsService = new ProductsService();

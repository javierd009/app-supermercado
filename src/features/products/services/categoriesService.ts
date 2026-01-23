import { createClient } from '@/lib/supabase/client';

export interface Category {
  id: string;
  name: string;
  cabysCode: string | null;
  taxRate: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CategoryRow {
  id: string;
  name: string;
  cabys_code: string | null;
  tax_rate: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

class CategoriesService {
  private getClient() {
    return createClient();
  }

  /**
   * Obtener todas las categorías
   */
  async getCategories(): Promise<Category[]> {
    try {
      const { data, error } = await this.getClient()
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.error('[CategoriesService] Error obteniendo categorías:', error);
        throw error;
      }

      return (data || []).map(this.mapToCategory);
    } catch (error) {
      console.error('[CategoriesService] Error:', error);
      return [];
    }
  }

  /**
   * Obtener una categoría por ID
   */
  async getCategoryById(id: string): Promise<Category | null> {
    try {
      const { data, error } = await this.getClient()
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[CategoriesService] Error obteniendo categoría:', error);
        return null;
      }

      return data ? this.mapToCategory(data) : null;
    } catch (error) {
      console.error('[CategoriesService] Error:', error);
      return null;
    }
  }

  /**
   * Crear una nueva categoría
   */
  async createCategory(input: {
    name: string;
    cabysCode?: string;
    taxRate?: number;
    description?: string;
  }): Promise<{ success: boolean; category?: Category; error?: string }> {
    try {
      const { data, error } = await this.getClient()
        .from('categories')
        .insert({
          name: input.name,
          cabys_code: input.cabysCode || null,
          tax_rate: input.taxRate || 13,
          description: input.description || null,
        })
        .select()
        .single();

      if (error) {
        console.error('[CategoriesService] Error creando categoría:', error);
        return { success: false, error: error.message };
      }

      return { success: true, category: this.mapToCategory(data) };
    } catch (error: any) {
      console.error('[CategoriesService] Error:', error);
      return { success: false, error: error.message || 'Error al crear categoría' };
    }
  }

  /**
   * Actualizar una categoría
   */
  async updateCategory(
    id: string,
    input: {
      name?: string;
      cabysCode?: string | null;
      taxRate?: number;
      description?: string | null;
    }
  ): Promise<{ success: boolean; category?: Category; error?: string }> {
    try {
      const updateData: Partial<CategoryRow> = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.cabysCode !== undefined) updateData.cabys_code = input.cabysCode;
      if (input.taxRate !== undefined) updateData.tax_rate = input.taxRate;
      if (input.description !== undefined) updateData.description = input.description;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await this.getClient()
        .from('categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[CategoriesService] Error actualizando categoría:', error);
        return { success: false, error: error.message };
      }

      return { success: true, category: this.mapToCategory(data) };
    } catch (error: any) {
      console.error('[CategoriesService] Error:', error);
      return { success: false, error: error.message || 'Error al actualizar categoría' };
    }
  }

  /**
   * Eliminar una categoría
   */
  async deleteCategory(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.getClient()
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[CategoriesService] Error eliminando categoría:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('[CategoriesService] Error:', error);
      return { success: false, error: error.message || 'Error al eliminar categoría' };
    }
  }

  /**
   * Mapear datos de BD a Category
   */
  private mapToCategory(row: CategoryRow): Category {
    return {
      id: row.id,
      name: row.name,
      cabysCode: row.cabys_code,
      taxRate: row.tax_rate || 13,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const categoriesService = new CategoriesService();

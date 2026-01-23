import { useState, useEffect } from 'react';
import { categoriesService, type Category } from '../services/categoriesService';

/**
 * Hook para cargar y gestionar categorías
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await categoriesService.getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar categorías');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return { categories, isLoading, error, loadCategories };
}

/**
 * Hook para crear categoría
 */
export function useCreateCategory() {
  const [isCreating, setIsCreating] = useState(false);

  const createCategory = async (input: {
    name: string;
    cabysCode?: string;
    taxRate?: number;
    description?: string;
  }) => {
    setIsCreating(true);
    try {
      return await categoriesService.createCategory(input);
    } finally {
      setIsCreating(false);
    }
  };

  return { createCategory, isCreating };
}

/**
 * Hook para actualizar categoría
 */
export function useUpdateCategory() {
  const [isUpdating, setIsUpdating] = useState(false);

  const updateCategory = async (
    id: string,
    input: {
      name?: string;
      cabysCode?: string | null;
      taxRate?: number;
      description?: string | null;
    }
  ) => {
    setIsUpdating(true);
    try {
      return await categoriesService.updateCategory(id, input);
    } finally {
      setIsUpdating(false);
    }
  };

  return { updateCategory, isUpdating };
}

/**
 * Hook para eliminar categoría
 */
export function useDeleteCategory() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteCategory = async (id: string) => {
    setIsDeleting(true);
    try {
      return await categoriesService.deleteCategory(id);
    } finally {
      setIsDeleting(false);
    }
  };

  return { deleteCategory, isDeleting };
}

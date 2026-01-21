import { useState, useEffect } from 'react';
import { usersService } from '../services/usersService';
import type { User } from '@/features/auth/types';

/**
 * Hook para listar usuarios
 */
export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await usersService.listUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return {
    users,
    isLoading,
    error,
    reloadUsers: loadUsers,
  };
}

/**
 * Hook para eliminar usuario
 */
export function useDeleteUser() {
  const [isDeleting, setIsDeleting] = useState(false);

  const deleteUser = async (userId: string) => {
    setIsDeleting(true);

    try {
      const result = await usersService.deleteUser(userId);
      return result;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteUser,
    isDeleting,
  };
}

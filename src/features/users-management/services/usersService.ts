import { databaseAdapter } from '@/lib/database';
import { createClient } from '@/lib/supabase/client';
import type { User, UserRole } from '@/features/auth/types';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

interface UserRow {
  id: string;
  username: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

class UsersService {
  private supabase = createClient();

  /**
   * Listar todos los usuarios
   * Usa Supabase directamente (frontend web siempre online)
   */
  async listUsers(): Promise<User[]> {
    try {
      console.log('[UsersService] Listando usuarios...');

      const { data, error } = await this.supabase
        .from('users')
        .select('id, username, role, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('List users error:', error);
        return [];
      }

      console.log(`[UsersService] ✅ ${data?.length || 0} usuarios encontrados`);

      return (data || []).map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      }));
    } catch (error) {
      console.error('List users error:', error);
      return [];
    }
  }

  /**
   * Obtener usuario por ID
   */
  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('id, username, role, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error || !data) {
        console.error('Get user error:', error);
        return null;
      }

      return {
        id: data.id,
        username: data.username,
        role: data.role,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  }

  /**
   * Actualizar rol de usuario
   */
  async updateUserRole(
    userId: string,
    newRole: UserRole
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const now = new Date().toISOString();

      await databaseAdapter.update('users', userId, {
        role: newRole,
        updated_at: now,
      });

      console.log(`[UsersService] ✅ Rol actualizado para usuario ${userId}: ${newRole}`);

      return { success: true };
    } catch (error: any) {
      console.error('Update user role error:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar rol',
      };
    }
  }

  /**
   * Actualizar username
   */
  async updateUsername(
    userId: string,
    newUsername: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar si el username ya existe
      const existing = await databaseAdapter.query<{ id: string }>(
        'SELECT id FROM users WHERE username = ? AND id != ? LIMIT 1',
        [newUsername, userId]
      );

      if (existing && existing.length > 0) {
        return { success: false, error: 'El username ya existe' };
      }

      const now = new Date().toISOString();

      await databaseAdapter.update('users', userId, {
        username: newUsername,
        updated_at: now,
      });

      console.log(`[UsersService] ✅ Username actualizado para usuario ${userId}: ${newUsername}`);

      return { success: true };
    } catch (error: any) {
      console.error('Update username error:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar username',
      };
    }
  }

  /**
   * Eliminar usuario
   */
  async deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar que no tenga ventas asociadas
      const sales = await databaseAdapter.query<{ id: string }>(
        'SELECT id FROM sales WHERE user_id = ? LIMIT 1',
        [userId]
      );

      if (sales && sales.length > 0) {
        return {
          success: false,
          error: 'No se puede eliminar: el usuario tiene ventas registradas',
        };
      }

      // Verificar que no sea super_admin
      const user = await this.getUserById(userId);
      if (user?.role === 'super_admin') {
        return {
          success: false,
          error: 'No se puede eliminar un super administrador',
        };
      }

      // Eliminar usuario (CASCADE eliminará cash_registers en Supabase)
      await databaseAdapter.delete('users', userId);

      console.log(`[UsersService] ✅ Usuario eliminado: ${userId}`);

      return { success: true };
    } catch (error: any) {
      console.error('Delete user error:', error);
      return {
        success: false,
        error: error.message || 'Error al eliminar usuario',
      };
    }
  }

  /**
   * Crear nuevo usuario
   */
  async createUser(
    username: string,
    password: string,
    role: UserRole
  ): Promise<{ success: boolean; error?: string; userId?: string }> {
    try {
      // Validar que el username no exista
      const existing = await databaseAdapter.query<{ id: string }>(
        'SELECT id FROM users WHERE username = ? LIMIT 1',
        [username]
      );

      if (existing && existing.length > 0) {
        return { success: false, error: 'El username ya existe' };
      }

      // Validar longitud de contraseña
      if (password.length < 4) {
        return { success: false, error: 'La contraseña debe tener al menos 4 caracteres' };
      }

      // Hash de contraseña con bcrypt
      const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

      const userId = crypto.randomUUID();
      const now = new Date().toISOString();

      const userData = {
        id: userId,
        username,
        password_hash: passwordHash,
        role,
        created_at: now,
        updated_at: now,
      };

      // Crear usuario usando databaseAdapter (maneja online/offline)
      await databaseAdapter.insert('users', userData);

      console.log(`[UsersService] ✅ Usuario creado: ${username} (${role})`);

      return { success: true, userId };
    } catch (error: any) {
      console.error('Create user error:', error);
      return {
        success: false,
        error: error.message || 'Error al crear usuario',
      };
    }
  }

  /**
   * Resetear contraseña de usuario
   */
  async resetPassword(
    userId: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validar longitud de contraseña
      if (newPassword.length < 4) {
        return { success: false, error: 'La contraseña debe tener al menos 4 caracteres' };
      }

      // Hash de nueva contraseña
      const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
      const now = new Date().toISOString();

      // Actualizar contraseña
      await databaseAdapter.update('users', userId, {
        password_hash: passwordHash,
        updated_at: now,
      });

      console.log(`[UsersService] ✅ Contraseña reseteada para usuario: ${userId}`);

      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.message || 'Error al resetear contraseña',
      };
    }
  }
}

export const usersService = new UsersService();

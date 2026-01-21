'use server';

import bcrypt from 'bcryptjs';
import { createClient } from '@/lib/supabase/server';
import type { UserRole } from '@/features/auth/types';

const SALT_ROUNDS = 10;

/**
 * Crear nuevo usuario
 * IMPORTANTE: Solo se puede ejecutar en el servidor
 */
export async function createUserAction(
  username: string,
  password: string,
  role: UserRole
): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    const supabase = await createClient();

    // Validar que el username no exista
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existing) {
      return { success: false, error: 'El username ya existe' };
    }

    // Validar longitud de contraseña
    if (password.length < 4) {
      return { success: false, error: 'La contraseña debe tener al menos 4 caracteres' };
    }

    // Hash de contraseña con bcrypt
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Crear usuario
    const { data, error } = await supabase
      .from('users')
      .insert({
        username,
        password_hash: passwordHash,
        role,
      })
      .select()
      .single();

    if (error) {
      console.error('Create user error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, userId: data.id };
  } catch (error: any) {
    console.error('Create user action error:', error);
    return {
      success: false,
      error: error.message || 'Error al crear usuario',
    };
  }
}

/**
 * Resetear contraseña de usuario
 * IMPORTANTE: Solo se puede ejecutar en el servidor
 */
export async function resetPasswordAction(
  userId: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Validar longitud de contraseña
    if (newPassword.length < 4) {
      return { success: false, error: 'La contraseña debe tener al menos 4 caracteres' };
    }

    // Hash de nueva contraseña
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Actualizar contraseña
    const { error } = await supabase
      .from('users')
      .update({
        password_hash: passwordHash,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Reset password action error:', error);
    return {
      success: false,
      error: error.message || 'Error al resetear contraseña',
    };
  }
}

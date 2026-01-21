'use server';

/**
 * Server Actions para Autenticación
 *
 * Estas funciones se ejecutan en el servidor y pueden usar bcrypt
 */

import { authService } from '../services/authService';

export async function loginAction(password: string) {
  'use server';

  try {
    const result = await authService.login({ password });
    return result;
  } catch (error) {
    console.error('Error en loginAction:', error);
    return {
      success: false,
      error: 'Error del servidor'
    };
  }
}

export async function createUserAction(
  username: string,
  password: string,
  role: 'admin' | 'cashier'
) {
  'use server';

  try {
    const result = await authService.createUser(username, password, role);
    return result;
  } catch (error) {
    console.error('Error en createUserAction:', error);
    return {
      success: false,
      error: 'Error del servidor'
    };
  }
}

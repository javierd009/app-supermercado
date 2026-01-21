import { databaseAdapter } from '@/lib/database/adapter';
import { createClient } from '@/lib/supabase/client';
import type { LoginCredentials, LoginResponse, AuthSession, User, UserRole } from '../types';
import bcrypt from 'bcryptjs';

// Duración de sesión: 8 horas (turno típico)
const SESSION_DURATION = 8 * 60 * 60 * 1000;

interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  role: string;
  created_at: string;
  updated_at: string;
}

class AuthService {
  private supabase = createClient();

  /**
   * Login solo con contraseña
   * El sistema busca el usuario cuya contraseña coincida
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const { password } = credentials;
      console.log('[AuthService] Iniciando login...');
      console.log('[AuthService] Contexto:', {
        hasWindow: typeof window !== 'undefined',
        hasElectronAPI: typeof window !== 'undefined' && !!window.electronAPI,
        isElectron: typeof window !== 'undefined' && !!window.electronAPI?.isElectron
      });

      // 1. Obtener todos los usuarios
      // Intentar SQLite primero si está disponible
      let users: UserRow[] = [];

      try {
        console.log('[AuthService] Intentando SQLite query...');
        users = await databaseAdapter.query<UserRow>('SELECT * FROM users');
        console.log('[AuthService] ✅ SQLite query exitosa. Usuarios encontrados:', users.length);
        console.log('[AuthService] Usuarios:', users.map(u => ({ username: u.username, role: u.role })));
      } catch (sqliteError) {
        console.error('[AuthService] ❌ Error en SQLite:', sqliteError);
        console.log('[AuthService] SQLite no disponible, usando Supabase');

        const { data, error } = await this.supabase
          .from('users')
          .select('*');

        if (error || !data) {
          console.error('[AuthService] Error Supabase:', error);
          return {
            success: false,
            error: 'Error al buscar usuarios',
          };
        }
        users = data as UserRow[];
        console.log('[AuthService] ✅ Supabase query exitosa. Usuarios encontrados:', users.length);
      }

      if (!users || users.length === 0) {
        console.error('[AuthService] ❌ No hay usuarios en la base de datos');
        return {
          success: false,
          error: 'No hay usuarios registrados',
        };
      }

      console.log('[AuthService] Verificando contraseña para', users.length, 'usuarios...');

      // 2. Buscar usuario cuya contraseña coincida
      let matchedUser: UserRow | null = null;
      for (const user of users) {
        const isPasswordValid = await this.verifyPassword(password, user.password_hash);
        if (isPasswordValid) {
          matchedUser = user;
          break;
        }
      }

      if (!matchedUser) {
        return {
          success: false,
          error: 'Contraseña incorrecta',
        };
      }

      // 3. Crear sesión
      const session: AuthSession = {
        user: {
          id: matchedUser.id,
          username: matchedUser.username,
          role: matchedUser.role as UserRole,
          createdAt: matchedUser.created_at,
          updatedAt: matchedUser.updated_at,
        },
        token: this.generateToken(matchedUser.id),
        expiresAt: Date.now() + SESSION_DURATION,
      };

      return {
        success: true,
        session,
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'Error al iniciar sesión',
      };
    }
  }

  /**
   * Logout (limpiar sesión)
   */
  async logout(): Promise<void> {
    // En futuro, registrar logout en tabla de auditoría
    console.log('User logged out');
  }

  /**
   * Verificar contraseña con bcrypt
   */
  private async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    try {
      // Si el hash empieza con $2b$ o $2a$ (bcrypt), usar bcrypt.compare
      if (hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2a$')) {
        return await bcrypt.compare(plainPassword, hashedPassword);
      }

      // Fallback para passwords legacy (texto plano) - solo durante migración
      // Este bloque se puede eliminar una vez que todos los passwords estén hasheados
      console.warn('⚠️ Password sin hashear detectado. Ejecutar script de migración.');
      return plainPassword === hashedPassword;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  }

  /**
   * Generar token simple
   * TODO: En producción, usar JWT
   */
  private generateToken(userId: string): string {
    return `${userId}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  /**
   * Obtener usuario actual
   */
  async getCurrentUser(userId: string): Promise<User | null> {
    try {
      // Intentar SQLite primero
      try {
        const users = await databaseAdapter.query<UserRow>(
          'SELECT * FROM users WHERE id = ? LIMIT 1',
          [userId]
        );

        if (users && users.length > 0) {
          const user = users[0];
          return {
            id: user.id,
            username: user.username,
            role: user.role as UserRole,
            createdAt: user.created_at,
            updatedAt: user.updated_at,
          };
        }
      } catch (sqliteError) {
        console.log('[AuthService] SQLite no disponible, usando Supabase');
      }

      // Fallback a Supabase
      const { data: user, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return null;
      }

      return {
        id: user.id,
        username: user.username,
        role: user.role as UserRole,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }

  /**
   * Crear nuevo usuario (solo super_admin)
   */
  async createUser(username: string, password: string, role: 'admin' | 'cashier'): Promise<{ success: boolean; error?: string }> {
    try {
      // Hash password con bcrypt (10 rounds de salt)
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const { error } = await this.supabase
        .from('users')
        .insert({
          username: username.toUpperCase(),
          password_hash: passwordHash,
          role,
        });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Create user error:', error);
      return {
        success: false,
        error: 'Error al crear usuario',
      };
    }
  }

  /**
   * Listar todos los usuarios (solo admin/super_admin)
   */
  async listUsers(): Promise<User[]> {
    try {
      const { data: users, error } = await this.supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !users) {
        return [];
      }

      return users.map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role as UserRole,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      }));
    } catch (error) {
      console.error('List users error:', error);
      return [];
    }
  }
}

export const authService = new AuthService();

/**
 * Config Service
 * Gestiona configuración del sistema (tipo de cambio, control de inventario, etc.)
 * Usa DatabaseAdapter para funcionar offline con SQLite y online con Supabase
 */

import { databaseAdapter } from '@/lib/database';
import { createClient } from '@/lib/supabase/client';
import { sqliteClient } from '@/lib/database/sqlite-client';
import { connectionMonitor } from '@/lib/database/connection-monitor';

export interface ConfigItem {
  key: string;
  value: string;
  description?: string;
  updated_at?: string;
}

class ConfigService {
  /**
   * Obtener valor de configuración
   */
  async getConfigValue(key: string): Promise<string | null> {
    try {
      // Si estamos offline y en Electron, usar SQLite
      if (!connectionMonitor.isOnline() && sqliteClient.isAvailable()) {
        const result = await sqliteClient.query<ConfigItem>(
          'SELECT * FROM config WHERE key = ? LIMIT 1',
          [key]
        );

        return result[0]?.value || null;
      }

      // Si estamos online, usar Supabase
      const supabase = createClient();
      const { data, error } = await supabase
        .from('config')
        .select('value')
        .eq('key', key)
        .single();

      if (error) {
        console.warn(`Config key '${key}' not found in Supabase, trying SQLite...`);

        // Fallback a SQLite si está disponible
        if (sqliteClient.isAvailable()) {
          const result = await sqliteClient.query<ConfigItem>(
            'SELECT * FROM config WHERE key = ? LIMIT 1',
            [key]
          );

          return result[0]?.value || null;
        }

        return null;
      }

      return data.value;
    } catch (error) {
      console.error(`Error getting config value for '${key}':`, error);
      return null;
    }
  }

  /**
   * Obtener tipo de cambio actual
   */
  async getExchangeRate(): Promise<number> {
    const value = await this.getConfigValue('exchange_rate');
    return value ? parseFloat(value) : 540; // Default: 540 CRC por dólar
  }

  /**
   * Verificar si el control de inventario está habilitado
   */
  async isInventoryControlEnabled(): Promise<boolean> {
    const value = await this.getConfigValue('inventory_control_enabled');
    return value !== 'false'; // Por defecto: habilitado
  }

  /**
   * Actualizar valor de configuración
   */
  async setConfigValue(
    key: string,
    value: string,
    description?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Si estamos offline y en Electron, usar SQLite
      if (!connectionMonitor.isOnline() && sqliteClient.isAvailable()) {
        // Verificar si existe
        const existing = await sqliteClient.query<ConfigItem>(
          'SELECT * FROM config WHERE key = ? LIMIT 1',
          [key]
        );

        if (existing.length > 0) {
          // Actualizar
          await sqliteClient.run(
            'UPDATE config SET value = ?, description = ?, updated_at = ? WHERE key = ?',
            [value, description || existing[0].description || '', new Date().toISOString(), key]
          );
        } else {
          // Insertar
          await sqliteClient.run(
            'INSERT INTO config (key, value, description, updated_at) VALUES (?, ?, ?, ?)',
            [key, value, description || '', new Date().toISOString()]
          );
        }

        // Agregar a cola de sincronización
        await databaseAdapter.update('config', key, { value, description });

        return { success: true };
      }

      // Si estamos online, usar Supabase
      const supabase = createClient();
      const { error } = await supabase
        .from('config')
        .upsert(
          {
            key,
            value,
            description,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );

      if (error) throw error;

      // Si estamos en Electron, también actualizar SQLite local
      if (sqliteClient.isAvailable()) {
        const existing = await sqliteClient.query<ConfigItem>(
          'SELECT * FROM config WHERE key = ? LIMIT 1',
          [key]
        );

        if (existing.length > 0) {
          await sqliteClient.run(
            'UPDATE config SET value = ?, description = ?, updated_at = ? WHERE key = ?',
            [value, description || existing[0].description || '', new Date().toISOString(), key]
          );
        } else {
          await sqliteClient.run(
            'INSERT INTO config (key, value, description, updated_at) VALUES (?, ?, ?, ?)',
            [key, value, description || '', new Date().toISOString()]
          );
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error(`Error setting config value for '${key}':`, error);
      return {
        success: false,
        error: error.message || 'Error al actualizar configuración',
      };
    }
  }

  /**
   * Actualizar tipo de cambio
   */
  async setExchangeRate(rate: number): Promise<{ success: boolean; error?: string }> {
    return this.setConfigValue(
      'exchange_rate',
      rate.toString(),
      'Tipo de cambio del dólar (₡ por $1)'
    );
  }

  /**
   * Habilitar/deshabilitar control de inventario
   */
  async setInventoryControl(enabled: boolean): Promise<{ success: boolean; error?: string }> {
    return this.setConfigValue(
      'inventory_control_enabled',
      enabled ? 'true' : 'false',
      'Control de inventario habilitado/deshabilitado'
    );
  }

  /**
   * Obtener toda la configuración
   */
  async getAllConfig(): Promise<ConfigItem[]> {
    try {
      // Si estamos offline y en Electron, usar SQLite
      if (!connectionMonitor.isOnline() && sqliteClient.isAvailable()) {
        return sqliteClient.query<ConfigItem>('SELECT * FROM config ORDER BY key');
      }

      // Si estamos online, usar Supabase
      const supabase = createClient();
      const { data, error } = await supabase.from('config').select('*').order('key');

      if (error) {
        console.warn('Error getting all config from Supabase, trying SQLite...');

        // Fallback a SQLite si está disponible
        if (sqliteClient.isAvailable()) {
          return sqliteClient.query<ConfigItem>('SELECT * FROM config ORDER BY key');
        }

        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting all config:', error);
      return [];
    }
  }
}

export const configService = new ConfigService();

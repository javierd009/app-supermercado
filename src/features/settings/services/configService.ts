import { databaseAdapter } from '@/lib/database';
import type { BusinessConfig } from '../types';

interface ConfigRow {
  key: string;
  value: string;
}

class ConfigService {
  /**
   * Obtener configuración del negocio
   */
  async getBusinessConfig(): Promise<BusinessConfig> {
    try {
      console.log('[ConfigService] Obteniendo configuración del negocio...');

      const configRows = await databaseAdapter.query<ConfigRow>(
        `SELECT key, value FROM config
         WHERE key IN ('business_name', 'business_phone', 'business_address', 'receipt_footer')`
      );

      // Convertir array de {key, value} a objeto
      const config: any = {
        business_name: 'Sabrosita POS',
        business_phone: '',
        business_address: '',
        receipt_footer: '¡Gracias por su compra!',
      };

      configRows?.forEach((row) => {
        config[row.key] = row.value || '';
      });

      console.log('[ConfigService] ✅ Configuración obtenida');

      return config as BusinessConfig;
    } catch (error) {
      console.error('Get business config error:', error);

      // Retornar valores por defecto en caso de error
      return {
        business_name: 'Sabrosita POS',
        business_phone: '',
        business_address: '',
        receipt_footer: '¡Gracias por su compra!',
      };
    }
  }

  /**
   * Actualizar configuración del negocio
   */
  async updateBusinessConfig(
    updates: Partial<BusinessConfig>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const entries = Object.entries(updates);

      for (const [key, value] of entries) {
        // Usar UPSERT simulado: primero intentar UPDATE, si no existe hacer INSERT
        const existing = await databaseAdapter.query<ConfigRow>(
          'SELECT key FROM config WHERE key = ? LIMIT 1',
          [key]
        );

        if (existing && existing.length > 0) {
          // UPDATE
          await databaseAdapter.query(
            'UPDATE config SET value = ? WHERE key = ?',
            [value || '', key]
          );
        } else {
          // INSERT
          await databaseAdapter.insert('config', {
            key,
            value: value || '',
          });
        }

        console.log(`[ConfigService] ✅ Config actualizada: ${key} = ${value}`);
      }

      // Sincronizar con printService si está disponible
      if (typeof window !== 'undefined') {
        try {
          const { printService } = await import('@/features/printing/services/printService');
          await printService.loadConfigFromDB();
        } catch (error) {
          console.warn('Could not sync with printService:', error);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Update business config error:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar configuración',
      };
    }
  }

  /**
   * Obtener valor individual de configuración
   */
  async getConfigValue(key: string): Promise<string | null> {
    try {
      const result = await databaseAdapter.query<ConfigRow>(
        'SELECT value FROM config WHERE key = ? LIMIT 1',
        [key]
      );

      if (!result || result.length === 0) return null;

      return result[0].value;
    } catch (error) {
      console.error(`Get config ${key} error:`, error);
      return null;
    }
  }

  /**
   * Establecer valor individual de configuración
   */
  async setConfigValue(key: string, value: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Usar UPSERT simulado: primero intentar UPDATE, si no existe hacer INSERT
      const existing = await databaseAdapter.query<ConfigRow>(
        'SELECT key FROM config WHERE key = ? LIMIT 1',
        [key]
      );

      if (existing && existing.length > 0) {
        // UPDATE
        await databaseAdapter.query(
          'UPDATE config SET value = ? WHERE key = ?',
          [value, key]
        );
      } else {
        // INSERT
        await databaseAdapter.insert('config', { key, value });
      }

      console.log(`[ConfigService] ✅ Config establecida: ${key} = ${value}`);

      return { success: true };
    } catch (error: any) {
      console.error(`Set config ${key} error:`, error);
      return {
        success: false,
        error: error.message || 'Error al guardar configuración',
      };
    }
  }
}

export const configService = new ConfigService();

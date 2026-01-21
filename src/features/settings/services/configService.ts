import { databaseAdapter } from '@/lib/database';
import { createClient } from '@/lib/supabase/client';
import type { BusinessConfig } from '../types';

interface ConfigRow {
  key: string;
  value: string;
}

class ConfigService {
  private supabase = createClient();

  /**
   * Obtener configuración del negocio
   */
  async getBusinessConfig(): Promise<BusinessConfig> {
    try {
      console.log('[ConfigService] Obteniendo configuración del negocio...');

      // Usar Supabase directamente para el frontend web
      const { data, error } = await this.supabase
        .from('config')
        .select('key, value')
        .in('key', ['business_name', 'business_phone', 'business_address', 'receipt_footer']);

      if (error) {
        console.error('[ConfigService] Error obteniendo configuración:', error);
        throw error;
      }

      // Convertir array de {key, value} a objeto
      const config: any = {
        business_name: 'Sabrosita POS',
        business_phone: '',
        business_address: '',
        receipt_footer: '¡Gracias por su compra!',
      };

      data?.forEach((row) => {
        config[row.key] = row.value || '';
      });

      console.log('[ConfigService] ✅ Configuración obtenida:', config);

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
        // Usar upsert de Supabase
        const { error } = await this.supabase
          .from('config')
          .upsert(
            { key, value: value || '' },
            { onConflict: 'key' }
          );

        if (error) {
          console.error(`[ConfigService] Error actualizando ${key}:`, error);
          throw error;
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
      const { data, error } = await this.supabase
        .from('config')
        .select('value')
        .eq('key', key)
        .single();

      if (error || !data) {
        console.error(`[ConfigService] Get config ${key} error:`, error);
        return null;
      }

      return data.value;
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
      // Usar upsert de Supabase
      const { error } = await this.supabase
        .from('config')
        .upsert(
          { key, value },
          { onConflict: 'key' }
        );

      if (error) {
        console.error(`[ConfigService] Set config ${key} error:`, error);
        throw error;
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

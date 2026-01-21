import type { SaleWithItems } from '@/features/sales/types';
import type { TicketData, PrintResult } from '../types';
import { ticketFormatter } from './ticketFormatter';

/**
 * Servicio de impresión que se comunica con Electron
 */
class PrintService {
  private businessConfig = {
    name: 'Sabrosita',
    address: 'San José, Costa Rica',
    phone: '2222-2222',
  };

  /**
   * Verificar si estamos en entorno Electron
   */
  private isElectronAvailable(): boolean {
    return typeof window !== 'undefined' &&
           'electronAPI' in window &&
           window.electronAPI?.printer?.print !== undefined;
  }

  /**
   * Imprimir ticket de venta
   */
  async printSaleTicket(
    sale: SaleWithItems,
    cashierName: string,
    registerNumber?: string
  ): Promise<PrintResult> {
    try {
      // Preparar datos del ticket
      const ticketData: TicketData = {
        sale,
        businessName: this.businessConfig.name,
        businessAddress: this.businessConfig.address,
        businessPhone: this.businessConfig.phone,
        cashierName,
        registerNumber,
      };

      // Formatear ticket en ESC/POS
      const ticketContent = ticketFormatter.format(ticketData);

      // Verificar si Electron está disponible
      if (!this.isElectronAvailable()) {
        console.warn('[Print] Electron not available, printing to console');
        console.log('========== TICKET ==========');
        console.log(ticketContent);
        console.log('============================');

        return {
          success: true,
          error: 'Modo web: ticket mostrado en consola'
        };
      }

      // Enviar a impresora vía Electron IPC
      const result = await window.electronAPI.printer.print(ticketContent);

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido al imprimir');
      }

      return { success: true };
    } catch (error: any) {
      console.error('[Print] Error printing ticket:', error);
      return {
        success: false,
        error: error.message || 'Error al imprimir ticket'
      };
    }
  }

  /**
   * Imprimir ticket de prueba
   */
  async printTestTicket(): Promise<PrintResult> {
    try {
      const testContent = `
========== TEST TICKET ==========

Sabrosita POS
Impresora configurada correctamente

Fecha: ${new Date().toLocaleString('es-CR')}

========================================

Si puede leer esto, la impresora
funciona correctamente.

¡Gracias!

========================================
`;

      if (!this.isElectronAvailable()) {
        console.log(testContent);
        return {
          success: true,
          error: 'Modo web: ticket de prueba en consola'
        };
      }

      const result = await window.electronAPI.printer.print(testContent);

      if (!result.success) {
        throw new Error(result.error || 'Error al imprimir');
      }

      return { success: true };
    } catch (error: any) {
      console.error('[Print] Error printing test ticket:', error);
      return {
        success: false,
        error: error.message || 'Error al imprimir ticket de prueba'
      };
    }
  }

  /**
   * Configurar información del negocio
   */
  setBusinessConfig(config: {
    name?: string;
    address?: string;
    phone?: string;
  }) {
    this.businessConfig = {
      ...this.businessConfig,
      ...config,
    };
  }

  /**
   * Obtener configuración actual
   */
  getBusinessConfig() {
    return { ...this.businessConfig };
  }

  /**
   * Cargar configuración desde la base de datos
   */
  async loadConfigFromDB(): Promise<void> {
    try {
      // Solo cargar en cliente (no en SSR)
      if (typeof window === 'undefined') return;

      const { configService } = await import('@/features/settings/services/configService');
      const config = await configService.getBusinessConfig();

      this.setBusinessConfig({
        name: config.business_name,
        address: config.business_address,
        phone: config.business_phone,
      });

      console.log('[Print] Business config loaded from database');
    } catch (error) {
      console.error('[Print] Error loading config from DB:', error);
    }
  }
}

export const printService = new PrintService();

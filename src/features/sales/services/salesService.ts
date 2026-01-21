import { createClient } from '@/lib/supabase/client';
import { productsService } from '@/features/products/services/productsService';
import { configService } from '@/shared/services/configService';
import { sqliteClient } from '@/lib/database/sqlite-client';
import { connectionMonitor } from '@/lib/database/connection-monitor';
import { databaseAdapter } from '@/lib/database';
import type { CreateSaleInput, Sale, SaleWithItems } from '../types';
import type { SaleItem } from '@/features/pos/types';
import { calculateSaleTaxBreakdown, calculateTaxFromTotal } from '@/features/tax/utils/taxCalculations';
import { v4 as uuidv4 } from 'uuid';

class SalesService {
  private supabase = createClient();

  /**
   * Crear nueva venta (guarda venta + items + actualiza stock)
   * Funciona offline con SQLite y sincroniza automáticamente
   */
  async createSale(
    input: CreateSaleInput
  ): Promise<{ success: boolean; sale?: Sale; error?: string }> {
    try {
      // 1. Validar que haya items
      if (!input.items || input.items.length === 0) {
        return {
          success: false,
          error: 'No hay productos en la venta',
        };
      }

      // 2. Validar stock antes de procesar (solo si el control de inventario está habilitado)
      const inventoryControlEnabled = await configService.getConfigValue('inventory_control_enabled');
      const shouldCheckStock = inventoryControlEnabled !== 'false'; // Por defecto true

      if (shouldCheckStock) {
        for (const item of input.items) {
          // Validar stock usando databaseAdapter (funciona offline/online automáticamente)
          const products = await databaseAdapter.query<{ stock: number }>(
            'SELECT stock FROM products WHERE id = ? LIMIT 1',
            [item.productId]
          );

          if (products && products.length > 0 && products[0].stock < item.quantity) {
            return {
              success: false,
              error: `Stock insuficiente para ${item.name}`,
            };
          }
        }
      }

      // 3. Calcular desglose de IVA
      const taxBreakdown = calculateSaleTaxBreakdown(input.items);

      const saleId = uuidv4();
      const now = new Date().toISOString();

      const saleData = {
        id: saleId,
        cash_register_id: input.cashRegisterId,
        user_id: input.userId,
        customer_id: input.customerId || null,
        subtotal: taxBreakdown.subtotal,
        total_tax: taxBreakdown.totalTax,
        total: taxBreakdown.total,
        payment_method: input.paymentMethod,
        amount_received: input.amountReceived,
        change_given: input.change,
        payment_currency: input.paymentCurrency || 'CRC',
        amount_received_usd: input.amountReceivedUsd || null,
        exchange_rate_used: input.exchangeRateUsed || null,
        created_at: now,
      };

      // 4. Insertar venta usando databaseAdapter (maneja online/offline automáticamente)
      await databaseAdapter.insert('sales', saleData);

      // 5. Insertar items de la venta
      for (const item of input.items) {
        const taxCalc = calculateTaxFromTotal(item.subtotal, item.taxRate as any);
        const itemId = uuidv4();

        const saleItemData = {
          id: itemId,
          sale_id: saleId,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          subtotal: item.subtotal,
          tax_rate: item.taxRate,
          tax_amount: taxCalc.taxAmount,
          subtotal_before_tax: taxCalc.subtotalBeforeTax,
          created_at: now,
        };

        await databaseAdapter.insert('sale_items', saleItemData);
      }

      console.log('[SalesService] ✅ Venta guardada:', saleId);

      // 6. Actualizar stock de productos (solo si el control de inventario está habilitado)
      if (shouldCheckStock) {
        const stockUpdateResult = await this.updateProductStock(input.items);

        if (!stockUpdateResult.success) {
          console.error('Stock update warning:', stockUpdateResult.error);
          // No fallar la venta si el stock no se actualizó (puede sincronizar después)
        }
      } else {
        console.log('⚠️ Control de inventario deshabilitado - NO se actualiza stock');
      }

      return {
        success: true,
        sale: this.mapToSale(saleData),
      };
    } catch (error: any) {
      console.error('Create sale error:', error);
      return {
        success: false,
        error: error.message || 'Error al crear venta',
      };
    }
  }

  /**
   * Actualizar stock después de venta (restar cantidades)
   */
  async updateProductStock(
    items: SaleItem[]
  ): Promise<{ success: boolean; error?: string }> {
    try {
      for (const item of items) {
        const result = await productsService.adjustStock(
          item.productId,
          -item.quantity // Negativo para restar
        );

        if (!result.success) {
          throw new Error(
            `Error actualizando stock de ${item.name}: ${result.error}`
          );
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Update stock error:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar stock',
      };
    }
  }

  /**
   * Obtener ventas por caja registradora
   */
  async getSalesByCashRegister(
    cashRegisterId: string
  ): Promise<Sale[]> {
    try {
      // Si estamos offline y en Electron, usar SQLite
      if (!connectionMonitor.isOnline() && sqliteClient.isAvailable()) {
        const data = await sqliteClient.query<any>(
          'SELECT * FROM sales WHERE cash_register_id = ? ORDER BY created_at DESC',
          [cashRegisterId]
        );
        return data.map(this.mapToSale);
      }

      // Si estamos online, usar Supabase
      const { data, error } = await this.supabase
        .from('sales')
        .select('*')
        .eq('cash_register_id', cashRegisterId)
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback a SQLite si está disponible
        if (sqliteClient.isAvailable()) {
          const sqliteData = await sqliteClient.query<any>(
            'SELECT * FROM sales WHERE cash_register_id = ? ORDER BY created_at DESC',
            [cashRegisterId]
          );
          return sqliteData.map(this.mapToSale);
        }
        throw error;
      }

      return (data || []).map(this.mapToSale);
    } catch (error) {
      console.error('Get sales by register error:', error);
      return [];
    }
  }

  /**
   * Obtener venta con items
   */
  async getSaleWithItems(saleId: string): Promise<SaleWithItems | null> {
    try {
      // Obtener venta
      const { data: saleData, error: saleError } = await this.supabase
        .from('sales')
        .select('*')
        .eq('id', saleId)
        .single();

      if (saleError || !saleData) return null;

      // Obtener items
      const { data: itemsData, error: itemsError } = await this.supabase
        .from('sale_items')
        .select('*, products(*)')
        .eq('sale_id', saleId);

      if (itemsError) throw itemsError;

      const items: SaleItem[] = (itemsData || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        code: item.products.code,
        name: item.products.name,
        quantity: item.quantity,
        unitPrice: parseFloat(item.unit_price),
        subtotal: parseFloat(item.subtotal),
      }));

      return {
        ...this.mapToSale(saleData),
        items,
      };
    } catch (error) {
      console.error('Get sale with items error:', error);
      return null;
    }
  }

  /**
   * Obtener ventas por usuario
   */
  async getSalesByUser(
    userId: string,
    limit: number = 50
  ): Promise<Sale[]> {
    try {
      const { data, error } = await this.supabase
        .from('sales')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return (data || []).map(this.mapToSale);
    } catch (error) {
      console.error('Get sales by user error:', error);
      return [];
    }
  }

  /**
   * Obtener estadísticas de ventas (por fecha)
   * Usa databaseAdapter para funcionar tanto online como offline
   */
  async getSalesStats(dateFrom: string, dateTo: string): Promise<{
    totalSales: number;
    totalRevenue: number;
    cashSales: number;
    cardSales: number;
    sinpeSales: number;
  }> {
    try {
      // Normalizar fechas para comparación inclusiva
      const startDate = `${dateFrom}T00:00:00`;
      const endDate = `${dateTo}T23:59:59`;

      const data = await databaseAdapter.query<any>(
        `SELECT * FROM sales WHERE created_at >= ? AND created_at <= ?`,
        [startDate, endDate]
      );

      const totalSales = data?.length || 0;
      const totalRevenue = data?.reduce((sum, s) => sum + parseFloat(s.total), 0) || 0;

      const cashSales = data
        ?.filter((s: any) => s.payment_method === 'cash')
        .reduce((sum, s: any) => sum + parseFloat(s.total), 0) || 0;

      const cardSales = data
        ?.filter((s: any) => s.payment_method === 'card')
        .reduce((sum, s: any) => sum + parseFloat(s.total), 0) || 0;

      const sinpeSales = data
        ?.filter((s: any) => s.payment_method === 'sinpe')
        .reduce((sum, s: any) => sum + parseFloat(s.total), 0) || 0;

      return {
        totalSales,
        totalRevenue,
        cashSales,
        cardSales,
        sinpeSales,
      };
    } catch (error) {
      console.error('Get sales stats error:', error);
      return {
        totalSales: 0,
        totalRevenue: 0,
        cashSales: 0,
        cardSales: 0,
        sinpeSales: 0,
      };
    }
  }

  /**
   * Obtener ventas recientes (últimas N ventas)
   * Usa databaseAdapter para funcionar tanto online como offline
   */
  async getRecentSales(limit: number = 50): Promise<Sale[]> {
    try {
      // Usar databaseAdapter que maneja online/offline automáticamente
      const data = await databaseAdapter.query<any>(
        `SELECT * FROM sales ORDER BY created_at DESC LIMIT ?`,
        [limit]
      );

      return (data || []).map(this.mapToSale);
    } catch (error) {
      console.error('Get recent sales error:', error);
      return [];
    }
  }

  /**
   * Anular/cancelar venta
   */
  async cancelSale(
    saleId: string,
    userId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Verificar que la venta existe y no está cancelada
      const { data: saleData, error: saleError } = await this.supabase
        .from('sales')
        .select('*, sale_items(*)')
        .eq('id', saleId)
        .single();

      if (saleError || !saleData) {
        return { success: false, error: 'Venta no encontrada' };
      }

      if (saleData.canceled_at) {
        return { success: false, error: 'Esta venta ya está anulada' };
      }

      // 2. Actualizar venta como cancelada
      const { error: updateError } = await this.supabase
        .from('sales')
        .update({
          canceled_at: new Date().toISOString(),
          canceled_by: userId,
          cancel_reason: reason,
        })
        .eq('id', saleId);

      if (updateError) throw updateError;

      // 3. Devolver stock (sumar cantidades)
      const items = saleData.sale_items || [];
      for (const item of items) {
        const result = await productsService.adjustStock(
          item.product_id,
          item.quantity // Positivo para devolver
        );

        if (!result.success) {
          console.error(`Error devolviendo stock de ${item.name}:`, result.error);
          // Continuar aunque falle (se puede corregir manualmente)
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Cancel sale error:', error);
      return {
        success: false,
        error: error.message || 'Error al anular venta',
      };
    }
  }

  /**
   * Mapear datos de Supabase/SQLite a Sale
   */
  private mapToSale(data: any): Sale {
    return {
      id: data.id,
      cashRegisterId: data.cash_register_id || data.cashRegisterId,
      userId: data.user_id || data.userId,
      customerId: data.customer_id || data.customerId,
      subtotal: parseFloat(data.subtotal || 0),
      totalTax: parseFloat(data.total_tax || data.totalTax || 0),
      total: parseFloat(data.total),
      paymentMethod: data.payment_method || data.paymentMethod,
      amountReceived: parseFloat(data.amount_received || data.amountReceived),
      changeGiven: parseFloat(data.change_given || data.changeGiven),
      createdAt: data.created_at || data.createdAt,
      syncedAt: data.synced_at || data.syncedAt,
      canceledAt: data.canceled_at || data.canceledAt || null,
      canceledBy: data.canceled_by || data.canceledBy || null,
      cancelReason: data.cancel_reason || data.cancelReason || null,
    };
  }
}

export const salesService = new SalesService();

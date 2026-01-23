import { createClient } from '@/lib/supabase/client';
import type {
  CashRegister,
  OpenCashRegisterInput,
  CloseCashRegisterInput,
  CashRegisterSummary,
} from '../types';
import { v4 as uuidv4 } from 'uuid';

interface CashRegisterRow {
  id: string;
  user_id: string;
  opened_at: string;
  closed_at: string | null;
  initial_amount: number;
  final_amount: number | null;
  expected_amount: number | null;
  difference: number | null;
  notes: string | null;
  status: string;
  exchange_rate: number;
}

interface SaleRow {
  id: string;
  total: number;
  payment_method: string;
}

class CashRegisterService {
  /**
   * Get a fresh Supabase client for each operation
   * This ensures the auth token is always current
   */
  private getClient() {
    return createClient();
  }

  /**
   * Obtener caja abierta del usuario actual
   * Usa Supabase API directamente para compatibilidad con frontend web
   */
  async getOpenRegister(userId: string): Promise<CashRegister | null> {
    try {
      console.log('[CashRegisterService] Buscando caja abierta para usuario:', userId);

      const { data: registers, error } = await this.getClient()
        .from('cash_registers')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'open')
        .order('opened_at', { ascending: false })
        .limit(1);

      if (error) {
        console.error('[CashRegisterService] Error Supabase:', error);
        throw error;
      }

      if (!registers || registers.length === 0) {
        console.log('[CashRegisterService] No hay caja abierta');
        return null;
      }

      console.log('[CashRegisterService] ✅ Caja abierta encontrada:', registers[0].id);

      return this.mapToCashRegister(registers[0] as CashRegisterRow);
    } catch (error) {
      console.error('Get open register error:', error);
      return null;
    }
  }

  /**
   * Abrir nueva caja
   * Usa Supabase API directamente para compatibilidad con frontend web
   */
  async openRegister(
    input: OpenCashRegisterInput
  ): Promise<{ success: boolean; register?: CashRegister; error?: string }> {
    try {
      // Verificar que no haya una caja abierta
      const existingRegister = await this.getOpenRegister(input.userId);

      if (existingRegister) {
        return {
          success: false,
          error: 'Ya tiene una caja abierta. Debe cerrarla primero.',
        };
      }

      const registerId = uuidv4();
      const now = new Date().toISOString();

      const registerData = {
        id: registerId,
        user_id: input.userId,
        initial_amount: input.initialAmount,
        exchange_rate: input.exchangeRate,
        status: 'open',
        opened_at: now,
      };

      // Insertar usando Supabase
      const { error } = await this.getClient()
        .from('cash_registers')
        .insert(registerData);

      if (error) {
        console.error('[CashRegisterService] Error abriendo caja:', error);
        throw error;
      }

      console.log('[CashRegisterService] ✅ Caja abierta:', registerId);

      return {
        success: true,
        register: this.mapToCashRegister({
          ...registerData,
          closed_at: null,
          final_amount: null,
          expected_amount: null,
          difference: null,
          notes: null,
        }),
      };
    } catch (error: any) {
      console.error('Open register error:', error);
      return {
        success: false,
        error: error.message || 'Error al abrir caja',
      };
    }
  }

  /**
   * Cerrar caja
   * Usa Supabase API directamente para compatibilidad con frontend web
   */
  async closeRegister(
    input: CloseCashRegisterInput
  ): Promise<{ success: boolean; register?: CashRegister; error?: string }> {
    try {
      console.log('[CashRegisterService] Iniciando cierre de caja:', input.registerId);

      // Obtener resumen de ventas de esta caja
      const summary = await this.getRegisterSummary(input.registerId);

      if (!summary.register || !summary.register.id) {
        console.error('[CashRegisterService] Caja no encontrada en resumen');
        throw new Error('Caja no encontrada');
      }

      const expectedAmount = summary.register.initialAmount + summary.totalCash;
      const difference = input.finalAmount - expectedAmount;
      const now = new Date().toISOString();

      console.log('[CashRegisterService] Datos de cierre:', {
        registerId: input.registerId,
        finalAmount: input.finalAmount,
        expectedAmount,
        difference,
        now,
      });

      // Actualizar caja como cerrada usando Supabase con .select() para obtener el resultado
      const { data: updatedData, error: updateError } = await this.getClient()
        .from('cash_registers')
        .update({
          closed_at: now,
          final_amount: input.finalAmount,
          expected_amount: expectedAmount,
          difference: difference,
          notes: input.notes || null,
          status: 'closed',
        })
        .eq('id', input.registerId)
        .select();

      if (updateError) {
        console.error('[CashRegisterService] Error cerrando caja:', updateError);
        throw updateError;
      }

      // Verificar que el update afectó al menos una fila
      if (!updatedData || updatedData.length === 0) {
        console.error('[CashRegisterService] Update no afectó ninguna fila. ID:', input.registerId);
        throw new Error('No se pudo actualizar la caja. Verifique que la caja existe.');
      }

      const updatedRegister = updatedData[0] as CashRegisterRow;

      // Verificar que el status realmente cambió a 'closed'
      if (updatedRegister.status !== 'closed') {
        console.error('[CashRegisterService] Status no se actualizó correctamente:', updatedRegister.status);
        throw new Error('El estado de la caja no se actualizó correctamente');
      }

      console.log('[CashRegisterService] ✅ Caja cerrada exitosamente:', {
        id: input.registerId,
        status: updatedRegister.status,
        closedAt: updatedRegister.closed_at,
      });

      return {
        success: true,
        register: this.mapToCashRegister(updatedRegister),
      };
    } catch (error: any) {
      console.error('[CashRegisterService] Error en closeRegister:', error);
      return {
        success: false,
        error: error.message || 'Error al cerrar caja',
      };
    }
  }

  /**
   * Obtener resumen de una caja (ventas asociadas)
   * Usa Supabase API directamente para compatibilidad con frontend web
   */
  async getRegisterSummary(registerId: string): Promise<CashRegisterSummary> {
    try {
      // Obtener caja usando Supabase
      const { data: registerRows, error: registerError } = await this.getClient()
        .from('cash_registers')
        .select('*')
        .eq('id', registerId)
        .limit(1);

      if (registerError) {
        console.error('[CashRegisterService] Error obteniendo caja:', registerError);
        throw registerError;
      }

      if (!registerRows || registerRows.length === 0) {
        throw new Error('Caja no encontrada');
      }

      // Obtener ventas de esta caja usando Supabase
      const { data: sales, error: salesError } = await this.getClient()
        .from('sales')
        .select('id, total, payment_method')
        .eq('cash_register_id', registerId);

      if (salesError) {
        console.error('[CashRegisterService] Error obteniendo ventas:', salesError);
        throw salesError;
      }

      // Calcular totales por método de pago
      const totalCash = (sales || [])
        .filter((s) => s.payment_method === 'cash')
        .reduce((sum, s) => sum + parseFloat(String(s.total)), 0);

      const totalCard = (sales || [])
        .filter((s) => s.payment_method === 'card')
        .reduce((sum, s) => sum + parseFloat(String(s.total)), 0);

      const totalSinpe = (sales || [])
        .filter((s) => s.payment_method === 'sinpe')
        .reduce((sum, s) => sum + parseFloat(String(s.total)), 0);

      const totalSales = totalCash + totalCard + totalSinpe;

      // Obtener cantidad de items vendidos
      const { data: saleItems, error: itemsError } = await this.getClient()
        .from('sale_items')
        .select('id, sale_id, quantity')
        .in('sale_id', (sales || []).map(s => s.id));

      const itemCount = itemsError
        ? 0
        : (saleItems || []).reduce((sum, item) => sum + (item.quantity || 1), 0);

      return {
        register: this.mapToCashRegister(registerRows[0] as CashRegisterRow),
        totalSales,
        totalCash,
        totalCard,
        totalSinpe,
        salesCount: sales?.length || 0,
        itemCount,
      };
    } catch (error) {
      console.error('Get register summary error:', error);
      // Retornar valores por defecto en caso de error
      return {
        register: {} as CashRegister,
        totalSales: 0,
        totalCash: 0,
        totalCard: 0,
        totalSinpe: 0,
        salesCount: 0,
        itemCount: 0,
      };
    }
  }

  /**
   * Obtener historial de cajas del usuario
   * Usa Supabase API directamente para compatibilidad con frontend web
   */
  async getUserRegisters(userId: string, limit: number = 10): Promise<CashRegister[]> {
    try {
      const { data: registers, error } = await this.getClient()
        .from('cash_registers')
        .select('*')
        .eq('user_id', userId)
        .order('opened_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[CashRegisterService] Error obteniendo historial:', error);
        throw error;
      }

      return (registers || []).map((r) => this.mapToCashRegister(r as CashRegisterRow));
    } catch (error) {
      console.error('Get user registers error:', error);
      return [];
    }
  }

  /**
   * Obtener TODAS las cajas abiertas (solo para admin/super_admin)
   * Incluye información del usuario que abrió cada caja
   */
  async getAllOpenRegisters(): Promise<Array<CashRegister & { username?: string }>> {
    try {
      const { data: registers, error } = await this.getClient()
        .from('cash_registers')
        .select(`
          *,
          users:user_id (username)
        `)
        .eq('status', 'open')
        .order('opened_at', { ascending: false });

      if (error) {
        console.error('[CashRegisterService] Error obteniendo cajas abiertas:', error);
        throw error;
      }

      return (registers || []).map((r: any) => ({
        ...this.mapToCashRegister(r as CashRegisterRow),
        username: r.users?.username || 'Usuario desconocido',
      }));
    } catch (error) {
      console.error('Get all open registers error:', error);
      return [];
    }
  }

  /**
   * Cerrar caja de otro usuario (solo admin/super_admin)
   * El admin puede cerrar cualquier caja abierta
   */
  async adminCloseRegister(
    registerId: string,
    finalAmount: number,
    notes?: string,
    adminUserId?: string
  ): Promise<{ success: boolean; register?: CashRegister; error?: string }> {
    try {
      console.log('[CashRegisterService] Admin cerrando caja:', registerId);

      // Obtener resumen de ventas de esta caja
      const summary = await this.getRegisterSummary(registerId);

      if (!summary.register || !summary.register.id) {
        throw new Error('Caja no encontrada');
      }

      const expectedAmount = summary.register.initialAmount + summary.totalCash;
      const difference = finalAmount - expectedAmount;
      const now = new Date().toISOString();

      const adminNote = adminUserId
        ? `[Cerrado por admin] ${notes || ''}`.trim()
        : notes || null;

      // Actualizar caja como cerrada
      const { data: updatedData, error: updateError } = await this.getClient()
        .from('cash_registers')
        .update({
          closed_at: now,
          final_amount: finalAmount,
          expected_amount: expectedAmount,
          difference: difference,
          notes: adminNote,
          status: 'closed',
        })
        .eq('id', registerId)
        .select();

      if (updateError) {
        throw updateError;
      }

      if (!updatedData || updatedData.length === 0) {
        throw new Error('No se pudo actualizar la caja');
      }

      console.log('[CashRegisterService] ✅ Caja cerrada por admin:', registerId);

      return {
        success: true,
        register: this.mapToCashRegister(updatedData[0] as CashRegisterRow),
      };
    } catch (error: any) {
      console.error('[CashRegisterService] Error admin cerrando caja:', error);
      return {
        success: false,
        error: error.message || 'Error al cerrar caja',
      };
    }
  }

  /**
   * Mapear datos de DB a CashRegister
   */
  private mapToCashRegister(data: CashRegisterRow): CashRegister {
    return {
      id: data.id,
      userId: data.user_id,
      openedAt: data.opened_at,
      closedAt: data.closed_at,
      initialAmount: parseFloat(String(data.initial_amount)) || 0,
      finalAmount: data.final_amount ? parseFloat(String(data.final_amount)) : null,
      expectedAmount: data.expected_amount ? parseFloat(String(data.expected_amount)) : null,
      difference: data.difference ? parseFloat(String(data.difference)) : null,
      notes: data.notes,
      status: data.status as 'open' | 'closed',
      exchangeRate: parseFloat(String(data.exchange_rate)) || 570,
    };
  }

  /**
   * Actualizar tipo de cambio de la caja abierta (solo super_admin)
   * Usa Supabase API directamente para compatibilidad con frontend web
   */
  async updateExchangeRate(
    registerId: string,
    newExchangeRate: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.getClient()
        .from('cash_registers')
        .update({ exchange_rate: newExchangeRate })
        .eq('id', registerId);

      if (error) {
        console.error('[CashRegisterService] Error actualizando tipo de cambio:', error);
        throw error;
      }

      console.log('[CashRegisterService] ✅ Tipo de cambio actualizado:', registerId, newExchangeRate);

      return { success: true };
    } catch (error: any) {
      console.error('Update exchange rate error:', error);
      return {
        success: false,
        error: error.message || 'Error al actualizar tipo de cambio',
      };
    }
  }
}

export const cashRegisterService = new CashRegisterService();

import { databaseAdapter } from '@/lib/database';
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
  opening_balance: number;
  closing_balance: number | null;
  notes: string | null;
  status: string;
  created_at: string;
}

interface SaleRow {
  id: string;
  total: number;
  payment_method: string;
}

class CashRegisterService {
  /**
   * Obtener caja abierta del usuario actual
   */
  async getOpenRegister(userId: string): Promise<CashRegister | null> {
    try {
      console.log('[CashRegisterService] Buscando caja abierta para usuario:', userId);

      const registers = await databaseAdapter.query<CashRegisterRow>(
        `SELECT * FROM cash_registers
         WHERE user_id = ? AND status = 'open'
         ORDER BY opened_at DESC
         LIMIT 1`,
        [userId]
      );

      if (!registers || registers.length === 0) {
        console.log('[CashRegisterService] No hay caja abierta');
        return null;
      }

      console.log('[CashRegisterService] ✅ Caja abierta encontrada:', registers[0].id);

      return this.mapToCashRegister(registers[0]);
    } catch (error) {
      console.error('Get open register error:', error);
      return null;
    }
  }

  /**
   * Abrir nueva caja
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
        opening_balance: input.initialAmount,
        status: 'open',
        opened_at: now,
        created_at: now,
      };

      await databaseAdapter.insert('cash_registers', registerData);

      console.log('[CashRegisterService] ✅ Caja abierta:', registerId);

      return {
        success: true,
        register: this.mapToCashRegister({
          ...registerData,
          closed_at: null,
          closing_balance: null,
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
   */
  async closeRegister(
    input: CloseCashRegisterInput
  ): Promise<{ success: boolean; register?: CashRegister; error?: string }> {
    try {
      // Obtener resumen de ventas de esta caja
      const summary = await this.getRegisterSummary(input.registerId);

      const expectedAmount = summary.register.initialAmount + summary.totalCash;
      const difference = input.finalAmount - expectedAmount;
      const now = new Date().toISOString();

      // Actualizar caja como cerrada usando databaseAdapter.update
      await databaseAdapter.update('cash_registers', input.registerId, {
        closed_at: now,
        closing_balance: input.finalAmount,
        notes: input.notes || null,
        status: 'closed',
      });

      // Obtener la caja actualizada
      const updatedRegister = await databaseAdapter.query<CashRegisterRow>(
        'SELECT * FROM cash_registers WHERE id = ? LIMIT 1',
        [input.registerId]
      );

      if (!updatedRegister || updatedRegister.length === 0) {
        throw new Error('No se pudo obtener la caja actualizada');
      }

      console.log('[CashRegisterService] ✅ Caja cerrada:', input.registerId);

      return {
        success: true,
        register: this.mapToCashRegister(updatedRegister[0]),
      };
    } catch (error: any) {
      console.error('Close register error:', error);
      return {
        success: false,
        error: error.message || 'Error al cerrar caja',
      };
    }
  }

  /**
   * Obtener resumen de una caja (ventas asociadas)
   */
  async getRegisterSummary(registerId: string): Promise<CashRegisterSummary> {
    try {
      // Obtener caja
      const registerRows = await databaseAdapter.query<CashRegisterRow>(
        'SELECT * FROM cash_registers WHERE id = ? LIMIT 1',
        [registerId]
      );

      if (!registerRows || registerRows.length === 0) {
        throw new Error('Caja no encontrada');
      }

      // Obtener ventas de esta caja
      const sales = await databaseAdapter.query<SaleRow>(
        'SELECT id, total, payment_method FROM sales WHERE cash_register_id = ?',
        [registerId]
      );

      // Calcular totales por método de pago
      const totalCash = sales
        ?.filter((s) => s.payment_method === 'cash')
        .reduce((sum, s) => sum + parseFloat(String(s.total)), 0) || 0;

      const totalCard = sales
        ?.filter((s) => s.payment_method === 'card')
        .reduce((sum, s) => sum + parseFloat(String(s.total)), 0) || 0;

      const totalSinpe = sales
        ?.filter((s) => s.payment_method === 'sinpe')
        .reduce((sum, s) => sum + parseFloat(String(s.total)), 0) || 0;

      const totalSales = totalCash + totalCard + totalSinpe;

      return {
        register: this.mapToCashRegister(registerRows[0]),
        totalSales,
        totalCash,
        totalCard,
        totalSinpe,
        salesCount: sales?.length || 0,
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
      };
    }
  }

  /**
   * Obtener historial de cajas del usuario
   */
  async getUserRegisters(userId: string, limit: number = 10): Promise<CashRegister[]> {
    try {
      const registers = await databaseAdapter.query<CashRegisterRow>(
        `SELECT * FROM cash_registers
         WHERE user_id = ?
         ORDER BY opened_at DESC
         LIMIT ?`,
        [userId, limit]
      );

      return (registers || []).map(this.mapToCashRegister);
    } catch (error) {
      console.error('Get user registers error:', error);
      return [];
    }
  }

  /**
   * Mapear datos de DB a CashRegister
   * NOTA: SQLite usa opening_balance/closing_balance, no initial_amount/final_amount
   */
  private mapToCashRegister(data: CashRegisterRow): CashRegister {
    return {
      id: data.id,
      userId: data.user_id,
      openedAt: data.opened_at,
      closedAt: data.closed_at,
      initialAmount: parseFloat(String(data.opening_balance)) || 0,
      finalAmount: data.closing_balance ? parseFloat(String(data.closing_balance)) : null,
      // NOTA: SQLite no tiene expectedAmount ni difference
      expectedAmount: null,
      difference: null,
      notes: data.notes,
      status: data.status,
      exchangeRate: 570, // Valor por defecto (SQLite no tiene exchange_rate)
    };
  }

  /**
   * Actualizar tipo de cambio de la caja abierta (solo super_admin)
   * NOTA: SQLite no tiene columna exchange_rate, este método no hace nada en offline
   */
  async updateExchangeRate(
    registerId: string,
    newExchangeRate: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // En SQLite no tenemos exchange_rate, solo logueamos
      console.warn('[CashRegisterService] updateExchangeRate no implementado en SQLite (solo Supabase)');

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

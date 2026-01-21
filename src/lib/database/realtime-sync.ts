/**
 * Realtime Sync Service
 * Sincronización en tiempo real con Supabase Realtime
 * Escucha cambios en productos, config, etc. y actualiza SQLite local
 */

import { createClient } from '@/lib/supabase/client';
import { sqliteClient } from './sqlite-client';
import { connectionMonitor } from './connection-monitor';
import type { RealtimeChannel } from '@supabase/supabase-js';

type TableName = 'products' | 'config' | 'customers';

interface RealtimePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: Record<string, any>;
  old: Record<string, any>;
  table: string;
}

class RealtimeSync {
  private channels: Map<string, RealtimeChannel> = new Map();
  private isInitialized = false;

  /**
   * Inicializar sincronización en tiempo real
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[RealtimeSync] Ya inicializado');
      return;
    }

    // Solo inicializar si estamos en Electron (necesitamos SQLite)
    if (!sqliteClient.isAvailable()) {
      console.log('[RealtimeSync] No disponible: no estamos en Electron');
      return;
    }

    // Suscribirse a cambios en tablas críticas
    this.subscribeToTable('products', this.handleProductsChange.bind(this));
    this.subscribeToTable('config', this.handleConfigChange.bind(this));
    this.subscribeToTable('customers', this.handleCustomersChange.bind(this));

    this.isInitialized = true;
    console.log('✅ [RealtimeSync] Inicializado - escuchando cambios en tiempo real');
  }

  /**
   * Suscribirse a cambios en una tabla
   */
  private subscribeToTable(
    table: TableName,
    handler: (payload: RealtimePayload) => Promise<void>
  ): void {
    const supabase = createClient();

    const channel = supabase
      .channel(`realtime:${table}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table,
        },
        async (payload: any) => {
          console.log(`[RealtimeSync] Cambio detectado en ${table}:`, payload);

          try {
            await handler({
              eventType: payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE',
              new: payload.new || {},
              old: payload.old || {},
              table,
            });
          } catch (error) {
            console.error(`[RealtimeSync] Error manejando cambio en ${table}:`, error);
          }
        }
      )
      .subscribe((status) => {
        console.log(`[RealtimeSync] Suscripción a ${table}:`, status);
      });

    this.channels.set(table, channel);
  }

  /**
   * Manejar cambios en productos
   */
  private async handleProductsChange(payload: RealtimePayload): Promise<void> {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      // Verificar si el producto existe en SQLite
      const existing = await sqliteClient.query<{ id: string }>(
        'SELECT id FROM products WHERE id = ? LIMIT 1',
        [newRecord.id]
      );

      if (existing.length > 0) {
        // Actualizar
        await sqliteClient.run(
          `UPDATE products SET
            code = ?, name = ?, category = ?, cost = ?,
            price = ?, stock = ?, min_stock = ?, tax_rate = ?,
            updated_at = ?
          WHERE id = ?`,
          [
            newRecord.code,
            newRecord.name,
            newRecord.category,
            newRecord.cost,
            newRecord.price,
            newRecord.stock,
            newRecord.min_stock,
            newRecord.tax_rate,
            newRecord.updated_at,
            newRecord.id,
          ]
        );

        console.log(`✅ [RealtimeSync] Producto actualizado: ${newRecord.name}`);

        // Notificar a la UI (custom event)
        this.notifyUI('product-updated', newRecord);
      } else {
        // Insertar
        await sqliteClient.run(
          `INSERT INTO products (
            id, code, name, category, cost, price, stock, min_stock, tax_rate, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newRecord.id,
            newRecord.code,
            newRecord.name,
            newRecord.category,
            newRecord.cost,
            newRecord.price,
            newRecord.stock,
            newRecord.min_stock,
            newRecord.tax_rate,
            newRecord.created_at,
            newRecord.updated_at,
          ]
        );

        console.log(`✅ [RealtimeSync] Producto insertado: ${newRecord.name}`);

        // Notificar a la UI
        this.notifyUI('product-created', newRecord);
      }
    } else if (eventType === 'DELETE') {
      // Eliminar
      await sqliteClient.run('DELETE FROM products WHERE id = ?', [oldRecord.id]);

      console.log(`✅ [RealtimeSync] Producto eliminado: ${oldRecord.id}`);

      // Notificar a la UI
      this.notifyUI('product-deleted', oldRecord);
    }
  }

  /**
   * Manejar cambios en configuración
   */
  private async handleConfigChange(payload: RealtimePayload): Promise<void> {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      // Verificar si existe
      const existing = await sqliteClient.query<{ key: string }>(
        'SELECT key FROM config WHERE key = ? LIMIT 1',
        [newRecord.key]
      );

      if (existing.length > 0) {
        // Actualizar
        await sqliteClient.run(
          'UPDATE config SET value = ?, description = ?, updated_at = ? WHERE key = ?',
          [newRecord.value, newRecord.description, newRecord.updated_at, newRecord.key]
        );
      } else {
        // Insertar
        await sqliteClient.run(
          'INSERT INTO config (key, value, description, updated_at) VALUES (?, ?, ?, ?)',
          [newRecord.key, newRecord.value, newRecord.description, newRecord.updated_at]
        );
      }

      console.log(`✅ [RealtimeSync] Config actualizada: ${newRecord.key} = ${newRecord.value}`);

      // Notificar a la UI (importante para tipo de cambio)
      this.notifyUI('config-updated', newRecord);
    } else if (eventType === 'DELETE') {
      await sqliteClient.run('DELETE FROM config WHERE key = ?', [oldRecord.key]);

      console.log(`✅ [RealtimeSync] Config eliminada: ${oldRecord.key}`);

      this.notifyUI('config-deleted', oldRecord);
    }
  }

  /**
   * Manejar cambios en clientes
   */
  private async handleCustomersChange(payload: RealtimePayload): Promise<void> {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT' || eventType === 'UPDATE') {
      const existing = await sqliteClient.query<{ id: string }>(
        'SELECT id FROM customers WHERE id = ? LIMIT 1',
        [newRecord.id]
      );

      if (existing.length > 0) {
        // Actualizar
        await sqliteClient.run(
          'UPDATE customers SET name = ?, phone = ?, email = ?, address = ?, updated_at = ? WHERE id = ?',
          [newRecord.name, newRecord.phone, newRecord.email, newRecord.address, newRecord.updated_at, newRecord.id]
        );
      } else {
        // Insertar
        await sqliteClient.run(
          'INSERT INTO customers (id, name, phone, email, address, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [newRecord.id, newRecord.name, newRecord.phone, newRecord.email, newRecord.address, newRecord.created_at, newRecord.updated_at]
        );
      }

      console.log(`✅ [RealtimeSync] Cliente actualizado: ${newRecord.name}`);

      this.notifyUI('customer-updated', newRecord);
    } else if (eventType === 'DELETE') {
      await sqliteClient.run('DELETE FROM customers WHERE id = ?', [oldRecord.id]);

      console.log(`✅ [RealtimeSync] Cliente eliminado: ${oldRecord.id}`);

      this.notifyUI('customer-deleted', oldRecord);
    }
  }

  /**
   * Notificar a la UI sobre cambios (usando Custom Events)
   */
  private notifyUI(eventName: string, data: any): void {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('realtime-sync', {
        detail: { type: eventName, data },
      });
      window.dispatchEvent(event);
    }
  }

  /**
   * Desuscribirse de todos los canales
   */
  async destroy(): Promise<void> {
    const supabase = createClient();

    for (const [table, channel] of this.channels.entries()) {
      await supabase.removeChannel(channel);
      console.log(`[RealtimeSync] Desuscrito de ${table}`);
    }

    this.channels.clear();
    this.isInitialized = false;

    console.log('[RealtimeSync] Destruido');
  }
}

// Singleton instance
export const realtimeSync = new RealtimeSync();

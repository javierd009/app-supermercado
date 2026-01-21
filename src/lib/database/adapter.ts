/**
 * Database Adapter
 * Capa de abstracción que decide automáticamente entre SQLite (offline) y Supabase (online)
 */

import { createClient } from '@/lib/supabase/client';
import { sqliteClient } from './sqlite-client';
import { connectionMonitor } from './connection-monitor';
import { v4 as uuidv4 } from 'uuid';

export type DatabaseMode = 'sqlite' | 'supabase' | 'auto';

interface SyncQueueItem {
  id: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id: string;
  data: string | null; // JSON serializado
  synced: number; // 0 = pendiente, 1 = sincronizado
  attempts: number;
  last_error: string | null;
  created_at: string;
  synced_at: string | null;
}

class DatabaseAdapter {
  private mode: DatabaseMode = 'auto';
  private forcedMode: 'sqlite' | 'supabase' | null = null;

  constructor() {
    // Suscribirse a cambios de conexión
    connectionMonitor.subscribe((status) => {
      console.log(`[DatabaseAdapter] Conexión cambió a: ${status}`);

      // Si volvemos online, intentar sincronizar
      if (status === 'online') {
        this.syncQueue();
      }
    });
  }

  /**
   * Determinar qué base de datos usar
   */
  private getCurrentDatabase(): 'sqlite' | 'supabase' {
    // Si hay modo forzado, usar ese
    if (this.forcedMode) {
      console.log('[DatabaseAdapter] Usando modo forzado:', this.forcedMode);
      return this.forcedMode;
    }

    // Si modo es 'auto', decidir basado en entorno
    if (this.mode === 'auto') {
      const sqliteAvailable = sqliteClient.isAvailable();
      const isOnline = connectionMonitor.isOnline();
      // Detectar si estamos en Electron real (app de escritorio)
      const isElectron = typeof window !== 'undefined' && (window as any).electron?.ipcRenderer;

      console.log('[DatabaseAdapter] getCurrentDatabase() - SQLite disponible:', sqliteAvailable, 'Online:', isOnline, 'Electron:', !!isElectron);

      // PRIORIDAD 1: Si estamos en navegador/PWA (NO Electron), SIEMPRE usar Supabase
      // El frontend web siempre se conecta a la nube
      if (!isElectron) {
        console.log('[DatabaseAdapter] ✅ Eligiendo Supabase (Frontend web/PWA - siempre nube)');
        return 'supabase';
      }

      // PRIORIDAD 2: Si estamos en Electron, usar SQLite para trabajar offline
      if (sqliteAvailable) {
        console.log('[DatabaseAdapter] ✅ Eligiendo SQLite (Electron - modo offline)');
        return 'sqlite';
      }

      // FALLBACK: Electron sin SQLite - usar Supabase
      console.warn('[DatabaseAdapter] ⚠️ Electron sin SQLite - intentando Supabase');
      return 'supabase';
    }

    console.log('[DatabaseAdapter] Usando modo explícito:', this.mode);
    return this.mode;
  }

  /**
   * Establecer modo de base de datos
   */
  setMode(mode: DatabaseMode) {
    this.mode = mode;
    console.log(`[DatabaseAdapter] Modo establecido: ${mode}`);
  }

  /**
   * Forzar uso de una base de datos específica (para testing)
   */
  forceMode(mode: 'sqlite' | 'supabase' | null) {
    this.forcedMode = mode;
    console.log(`[DatabaseAdapter] Modo forzado: ${mode || 'ninguno'}`);
  }

  /**
   * SELECT - Query genérica
   */
  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const db = this.getCurrentDatabase();
    console.log(`[DatabaseAdapter] query() usando: ${db}`);
    console.log(`[DatabaseAdapter] SQL: ${sql.substring(0, 100)}`);
    console.log(`[DatabaseAdapter] SQLite disponible: ${sqliteClient.isAvailable()}`);
    console.log(`[DatabaseAdapter] Online: ${connectionMonitor.isOnline()}`);

    if (db === 'sqlite') {
      console.log('[DatabaseAdapter] Ejecutando query en SQLite...');
      const result = await sqliteClient.query<T>(sql, params);
      console.log('[DatabaseAdapter] SQLite result rows:', result.length);
      return result;
    } else {
      // Para Supabase, necesitamos usar su API, no SQL directo
      // Por ahora lanzar error, los services deben usar métodos específicos
      console.error('[DatabaseAdapter] Intentando usar Supabase con SQL directo - NO SOPORTADO');
      throw new Error('Para Supabase, usar métodos específicos (from, select, etc.)');
    }
  }

  /**
   * INSERT - Insertar registro
   */
  async insert<T extends { id?: string }>(
    table: string,
    data: Omit<T, 'created_at' | 'updated_at'>
  ): Promise<string> {
    const db = this.getCurrentDatabase();
    const recordId = (data.id as string) || uuidv4();
    const dataWithId = { ...data, id: recordId };

    if (db === 'sqlite') {
      await sqliteClient.insert(table, dataWithId);

      // Agregar a cola de sincronización
      await this.addToSyncQueue('INSERT', table, recordId, dataWithId);

      return recordId;
    } else {
      const supabase = createClient();
      const { error } = await supabase
        .from(table)
        .insert(dataWithId);

      if (error) throw error;
      return recordId;
    }
  }

  /**
   * UPDATE - Actualizar registro
   */
  async update<T>(
    table: string,
    id: string,
    data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const db = this.getCurrentDatabase();

    if (db === 'sqlite') {
      await sqliteClient.update(table, id, data);

      // Agregar a cola de sincronización
      await this.addToSyncQueue('UPDATE', table, id, data);
    } else {
      const supabase = createClient();
      const { error } = await supabase
        .from(table)
        .update(data)
        .eq('id', id);

      if (error) throw error;
    }
  }

  /**
   * DELETE - Eliminar registro
   */
  async delete(table: string, id: string): Promise<void> {
    const db = this.getCurrentDatabase();

    if (db === 'sqlite') {
      await sqliteClient.delete(table, id);

      // Agregar a cola de sincronización
      await this.addToSyncQueue('DELETE', table, id, null);
    } else {
      const supabase = createClient();
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;
    }
  }

  /**
   * GET BY ID - Obtener registro por ID
   */
  async getById<T>(table: string, id: string): Promise<T | null> {
    const db = this.getCurrentDatabase();

    if (db === 'sqlite') {
      return sqliteClient.getById<T>(table, id);
    } else {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as T;
    }
  }

  /**
   * GET ALL - Obtener todos los registros
   */
  async getAll<T>(table: string): Promise<T[]> {
    const db = this.getCurrentDatabase();

    if (db === 'sqlite') {
      return sqliteClient.getAll<T>(table);
    } else {
      const supabase = createClient();
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) throw error;
      return (data || []) as T[];
    }
  }

  /**
   * Agregar operación a cola de sincronización
   */
  private async addToSyncQueue(
    operation: 'INSERT' | 'UPDATE' | 'DELETE',
    table: string,
    recordId: string,
    data: unknown
  ): Promise<void> {
    // Solo agregar a cola si estamos usando SQLite
    const db = this.getCurrentDatabase();
    if (db !== 'sqlite') return;

    try {
      const queueItem: SyncQueueItem = {
        id: uuidv4(),
        operation,
        table_name: table,
        record_id: recordId,
        data: data ? JSON.stringify(data) : null,
        synced: 0,
        attempts: 0,
        last_error: null,
        created_at: new Date().toISOString(),
        synced_at: null,
      };

      await sqliteClient.insert('sync_queue', queueItem);
      console.log(`[DatabaseAdapter] Agregado a cola de sync: ${operation} ${table} ${recordId}`);
    } catch (error) {
      console.error('[DatabaseAdapter] Error agregando a cola de sync:', error);
    }
  }

  /**
   * MAPEO DE CAMPOS: SQLite → Supabase
   * Define cómo los campos de SQLite se transforman a campos de Supabase
   */
  private readonly sqliteToSupabaseFieldMap: Record<string, Record<string, string>> = {
    cash_registers: {
      opening_balance: 'initial_amount',
      closing_balance: 'final_amount',
    },
    // Otras tablas tienen campos iguales, no necesitan mapeo
  };

  /**
   * MAPEO DE CAMPOS: Supabase → SQLite
   * Define cómo los campos de Supabase se transforman a campos de SQLite
   */
  private readonly supabaseToSqliteFieldMap: Record<string, Record<string, string>> = {
    cash_registers: {
      initial_amount: 'opening_balance',
      final_amount: 'closing_balance',
      expected_amount: null as any, // No existe en SQLite
      difference: null as any, // No existe en SQLite
      exchange_rate: null as any, // No existe en SQLite
    },
    sales: {
      synced_at: null as any, // No existe en SQLite
      canceled_at: null as any, // No existe en SQLite
      canceled_by: null as any, // No existe en SQLite
      cancel_reason: null as any, // No existe en SQLite
    },
    // sale_items: campos iguales en ambas bases
  };

  /**
   * ESQUEMAS VÁLIDOS PARA SUPABASE (qué columnas acepta cada tabla)
   */
  private readonly supabaseSchemas: Record<string, string[]> = {
    cash_registers: ['id', 'user_id', 'opened_at', 'closed_at', 'initial_amount', 'final_amount', 'expected_amount', 'difference', 'notes', 'status', 'exchange_rate'],
    sale_items: ['id', 'sale_id', 'product_id', 'quantity', 'unit_price', 'subtotal', 'tax_rate', 'tax_amount', 'subtotal_before_tax'],
    config: ['key', 'value'],
    products: ['id', 'code', 'name', 'category', 'cost', 'price', 'stock', 'min_stock', 'created_at', 'updated_at', 'tax_rate'],
    sales: ['id', 'cash_register_id', 'user_id', 'total', 'payment_method', 'amount_received', 'change_given', 'created_at', 'synced_at', 'subtotal', 'total_tax', 'customer_id', 'canceled_at', 'canceled_by', 'cancel_reason', 'payment_currency', 'amount_received_usd', 'exchange_rate_used'],
    customers: ['id', 'name', 'phone', 'email', 'address', 'tax_id', 'is_generic', 'created_at', 'updated_at'],
    users: ['id', 'username', 'password_hash', 'role', 'created_at', 'updated_at'],
  };

  /**
   * ESQUEMAS VÁLIDOS PARA SQLITE (qué columnas acepta cada tabla)
   * IMPORTANTE: Deben coincidir EXACTAMENTE con el schema de Supabase
   */
  private readonly sqliteSchemas: Record<string, string[]> = {
    cash_registers: ['id', 'user_id', 'opened_at', 'closed_at', 'initial_amount', 'final_amount', 'expected_amount', 'difference', 'notes', 'status', 'exchange_rate'],
    sale_items: ['id', 'sale_id', 'product_id', 'quantity', 'unit_price', 'subtotal', 'tax_rate', 'tax_amount', 'subtotal_before_tax'],
    config: ['key', 'value', 'description', 'updated_at'],
    products: ['id', 'code', 'name', 'category', 'cost', 'price', 'stock', 'min_stock', 'created_at', 'updated_at', 'tax_rate'],
    sales: ['id', 'cash_register_id', 'user_id', 'total', 'payment_method', 'amount_received', 'change_given', 'created_at', 'subtotal', 'total_tax', 'customer_id', 'payment_currency', 'amount_received_usd', 'exchange_rate_used'],
    customers: ['id', 'name', 'phone', 'email', 'address', 'tax_id', 'is_generic', 'created_at', 'updated_at'],
    users: ['id', 'username', 'password_hash', 'role', 'created_at', 'updated_at'],
  };

  /**
   * VALORES POR DEFECTO para campos NOT NULL de Supabase
   */
  private readonly supabaseDefaults: Record<string, Record<string, any>> = {
    cash_registers: {
      exchange_rate: 570.00,
      initial_amount: 0,
    },
    sales: {
      payment_currency: 'CRC',
      subtotal: 0,
      total_tax: 0,
    },
  };

  /**
   * Transforma datos de SQLite a formato Supabase
   * - Mapea nombres de campos diferentes
   * - Filtra columnas no válidas
   * - Aplica valores por defecto para campos NOT NULL
   */
  private cleanDataForSupabase(tableName: string, data: any): any {
    const fieldMap = this.sqliteToSupabaseFieldMap[tableName] || {};
    const allowedColumns = this.supabaseSchemas[tableName] || Object.keys(data);
    const defaults = this.supabaseDefaults[tableName] || {};
    const cleanedData: any = {};

    // Primero aplicar valores por defecto
    for (const [key, value] of Object.entries(defaults)) {
      cleanedData[key] = value;
    }

    // Luego procesar datos con mapeo
    for (const [sqliteKey, value] of Object.entries(data)) {
      if (value === undefined || value === null) continue;

      // Verificar si este campo necesita ser mapeado
      const supabaseKey = fieldMap[sqliteKey] || sqliteKey;

      // Solo incluir si la columna es válida en Supabase
      if (allowedColumns.includes(supabaseKey)) {
        cleanedData[supabaseKey] = value;
      }
    }

    console.log(`[DatabaseAdapter] cleanDataForSupabase(${tableName}):`, {
      input: Object.keys(data),
      output: Object.keys(cleanedData),
      mappings: Object.keys(fieldMap).length > 0 ? fieldMap : 'none'
    });

    return cleanedData;
  }

  /**
   * Transforma datos de Supabase a formato SQLite
   * - Mapea nombres de campos diferentes
   * - Filtra columnas no válidas para SQLite
   */
  private cleanDataForSQLite(tableName: string, data: any): any {
    const fieldMap = this.supabaseToSqliteFieldMap[tableName] || {};
    const allowedColumns = this.sqliteSchemas[tableName] || Object.keys(data);
    const cleanedData: any = {};

    for (const [supabaseKey, value] of Object.entries(data)) {
      if (value === undefined) continue;

      // Verificar si este campo necesita ser mapeado
      const sqliteKey = fieldMap[supabaseKey];

      // Si el mapeo es null, significa que este campo no existe en SQLite
      if (sqliteKey === null) continue;

      // Si no hay mapeo definido, usar el mismo nombre
      const finalKey = sqliteKey || supabaseKey;

      // Solo incluir si la columna es válida en SQLite
      if (allowedColumns.includes(finalKey)) {
        cleanedData[finalKey] = value;
      }
    }

    return cleanedData;
  }

  /**
   * Sincronizar cola pendiente con Supabase (SQLite → Supabase)
   * Sube los cambios locales a la nube
   */
  async syncQueue(): Promise<void> {
    // Solo sincronizar si estamos en Electron (tiene SQLite)
    if (!sqliteClient.isAvailable()) {
      console.log('[DatabaseAdapter] Sincronización solo disponible en Electron');
      return;
    }

    // IMPORTANTE: No intentar sincronizar si estamos offline
    // Esto evita llamadas de red innecesarias
    if (!connectionMonitor.isOnline()) {
      // Solo loguear si hay items pendientes (para no llenar la consola)
      try {
        const [result] = await sqliteClient.query<{ count: number }>(
          'SELECT COUNT(*) as count FROM sync_queue WHERE synced = 0'
        );
        if (result?.count > 0) {
          console.log(`[DatabaseAdapter] ⏸️ Sincronización pausada (offline) - ${result.count} items pendientes`);
        }
      } catch {
        // Silenciar error de conteo
      }
      return;
    }

    // Verificar si podemos conectar a Supabase
    try {
      const supabase = createClient();
      const { error } = await supabase.from('products').select('id').limit(1);
      if (error) {
        console.log('[DatabaseAdapter] ⚠️ No se puede conectar a Supabase:', error.message);
        return;
      }
    } catch (error) {
      console.log('[DatabaseAdapter] ⚠️ No hay conexión a Supabase');
      return;
    }

    try {
      // Obtener items pendientes de la cola
      const pendingItems = await sqliteClient.query<SyncQueueItem>(
        'SELECT * FROM sync_queue WHERE synced = 0 ORDER BY created_at ASC LIMIT 50'
      );

      if (pendingItems.length === 0) {
        console.log('[DatabaseAdapter] Cola de sincronización vacía');
        return;
      }

      console.log(`[DatabaseAdapter] Sincronizando ${pendingItems.length} items...`);

      // Ordenar por prioridad de tabla (respetar foreign keys)
      const tablePriority: Record<string, number> = {
        users: 1,
        customers: 1,
        products: 1,
        config: 1,
        cash_registers: 2,
        sales: 3,
        sale_items: 4
      };

      const sortedItems = pendingItems.sort((a, b) => {
        const priorityA = tablePriority[a.table_name] || 99;
        const priorityB = tablePriority[b.table_name] || 99;
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        // Si tienen la misma prioridad, ordenar por created_at
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

      const supabase = createClient();

      // Procesar cada item
      for (const item of sortedItems) {
        try {
          console.log(`[DatabaseAdapter] Sincronizando: ${item.operation} ${item.table_name} ${item.record_id}`);

          if (item.operation === 'INSERT') {
            const rawData = item.data ? JSON.parse(item.data) : {};
            const data = this.cleanDataForSupabase(item.table_name, rawData);

            // Intentar INSERT primero
            const { error: insertError } = await supabase
              .from(item.table_name)
              .insert(data);

            // Si el registro ya existe (error de duplicado), convertir a UPDATE
            if (insertError) {
              if (insertError.code === '23505' || insertError.message?.includes('duplicate')) {
                console.log(`[DatabaseAdapter] ⚠️ Registro duplicado, convirtiendo INSERT a UPDATE`);
                const { error: updateError } = await supabase
                  .from(item.table_name)
                  .update(data)
                  .eq('id', item.record_id);

                if (updateError) throw updateError;
              } else {
                throw insertError;
              }
            }
          } else if (item.operation === 'UPDATE') {
            const rawData = item.data ? JSON.parse(item.data) : {};
            const data = this.cleanDataForSupabase(item.table_name, rawData);

            // Intentar UPDATE primero
            const { error: updateError, count } = await supabase
              .from(item.table_name)
              .update(data)
              .eq('id', item.record_id);

            // Si no hay error pero tampoco se actualizó nada, el registro no existe
            if (!updateError && count === 0) {
              console.log(`[DatabaseAdapter] ⚠️ Registro no existe, convirtiendo UPDATE a INSERT`);

              // Obtener el registro completo desde SQLite local
              const pkField = item.table_name === 'config' ? 'key' : 'id';
              const fullRecord = await sqliteClient.query(
                `SELECT * FROM ${item.table_name} WHERE ${pkField} = ? LIMIT 1`,
                [item.record_id]
              );

              if (!fullRecord || fullRecord.length === 0) {
                throw new Error(`No se pudo obtener el registro completo de ${item.table_name} con ${pkField}=${item.record_id}`);
              }

              // Limpiar el registro completo para Supabase
              const fullData = this.cleanDataForSupabase(item.table_name, fullRecord[0]);

              const { error: insertError } = await supabase
                .from(item.table_name)
                .insert(fullData);

              if (insertError) throw insertError;
            } else if (updateError) {
              throw updateError;
            }
          } else if (item.operation === 'DELETE') {
            const { error } = await supabase
              .from(item.table_name)
              .delete()
              .eq('id', item.record_id);

            // Para DELETE, si el registro no existe, considerarlo exitoso
            if (error && !error.message?.includes('no rows')) {
              throw error;
            }
          }

          // Marcar como sincronizado
          await sqliteClient.run(
            'UPDATE sync_queue SET synced = 1, synced_at = ? WHERE id = ?',
            [new Date().toISOString(), item.id]
          );

          console.log(`[DatabaseAdapter] ✅ Sincronizado: ${item.operation} ${item.table_name}`);
        } catch (error) {
          // Incrementar intentos y guardar error con información detallada
          let errorMessage = 'Error desconocido';

          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null) {
            // Si el error es un objeto de Supabase, extraer información útil
            const err = error as any;
            if (err.message) {
              errorMessage = err.message;
            } else if (err.error) {
              errorMessage = JSON.stringify(err.error);
            } else {
              errorMessage = JSON.stringify(error);
            }
          } else if (error) {
            errorMessage = String(error);
          }

          await sqliteClient.run(
            'UPDATE sync_queue SET attempts = attempts + 1, last_error = ? WHERE id = ?',
            [errorMessage, item.id]
          );

          console.error(`[DatabaseAdapter] ❌ Error sincronizando item ${item.id}:`);
          console.error(`  Operation: ${item.operation} on ${item.table_name}`);
          console.error(`  Record ID: ${item.record_id}`);
          console.error(`  Data:`, item.data ? JSON.parse(item.data) : null);
          console.error(`  Error:`, error);
          console.error(`  Error type:`, typeof error);
          console.error(`  Error message:`, errorMessage);
        }
      }

      console.log('[DatabaseAdapter] Sincronización completada');
    } catch (error) {
      console.error('[DatabaseAdapter] Error en sincronización:', error);
    }
  }

  /**
   * Obtener estado de la cola de sincronización
   */
  async getSyncQueueStatus(): Promise<{
    pending: number;
    synced: number;
    failed: number;
  }> {
    if (!sqliteClient.isAvailable()) {
      return { pending: 0, synced: 0, failed: 0 };
    }

    try {
      const [pendingResult] = await sqliteClient.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM sync_queue WHERE synced = 0 AND attempts < 3'
      );

      const [syncedResult] = await sqliteClient.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM sync_queue WHERE synced = 1'
      );

      const [failedResult] = await sqliteClient.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM sync_queue WHERE synced = 0 AND attempts >= 3'
      );

      return {
        pending: pendingResult?.count || 0,
        synced: syncedResult?.count || 0,
        failed: failedResult?.count || 0,
      };
    } catch (error) {
      console.error('[DatabaseAdapter] Error obteniendo estado de cola:', error);
      return { pending: 0, synced: 0, failed: 0 };
    }
  }

  /**
   * Sincronizar cambios desde Supabase a SQLite (Supabase → SQLite)
   * Descarga cambios remotos a la base de datos local
   */
  async syncFromSupabase(): Promise<{
    success: boolean;
    tablesUpdated: string[];
    recordsUpdated: number;
    error?: string;
  }> {
    // Solo sincronizar si estamos en Electron
    if (!sqliteClient.isAvailable()) {
      return {
        success: false,
        tablesUpdated: [],
        recordsUpdated: 0,
        error: 'Sincronización solo disponible en Electron',
      };
    }

    // IMPORTANTE: No intentar sincronizar si estamos offline
    // Esto evita errores innecesarios cuando no hay conexión a internet
    if (!connectionMonitor.isOnline()) {
      console.log('[DatabaseAdapter] ⏸️ Sincronización pausada - modo offline');
      return {
        success: true, // No es un error, es comportamiento esperado
        tablesUpdated: [],
        recordsUpdated: 0,
      };
    }

    console.log('[DatabaseAdapter] 🔄 Iniciando sincronización Supabase → SQLite...');

    try {
      const supabase = createClient();
      const tablesUpdated: string[] = [];
      let totalRecordsUpdated = 0;

      // Tablas a sincronizar (en orden de dependencias)
      const tablesToSync = ['users', 'customers', 'products', 'config'];

      for (const table of tablesToSync) {
        try {
          console.log(`[DatabaseAdapter] Sincronizando tabla: ${table}`);

          // Tablas que NO tienen updated_at
          const tablesWithoutUpdatedAt = ['config', 'cash_registers', 'sale_items'];

          // Obtener todos los registros de Supabase
          let query = supabase.from(table).select('*');

          // Solo ordenar por updated_at si la tabla lo tiene
          if (!tablesWithoutUpdatedAt.includes(table)) {
            query = query.order('updated_at', { ascending: false });
          }

          const { data: remoteRecords, error } = await query;

          if (error) {
            // Si el error es por conexión, no loguearlo como error grave
            if (error.message?.includes('fetch') || error.message?.includes('network')) {
              console.log(`[DatabaseAdapter] ⏸️ Sin conexión para sincronizar ${table}`);
            } else {
              console.warn(`[DatabaseAdapter] Error obteniendo ${table}:`, error);
            }
            continue;
          }

          if (!remoteRecords || remoteRecords.length === 0) {
            console.log(`[DatabaseAdapter] No hay registros en ${table}`);
            continue;
          }

          // Obtener registros locales
          const localRecords = await sqliteClient.query<any>(
            `SELECT * FROM ${table}`
          );

          // Crear mapa de registros locales por ID (o key para config)
          const pkField = table === 'config' ? 'key' : 'id';
          const localMap = new Map(localRecords.map(r => [r[pkField], r]));

          let updatedCount = 0;

          for (const remoteRecord of remoteRecords) {
            const pkValue = remoteRecord[pkField];
            const localRecord = localMap.get(pkValue);

            // Limpiar datos de Supabase para que coincidan con el schema de SQLite
            const cleanedData = this.cleanDataForSQLite(table, remoteRecord);

            // Si no existe localmente, insertarlo
            if (!localRecord) {
              const columns = Object.keys(cleanedData);
              const placeholders = columns.map(() => '?').join(', ');
              const values = columns.map(col => cleanedData[col]);

              await sqliteClient.run(
                `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
                values
              );

              updatedCount++;
              console.log(`[DatabaseAdapter] ✅ Insertado ${table}:`, pkValue);
            }
            // Si existe y está desactualizado, actualizarlo
            else {
              // Solo comparar updated_at si la tabla lo tiene
              const shouldUpdate = tablesWithoutUpdatedAt.includes(table)
                ? true // Para tablas sin updated_at, siempre actualizar
                : (remoteRecord.updated_at &&
                   localRecord.updated_at &&
                   new Date(remoteRecord.updated_at) > new Date(localRecord.updated_at));

              if (shouldUpdate) {
                const columns = Object.keys(cleanedData).filter(col => col !== pkField);
                const setClause = columns.map(col => `${col} = ?`).join(', ');
                const values = [...columns.map(col => cleanedData[col]), cleanedData[pkField]];

                await sqliteClient.run(
                  `UPDATE ${table} SET ${setClause} WHERE ${pkField} = ?`,
                  values
                );

                updatedCount++;
                console.log(`[DatabaseAdapter] ✅ Actualizado ${table}:`, pkValue);
              }
            }
          }

          if (updatedCount > 0) {
            tablesUpdated.push(table);
            totalRecordsUpdated += updatedCount;
            console.log(`[DatabaseAdapter] 📊 ${table}: ${updatedCount} registros actualizados`);
          }
        } catch (error) {
          console.error(`[DatabaseAdapter] Error sincronizando tabla ${table}:`, error);
        }
      }

      console.log('[DatabaseAdapter] ✅ Sincronización completada:', {
        tablesUpdated,
        recordsUpdated: totalRecordsUpdated,
      });

      return {
        success: true,
        tablesUpdated,
        recordsUpdated: totalRecordsUpdated,
      };
    } catch (error) {
      console.error('[DatabaseAdapter] ❌ Error en sincronización desde Supabase:', error);
      return {
        success: false,
        tablesUpdated: [],
        recordsUpdated: 0,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  /**
   * Sincronización bidireccional completa
   * Sincroniza tanto local → nube como nube → local
   */
  async syncBidirectional(): Promise<void> {
    console.log('[DatabaseAdapter] 🔄 Iniciando sincronización bidireccional...');

    // 1. Subir cambios locales a Supabase
    await this.syncQueue();

    // 2. Descargar cambios remotos a SQLite
    await this.syncFromSupabase();

    console.log('[DatabaseAdapter] ✅ Sincronización bidireccional completada');
  }

  /**
   * Limpiar items sincronizados de la cola (más de 7 días) y items con errores
   */
  async cleanSyncQueue(): Promise<void> {
    if (!sqliteClient.isAvailable()) return;

    try {
      // Limpiar items sincronizados hace más de 7 días
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      await sqliteClient.run(
        'DELETE FROM sync_queue WHERE synced = 1 AND synced_at < ?',
        [sevenDaysAgo.toISOString()]
      );

      // Limpiar items que han fallado 3 o más veces (probablemente datos inválidos)
      await sqliteClient.run(
        'DELETE FROM sync_queue WHERE synced = 0 AND attempts >= 3'
      );

      console.log('[DatabaseAdapter] ✅ Cola de sincronización limpiada');
    } catch (error) {
      console.error('[DatabaseAdapter] Error limpiando cola:', error);
    }
  }

  /**
   * Limpiar TODA la cola pendiente (resetear completamente)
   */
  async resetSyncQueue(): Promise<void> {
    if (!sqliteClient.isAvailable()) return;

    try {
      await sqliteClient.run(
        'DELETE FROM sync_queue WHERE synced = 0'
      );

      console.log('[DatabaseAdapter] ⚠️ Cola de sincronización reseteada completamente');
    } catch (error) {
      console.error('[DatabaseAdapter] Error reseteando cola:', error);
    }
  }
}

// Singleton instance
export const databaseAdapter = new DatabaseAdapter();

/**
 * SQLite Client
 * Cliente para comunicarse con la base de datos SQLite en Electron
 * Usa IPC para enviar queries al proceso principal
 */

interface SQLiteQueryResult {
  success: boolean;
  data?: unknown[];
  changes?: number;
  lastInsertRowid?: number | bigint;
  error?: string;
}

class SQLiteClient {
  /**
   * Verificar si estamos en Electron
   */
  isAvailable(): boolean {
    const hasWindow = typeof window !== 'undefined';
    const hasElectronAPI = hasWindow && !!window.electronAPI;
    const isElectronFlag = hasElectronAPI && window.electronAPI.isElectron === true;

    console.log('[SQLiteClient] isAvailable check:', {
      hasWindow,
      hasElectronAPI,
      isElectronFlag,
      electronAPI: hasWindow ? window.electronAPI : 'no window'
    });

    return isElectronFlag;
  }

  /**
   * Ejecutar query SELECT
   */
  async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    console.log('[SQLiteClient] query() llamado');
    console.log('[SQLiteClient] isAvailable:', this.isAvailable());

    if (!this.isAvailable()) {
      console.error('[SQLiteClient] ❌ SQLite no disponible - no estamos en Electron');
      throw new Error('SQLite no disponible: no estamos en Electron');
    }

    try {
      console.log('[SQLiteClient] ✅ Ejecutando query via IPC:', sql.substring(0, 100), params);

      const result = await window.electronAPI!.db.query(sql, params);

      console.log('[SQLiteClient] Resultado IPC completo:', JSON.stringify(result, null, 2));
      console.log('[SQLiteClient] result.success:', result.success);
      console.log('[SQLiteClient] result.data type:', typeof result.data);
      console.log('[SQLiteClient] result.data:', result.data);
      console.log('[SQLiteClient] result.error:', result.error);

      if (!result.success) {
        console.error('[SQLiteClient] ❌ Query falló:', result.error);
        throw new Error(result.error || 'Error desconocido en SQLite');
      }

      if (!result.data) {
        console.error('[SQLiteClient] ⚠️ Query exitosa pero result.data es undefined/null');
        return [];
      }

      console.log('[SQLiteClient] ✅ Query exitosa. Rows:', result.data.length);
      if (result.data.length > 0) {
        console.log('[SQLiteClient] ✅ Primer usuario:', result.data[0]);
      }
      return result.data as T[];
    } catch (error) {
      console.error('[SQLiteClient] ❌ Error en query:', error);
      console.error('[SQLiteClient] ❌ Error type:', typeof error);
      console.error('[SQLiteClient] ❌ Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw error;
    }
  }

  /**
   * Ejecutar query INSERT/UPDATE/DELETE
   */
  async run(sql: string, params: unknown[] = []): Promise<{
    changes: number;
    lastInsertRowid: number | bigint;
  }> {
    if (!this.isAvailable()) {
      throw new Error('SQLite no disponible: no estamos en Electron');
    }

    try {
      console.log('[SQLite] Run:', sql.substring(0, 100), params);

      const result = await window.electronAPI!.db.query(sql, params);

      if (!result.success) {
        throw new Error(result.error || 'Error desconocido en SQLite');
      }

      return {
        changes: result.changes || 0,
        lastInsertRowid: result.lastInsertRowid || 0,
      };
    } catch (error) {
      console.error('[SQLite] Error en run:', error);
      throw error;
    }
  }

  /**
   * Ejecutar múltiples queries en transacción
   * Nota: Por ahora ejecuta secuencialmente, en el futuro se puede optimizar
   */
  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    if (!this.isAvailable()) {
      throw new Error('SQLite no disponible: no estamos en Electron');
    }

    try {
      // Iniciar transacción
      await this.run('BEGIN TRANSACTION');

      // Ejecutar callback
      const result = await callback();

      // Commit
      await this.run('COMMIT');

      return result;
    } catch (error) {
      // Rollback en caso de error
      try {
        await this.run('ROLLBACK');
      } catch (rollbackError) {
        console.error('[SQLite] Error en rollback:', rollbackError);
      }

      throw error;
    }
  }

  /**
   * Insertar registro y retornar el ID
   */
  async insert<T extends { id: string }>(
    table: string,
    data: Omit<T, 'created_at' | 'updated_at'>
  ): Promise<string> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map(() => '?').join(', ');

    const sql = `
      INSERT INTO ${table} (${columns.join(', ')})
      VALUES (${placeholders})
    `;

    await this.run(sql, values);

    // Retornar el ID (asumimos que data tiene un id)
    return (data as T).id;
  }

  /**
   * Actualizar registro
   */
  async update<T>(
    table: string,
    id: string,
    data: Partial<Omit<T, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<void> {
    const columns = Object.keys(data);
    const values = Object.values(data);

    const setClause = columns.map(col => `${col} = ?`).join(', ');

    const sql = `
      UPDATE ${table}
      SET ${setClause}
      WHERE id = ?
    `;

    await this.run(sql, [...values, id]);
  }

  /**
   * Eliminar registro
   */
  async delete(table: string, id: string): Promise<void> {
    const sql = `DELETE FROM ${table} WHERE id = ?`;
    await this.run(sql, [id]);
  }

  /**
   * Obtener un registro por ID
   */
  async getById<T>(table: string, id: string): Promise<T | null> {
    const sql = `SELECT * FROM ${table} WHERE id = ? LIMIT 1`;
    const results = await this.query<T>(sql, [id]);
    return results[0] || null;
  }

  /**
   * Obtener todos los registros de una tabla
   */
  async getAll<T>(table: string): Promise<T[]> {
    const sql = `SELECT * FROM ${table}`;
    return this.query<T>(sql);
  }
}

// Singleton instance
export const sqliteClient = new SQLiteClient();

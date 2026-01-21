/**
 * Database Layer
 * Exporta la capa de abstracción de base de datos
 *
 * IMPORTANTE: Los hooks de React (useRealtimeSync, etc.) NO se exportan aquí
 * para evitar conflictos con Server Components. Impórtalos directamente desde:
 * import { useRealtimeSync } from '@/lib/database/useRealtimeSync'
 */

export { databaseAdapter } from './adapter';
export { sqliteClient } from './sqlite-client';
export { connectionMonitor } from './connection-monitor';
export { realtimeSync } from './realtime-sync';
export { RealtimeSyncProvider } from './RealtimeSyncProvider';

// Types (safe to export, no runtime code)
export type { DatabaseMode } from './adapter';
export type { RealtimeSyncEvent } from './useRealtimeSync';

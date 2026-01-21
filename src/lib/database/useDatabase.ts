/**
 * useDatabase Hook
 * Hook para acceder al estado de la base de datos y conexión
 */

import { useState, useEffect } from 'react';
import { databaseAdapter } from './adapter';
import { connectionMonitor } from './connection-monitor';
import { sqliteClient } from './sqlite-client';

interface DatabaseStatus {
  isOnline: boolean;
  isElectron: boolean;
  currentDatabase: 'sqlite' | 'supabase';
  syncQueueStatus: {
    pending: number;
    synced: number;
    failed: number;
  };
}

export function useDatabase() {
  // Estado inicial: determinar base de datos igual que el adapter
  const initialIsElectron = sqliteClient.isAvailable();
  const initialIsOnline = connectionMonitor.isOnline();
  const initialDatabase = initialIsElectron ? 'sqlite' : (initialIsOnline ? 'supabase' : 'sqlite');

  const [status, setStatus] = useState<DatabaseStatus>({
    isOnline: initialIsOnline,
    isElectron: initialIsElectron,
    currentDatabase: initialDatabase,
    syncQueueStatus: {
      pending: 0,
      synced: 0,
      failed: 0,
    },
  });

  useEffect(() => {
    // Actualizar estado inicial
    updateStatus();

    // Suscribirse a cambios de conexión
    const unsubscribe = connectionMonitor.subscribe((connectionStatus) => {
      updateStatus();
    });

    // Actualizar cada 10 segundos
    const interval = setInterval(() => {
      updateStatus();
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  async function updateStatus() {
    const isOnline = connectionMonitor.isOnline();
    const isElectron = sqliteClient.isAvailable();

    // La lógica debe coincidir con DatabaseAdapter.getCurrentDatabase()
    // PRIORIDAD 1: Si Electron está disponible, usar SQLite (sin importar si estamos online)
    // PRIORIDAD 2: Si no hay Electron pero estamos online, usar Supabase
    const currentDatabase = isElectron ? 'sqlite' : (isOnline ? 'supabase' : 'sqlite');

    let syncQueueStatus = {
      pending: 0,
      synced: 0,
      failed: 0,
    };

    if (isElectron) {
      syncQueueStatus = await databaseAdapter.getSyncQueueStatus();
    }

    setStatus({
      isOnline,
      isElectron,
      currentDatabase,
      syncQueueStatus,
    });
  }

  return {
    ...status,
    adapter: databaseAdapter,
    syncQueue: () => databaseAdapter.syncQueue(),
    syncFromSupabase: () => databaseAdapter.syncFromSupabase(),
    syncBidirectional: () => databaseAdapter.syncBidirectional(),
    cleanQueue: () => databaseAdapter.cleanSyncQueue(),
    resetQueue: () => databaseAdapter.resetSyncQueue(),
  };
}

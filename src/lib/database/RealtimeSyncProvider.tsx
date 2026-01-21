/**
 * RealtimeSyncProvider
 * Inicializa la sincronización en tiempo real cuando la app carga
 */

'use client';

import { useEffect, useState } from 'react';
import { realtimeSync } from './realtime-sync';
import { connectionMonitor } from './connection-monitor';
import { sqliteClient } from './sqlite-client';

export function RealtimeSyncProvider({ children }: { children: React.ReactNode }) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Solo inicializar si estamos en Electron
    if (!sqliteClient.isAvailable()) {
      console.log('[RealtimeSyncProvider] No disponible: no estamos en Electron');
      return;
    }

    // Inicializar realtime sync
    const init = async () => {
      try {
        await realtimeSync.initialize();
        setInitialized(true);
      } catch (error) {
        console.error('[RealtimeSyncProvider] Error al inicializar:', error);
      }
    };

    init();

    // Cleanup al desmontar
    return () => {
      realtimeSync.destroy();
    };
  }, []);

  return <>{children}</>;
}

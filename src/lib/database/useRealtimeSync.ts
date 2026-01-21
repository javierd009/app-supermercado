/**
 * useRealtimeSync Hook
 * Hook para escuchar cambios en tiempo real de Supabase
 */

import { useEffect } from 'react';

export type RealtimeSyncEvent =
  | 'product-created'
  | 'product-updated'
  | 'product-deleted'
  | 'config-updated'
  | 'config-deleted'
  | 'customer-updated'
  | 'customer-deleted';

interface RealtimeSyncEventDetail {
  type: RealtimeSyncEvent;
  data: any;
}

/**
 * Hook para escuchar eventos de sincronización en tiempo real
 *
 * @example
 * useRealtimeSync('product-updated', (data) => {
 *   console.log('Producto actualizado:', data);
 *   refetchProducts(); // Re-cargar productos
 * });
 *
 * @example
 * useRealtimeSync('config-updated', (data) => {
 *   if (data.key === 'exchange_rate') {
 *     setExchangeRate(parseFloat(data.value));
 *   }
 * });
 */
export function useRealtimeSync(
  eventType: RealtimeSyncEvent | RealtimeSyncEvent[],
  callback: (data: any) => void
) {
  useEffect(() => {
    const events = Array.isArray(eventType) ? eventType : [eventType];

    const handler = (event: CustomEvent<RealtimeSyncEventDetail>) => {
      const { type, data } = event.detail;

      if (events.includes(type)) {
        callback(data);
      }
    };

    // Suscribirse al evento
    window.addEventListener('realtime-sync', handler as EventListener);

    // Cleanup
    return () => {
      window.removeEventListener('realtime-sync', handler as EventListener);
    };
  }, [eventType, callback]);
}

/**
 * Hook para escuchar todos los cambios en productos
 */
export function useProductsRealtimeSync(callback: (data: any) => void) {
  useRealtimeSync(['product-created', 'product-updated', 'product-deleted'], callback);
}

/**
 * Hook para escuchar todos los cambios en configuración
 */
export function useConfigRealtimeSync(callback: (data: any) => void) {
  useRealtimeSync(['config-updated', 'config-deleted'], callback);
}

/**
 * Hook para escuchar todos los cambios en clientes
 */
export function useCustomersRealtimeSync(callback: (data: any) => void) {
  useRealtimeSync(['customer-updated', 'customer-deleted'], callback);
}

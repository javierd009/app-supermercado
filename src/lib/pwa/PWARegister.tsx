'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from './registerServiceWorker';

/**
 * Componente para registrar el Service Worker
 * Debe incluirse en el layout root
 */
export function PWARegister() {
  useEffect(() => {
    // Solo registrar en producción o si está habilitado explícitamente
    if (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_PWA === 'true') {
      registerServiceWorker();
    }
  }, []);

  return null; // No renderiza nada
}

/**
 * Registro del Service Worker para PWA
 * Se ejecuta en el cliente para habilitar funcionalidad offline
 */

export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.log('[PWA] Service Worker not supported');
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('[PWA] Service Worker registered successfully:', registration.scope);

      // Escuchar actualizaciones del SW
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // Hay una actualización disponible
            console.log('[PWA] Nueva versión disponible');

            // Opcional: Mostrar notificación al usuario
            if (confirm('Hay una nueva versión disponible. ¿Desea actualizar?')) {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
              window.location.reload();
            }
          }
        });
      });

      // Controlar cuando el SW toma control
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    } catch (error) {
      console.error('[PWA] Service Worker registration failed:', error);
    }
  });
}

/**
 * Desregistrar Service Worker (para desarrollo)
 */
export async function unregisterServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const registrations = await navigator.serviceWorker.getRegistrations();
  for (const registration of registrations) {
    await registration.unregister();
  }
  console.log('[PWA] Service Worker unregistered');
}

/**
 * Limpiar cache de la PWA
 */
export async function clearPWACache() {
  if (typeof window === 'undefined') return;

  const registration = await navigator.serviceWorker.ready;
  registration.active?.postMessage({ type: 'CLEAR_CACHE' });
  console.log('[PWA] Cache cleared');
}

/**
 * Connection Monitor
 * Detecta el estado de la conexión a internet y a Supabase
 */

type ConnectionStatus = 'online' | 'offline';

type ConnectionCallback = (status: ConnectionStatus) => void;

class ConnectionMonitor {
  private status: ConnectionStatus = 'online';
  private listeners: Set<ConnectionCallback> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL_MS = 5000; // 5 segundos
  private initialized = false;

  constructor() {
    // Solo inicializar en el cliente
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  private initialize() {
    if (this.initialized) return;
    this.initialized = true;

    // En Electron, siempre asumir online porque usamos SQLite local
    const hasWindow = typeof window !== 'undefined';
    const hasElectronAPI = hasWindow && !!(window as any).electronAPI;
    const isElectronValue = hasElectronAPI ? (window as any).electronAPI.isElectron : undefined;
    const isElectron = isElectronValue === true;

    console.log('[ConnectionMonitor] initialize() - Verificación de entorno:', {
      hasWindow,
      hasElectronAPI,
      isElectronValue,
      isElectron,
      electronAPI: hasWindow ? (window as any).electronAPI : 'no window'
    });

    if (isElectron) {
      console.log('[ConnectionMonitor] ✅ Electron detectado - modo siempre online (SQLite local)');
      this.updateStatus('online');
    } else {
      // Detectar estado inicial en web
      const navigatorOnline = hasWindow && navigator.onLine;
      console.log('[ConnectionMonitor] ⚠️ No es Electron - usando navigator.onLine:', navigatorOnline);
      this.updateStatus(navigatorOnline ? 'online' : 'offline');
    }

    // Escuchar eventos del navegador
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Iniciar verificación periódica
    this.startPeriodicCheck();
  }

  /**
   * Obtener estado actual de conexión
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  /**
   * Verificar si está online
   */
  isOnline(): boolean {
    return this.status === 'online';
  }

  /**
   * Suscribirse a cambios de estado
   */
  subscribe(callback: ConnectionCallback): () => void {
    this.listeners.add(callback);

    // Retornar función de desuscripción
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Actualizar estado y notificar listeners
   */
  private updateStatus(newStatus: ConnectionStatus) {
    if (this.status !== newStatus) {
      const oldStatus = this.status;
      this.status = newStatus;

      console.log(`[ConnectionMonitor] Estado cambió: ${oldStatus} → ${newStatus}`);

      // Notificar a todos los listeners
      this.listeners.forEach(callback => {
        try {
          callback(newStatus);
        } catch (error) {
          console.error('[ConnectionMonitor] Error en callback:', error);
        }
      });
    }
  }

  /**
   * Handler cuando se detecta conexión
   */
  private handleOnline() {
    console.log('[ConnectionMonitor] Evento: online');
    this.verifyConnection();
  }

  /**
   * Handler cuando se pierde conexión
   */
  private handleOffline() {
    console.log('[ConnectionMonitor] Evento: offline');
    this.updateStatus('offline');
  }

  /**
   * Verificar conexión real (no solo navigator.onLine)
   */
  private async verifyConnection(): Promise<void> {
    if (typeof window === 'undefined') return;

    // En Electron, siempre reportar online porque usamos SQLite local
    const hasElectronAPI = !!(window as any).electronAPI;
    const isElectronValue = hasElectronAPI ? (window as any).electronAPI.isElectron : undefined;
    const isElectron = isElectronValue === true;

    console.log('[ConnectionMonitor] verifyConnection() - Check Electron:', {
      hasElectronAPI,
      isElectronValue,
      isElectron
    });

    if (isElectron) {
      // En Electron, SIEMPRE online porque trabajamos con SQLite local
      // La sincronización en segundo plano es opcional y no afecta la operación
      console.log('[ConnectionMonitor] ✅ Electron confirmado - estableciendo online');
      this.updateStatus('online');
      return;
    }

    try {
      // En web, intentar hacer ping a Supabase
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 segundos timeout

      const response = await fetch('https://sjtiqfdwgdepdhzejqlz.supabase.co/rest/v1/', {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Si llega aquí, hay conexión
      this.updateStatus('online');
    } catch (error) {
      // Si falla, no hay conexión real
      console.warn('[ConnectionMonitor] No se pudo conectar a Supabase:', error);
      this.updateStatus('offline');
    }
  }

  /**
   * Iniciar verificación periódica
   */
  private startPeriodicCheck() {
    if (typeof window === 'undefined') return;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }

    this.checkInterval = setInterval(() => {
      if (navigator.onLine) {
        this.verifyConnection();
      } else {
        this.updateStatus('offline');
      }
    }, this.CHECK_INTERVAL_MS);
  }

  /**
   * Detener verificación periódica
   */
  destroy() {
    if (typeof window === 'undefined') return;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    window.removeEventListener('online', () => this.handleOnline());
    window.removeEventListener('offline', () => this.handleOffline());

    this.listeners.clear();
  }
}

// Singleton instance
export const connectionMonitor = new ConnectionMonitor();

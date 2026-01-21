/**
 * ConnectionStatus
 * Muestra estado de conexión y cola de sincronización
 */

'use client';

import { useState, useEffect } from 'react';
import { useDatabase } from '@/lib/database/useDatabase';
import { Wifi, WifiOff, Database, Cloud, AlertCircle } from 'lucide-react';

export function ConnectionStatus() {
  const { isOnline, isElectron, currentDatabase, syncQueueStatus, syncBidirectional, resetQueue } = useDatabase();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncMessage, setSyncMessage] = useState<string>('');

  // Evitar hidratation mismatch - solo renderizar después del montaje
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Auto-sincronización cada 5 minutos
  useEffect(() => {
    if (!isElectron) return;

    const autoSync = async () => {
      try {
        await syncBidirectional();
        setLastSyncTime(new Date());
        console.log('[ConnectionStatus] ✓ Sincronización automática completada');
      } catch (error) {
        console.error('[ConnectionStatus] Error en auto-sincronización:', error);
      }
    };

    // Sincronizar al montar
    autoSync();

    // Sincronizar cada 5 minutos
    const interval = setInterval(autoSync, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isElectron, syncBidirectional]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage('Sincronizando...');
    try {
      await syncBidirectional();
      setLastSyncTime(new Date());
      setSyncMessage('✓ Sincronización completada exitosamente');
      setTimeout(() => setSyncMessage(''), 3000);
    } catch (error) {
      setSyncMessage('✗ Error en sincronización');
      setTimeout(() => setSyncMessage(''), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetQueue = async () => {
    if (!confirm('¿Estás seguro de limpiar toda la cola de sincronización? Los cambios pendientes se perderán.')) {
      return;
    }

    try {
      await resetQueue();
      setSyncMessage('✓ Cola limpiada exitosamente');
      setTimeout(() => setSyncMessage(''), 3000);
    } catch (error) {
      setSyncMessage('✗ Error al limpiar cola');
      setTimeout(() => setSyncMessage(''), 3000);
    }
  };

  // IMPORTANTE: Retornar el mismo HTML en servidor y cliente para evitar hydration mismatch
  // Solo ocultar con CSS en vez de retornar null
  const shouldShow = isMounted && isElectron;

  // Si no debemos mostrar, retornar un div invisible para evitar hydration error
  if (!shouldShow) {
    return <div className="hidden" aria-hidden="true" />;
  }

  const hasPending = syncQueueStatus.pending > 0;
  const hasFailed = syncQueueStatus.failed > 0;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Botón compacto */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-xl border shadow-lg transition-all bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30"
      >
        <Cloud className="w-4 h-4" />
        <span className="text-sm font-medium">Sincronización</span>
        {hasPending && (
          <span className="flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-500 rounded-full">
            {syncQueueStatus.pending}
          </span>
        )}
      </button>

      {/* Panel expandido */}
      {isExpanded && (
        <div className="absolute bottom-14 right-0 w-80 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-4">
          {/* Título */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">
              Estado de Base de Datos
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-white/60 hover:text-white"
            >
              ✕
            </button>
          </div>

          {/* Estado de conexión */}
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg mb-3">
            <Database className="w-5 h-5 text-emerald-400" />
            <div className="flex-1">
              <div className="text-sm font-medium text-white">Modo Híbrido</div>
              <div className="text-xs text-white/60">
                SQLite local + Supabase en la nube
              </div>
            </div>
          </div>

          {/* Cola de sincronización */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-sm text-white/80">Pendientes:</span>
              <span className={`text-sm font-semibold ${hasPending ? 'text-blue-400' : 'text-white/60'}`}>
                {syncQueueStatus.pending}
              </span>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-white/10">
              <span className="text-sm text-white/80">Sincronizados:</span>
              <span className="text-sm font-semibold text-emerald-400">
                {syncQueueStatus.synced}
              </span>
            </div>

            {hasFailed && (
              <div className="flex items-center justify-between py-2 border-b border-white/10">
                <span className="text-sm text-white/80">Errores:</span>
                <span className="text-sm font-semibold text-red-400">
                  {syncQueueStatus.failed}
                </span>
              </div>
            )}
          </div>

          {/* Botones de sincronización */}
          <div className="space-y-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`w-full py-2 rounded-lg font-medium transition-all ${
                isSyncing
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isSyncing ? 'Sincronizando...' : '🔄 Sincronizar Ahora'}
            </button>

            {/* Botón para limpiar cola (solo si hay errores) */}
            {hasFailed && (
              <button
                onClick={handleResetQueue}
                className="w-full py-2 rounded-lg font-medium transition-all bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 text-xs"
              >
                🗑️ Limpiar Cola de Errores
              </button>
            )}
          </div>

          {/* Mensaje de sincronización */}
          {syncMessage && (
            <div className={`mt-2 p-2 rounded-lg text-xs text-center ${
              syncMessage.includes('✓') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
            }`}>
              {syncMessage}
            </div>
          )}

          {/* Última sincronización */}
          {lastSyncTime && (
            <div className="mt-2 text-xs text-center text-white/60">
              Última sync: {lastSyncTime.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}

          {/* Mensaje informativo */}
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-xs text-blue-300">
              ℹ️ Sincronización automática cada 5 minutos. Los cambios locales se suben a la nube y los cambios remotos se descargan automáticamente.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

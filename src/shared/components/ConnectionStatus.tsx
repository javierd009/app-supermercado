/**
 * ConnectionStatus
 * Muestra estado de conexión y cola de sincronización
 * Diseño compacto: círculo pequeño con nube
 */

'use client';

import { useState, useEffect } from 'react';
import { useDatabase } from '@/lib/database/useDatabase';
import { Cloud, CloudOff, Loader2, Check, X, AlertTriangle } from 'lucide-react';

export function ConnectionStatus() {
  const { isOnline, isElectron, syncQueueStatus, syncBidirectional, resetQueue } = useDatabase();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncMessage, setSyncMessage] = useState<string>('');
  const [showConfirm, setShowConfirm] = useState(false);

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
      } catch (error) {
        console.error('[ConnectionStatus] Error en auto-sincronización:', error);
      }
    };

    autoSync();
    const interval = setInterval(autoSync, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isElectron, syncBidirectional]);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    try {
      await syncBidirectional();
      setLastSyncTime(new Date());
      setSyncMessage('ok');
      setTimeout(() => setSyncMessage(''), 2000);
    } catch (error) {
      setSyncMessage('error');
      setTimeout(() => setSyncMessage(''), 2000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetQueue = () => {
    setShowConfirm(true);
  };

  const confirmReset = async () => {
    setShowConfirm(false);
    try {
      await resetQueue();
      setSyncMessage('ok');
      setTimeout(() => setSyncMessage(''), 2000);
    } catch (error) {
      setSyncMessage('error');
      setTimeout(() => setSyncMessage(''), 2000);
    }
  };

  const shouldShow = isMounted && isElectron;

  if (!shouldShow) {
    return <div className="hidden" aria-hidden="true" />;
  }

  const hasPending = syncQueueStatus.pending > 0;
  const hasFailed = syncQueueStatus.failed > 0;

  // Determinar el estado del ícono
  const getIconState = () => {
    if (isSyncing) return 'syncing';
    if (syncMessage === 'ok') return 'success';
    if (syncMessage === 'error' || hasFailed) return 'error';
    if (hasPending) return 'pending';
    return 'idle';
  };

  const iconState = getIconState();

  // Colores según estado
  const getButtonStyles = () => {
    switch (iconState) {
      case 'syncing':
        return 'bg-blue-500/30 border-blue-400/50 text-blue-400';
      case 'success':
        return 'bg-emerald-500/30 border-emerald-400/50 text-emerald-400';
      case 'error':
        return 'bg-red-500/30 border-red-400/50 text-red-400';
      case 'pending':
        return 'bg-amber-500/30 border-amber-400/50 text-amber-400';
      default:
        return 'bg-slate-700/50 border-slate-600/50 text-slate-400 hover:bg-slate-600/50';
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        {/* Botón circular compacto */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`relative flex items-center justify-center w-10 h-10 rounded-full border backdrop-blur-xl shadow-lg transition-all ${getButtonStyles()}`}
          title="Sincronización"
        >
          {isSyncing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : syncMessage === 'ok' ? (
            <Check className="w-5 h-5" />
          ) : syncMessage === 'error' ? (
            <X className="w-5 h-5" />
          ) : isOnline ? (
            <Cloud className="w-5 h-5" />
          ) : (
            <CloudOff className="w-5 h-5" />
          )}

          {/* Badge de pendientes */}
          {hasPending && !isSyncing && !syncMessage && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-amber-500 rounded-full">
              {syncQueueStatus.pending > 9 ? '9+' : syncQueueStatus.pending}
            </span>
          )}

          {/* Badge de errores */}
          {hasFailed && !hasPending && !isSyncing && !syncMessage && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
              !
            </span>
          )}
        </button>

        {/* Panel expandido */}
        {isExpanded && (
          <div className="absolute bottom-12 right-0 w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-3">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Cloud className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-white">Sincronización</span>
              </div>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-white/40 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {/* Estado */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-white/60">Pendientes</span>
                <span className={`font-semibold ${hasPending ? 'text-amber-400' : 'text-white/40'}`}>
                  {syncQueueStatus.pending}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 bg-white/5 rounded-lg">
                <span className="text-white/60">Sincronizados</span>
                <span className="font-semibold text-emerald-400">
                  {syncQueueStatus.synced}
                </span>
              </div>
            </div>

            {/* Errores si hay */}
            {hasFailed && (
              <div className="flex items-center justify-between p-2 mb-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs">
                <span className="text-red-400">Errores: {syncQueueStatus.failed}</span>
                <button
                  onClick={handleResetQueue}
                  className="text-red-300 hover:text-red-200 underline"
                >
                  Limpiar
                </button>
              </div>
            )}

            {/* Botón sincronizar */}
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className={`w-full py-2 rounded-lg text-xs font-medium transition-all ${
                isSyncing
                  ? 'bg-white/10 text-white/40 cursor-not-allowed'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              {isSyncing ? 'Sincronizando...' : 'Sincronizar ahora'}
            </button>

            {/* Última sincronización */}
            {lastSyncTime && (
              <div className="mt-2 text-[10px] text-center text-white/40">
                Última: {lastSyncTime.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Diálogo de confirmación personalizado */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}
          />
          <div className="relative bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="p-4 border-b border-white/10">
              <h3 className="text-base font-semibold text-white">Confirmar</h3>
            </div>
            <div className="p-6 flex flex-col items-center text-center">
              <AlertTriangle className="w-12 h-12 text-amber-400" />
              <p className="mt-4 text-white/80 text-sm">
                ¿Limpiar cola de sincronización? Los cambios pendientes se perderán.
              </p>
            </div>
            <div className="flex gap-3 p-4 border-t border-white/10 bg-white/5">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2 px-4 rounded-xl text-sm font-medium text-white/80 bg-white/10 hover:bg-white/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmReset}
                className="flex-1 py-2 px-4 rounded-xl text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Limpiar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

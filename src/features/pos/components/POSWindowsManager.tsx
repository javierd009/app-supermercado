'use client';

import { useState, useEffect } from 'react';
import { useWindowManager } from '../store/windowManager';
import { destroyPOSStore } from '../store/posStoreFactory';
import { POSWindowMulti } from './POSWindowMulti';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Plus, X, LayoutGrid, Clock, ShoppingCart, DollarSign, Sparkles, Home } from 'lucide-react';
import Link from 'next/link';

export function POSWindowsManager() {
  const { user } = useAuth();
  const { createWindow, closeWindow, getWindowsByUser } = useWindowManager();
  const [selectedWindowId, setSelectedWindowId] = useState<string | null>(null);

  // Filtrar ventanas solo del usuario actual
  const allWindows = user ? getWindowsByUser(user.id) : [];

  const handleOpenNewWindow = () => {
    if (!user) return; // Validar que hay usuario autenticado
    const windowId = createWindow(user.id);
    setSelectedWindowId(windowId);
  };

  const handleCloseWindow = (windowId: string) => {
    if (confirm('¿Cerrar esta ventana POS? Se perderá el carrito actual si no ha sido procesado.')) {
      closeWindow(windowId);
      destroyPOSStore(windowId);

      // Si cerramos la ventana seleccionada, seleccionar otra
      if (selectedWindowId === windowId) {
        const remaining = allWindows.filter(w => w.id !== windowId);
        setSelectedWindowId(remaining.length > 0 ? remaining[0].id : null);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-CR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // En móvil, crear automáticamente una ventana si no existe ninguna
  useEffect(() => {
    if (allWindows.length === 0 && user) {
      const windowId = createWindow(user.id);
      setSelectedWindowId(windowId);
    }
  }, [allWindows.length, user, createWindow]);

  // En móvil, seleccionar la primera ventana si no hay ninguna seleccionada
  useEffect(() => {
    if (!selectedWindowId && allWindows.length > 0) {
      setSelectedWindowId(allWindows[0].id);
    }
  }, [selectedWindowId, allWindows]);

  return (
    <div className="flex h-screen bg-[#020617] relative overflow-hidden">
      {/* Sidebar - Window Selector - Oculto en móvil */}
      <div className="hidden md:flex w-80 bg-white/5 backdrop-blur-3xl border-r border-white/10 flex-col relative z-10">
        {/* Header */}
        <div className="bg-white/10 border-b border-white/10 px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3 mb-2">
            <Link
              href="/dashboard"
              className="p-2 bg-gradient-to-tr from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl shadow-xl transition-all cursor-pointer hover:scale-105"
              title="Volver al Dashboard"
            >
              <Home className="w-5 h-5 text-white" />
            </Link>
            <div>
              <h1 className="text-base font-black text-white tracking-tight">VENTANAS POS</h1>
              <p className="text-[9px] font-black text-blue-400 uppercase tracking-wider">{allWindows.length} ventanas activas</p>
            </div>
          </div>
        </div>

        {/* New Window Button */}
        <div className="p-4 border-b border-white/5">
          <button
            onClick={handleOpenNewWindow}
            className="group w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 px-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
            <Plus className="w-5 h-5 relative z-10" />
            <span className="text-sm relative z-10">NUEVA VENTANA</span>
          </button>
        </div>

        {/* Windows List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {allWindows.length === 0 ? (
            <div className="p-6 text-center">
              <div className="bg-white/5 border border-white/10 p-6 mb-3 rounded-2xl backdrop-blur-xl inline-block">
                <LayoutGrid className="w-12 h-12 text-slate-500 mx-auto" />
              </div>
              <p className="text-xs font-black text-white uppercase tracking-wider mb-1">Sin ventanas activas</p>
              <p className="text-[10px] text-slate-500 font-medium">Abra una nueva ventana para atender clientes</p>
            </div>
          ) : (
            <div className="space-y-2 p-3">
              {allWindows.map((window) => (
                <div
                  key={window.id}
                  onClick={() => setSelectedWindowId(window.id)}
                  className={`p-4 cursor-pointer transition-all duration-300 rounded-xl backdrop-blur-xl relative overflow-hidden group ${
                    selectedWindowId === window.id
                      ? 'bg-blue-500/10 border-2 border-blue-500/50 shadow-xl'
                      : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {selectedWindowId === window.id && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-blue-500 to-indigo-600"></div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-black text-white text-sm mb-1">{window.title}</h3>
                      <p className="text-[9px] text-slate-500 font-mono">{window.id.substring(0, 12)}</p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCloseWindow(window.id);
                      }}
                      className="bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white p-1.5 rounded-lg text-xs font-bold transition-all duration-300 border border-rose-500/30 hover:border-rose-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] bg-white/5 px-2 py-1.5 rounded-lg">
                      <div className="flex items-center gap-1.5">
                        <ShoppingCart className="w-3 h-3 text-blue-400" />
                        <span className="text-slate-400 font-medium">Items:</span>
                      </div>
                      <span className="font-black text-white">{window.itemCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] bg-white/5 px-2 py-1.5 rounded-lg">
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3 h-3 text-blue-400" />
                        <span className="text-slate-400 font-medium">Total:</span>
                      </div>
                      <span className="font-black text-white">{formatCurrency(window.total || 0)}</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] bg-white/5 px-2 py-1.5 rounded-lg">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-blue-400" />
                        <span className="text-slate-400 font-medium">Creada:</span>
                      </div>
                      <span className="font-black text-white">{formatTime(window.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="bg-white/5 border-t border-white/10 px-4 py-3 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-medium">Sistema multi-ventana</span>
            <span className="font-mono font-black text-xs text-white">{allWindows.length}/10</span>
          </div>
        </div>
      </div>

      {/* Main Content - Selected Window */}
      <div className="flex-1 overflow-hidden relative z-10">
        {selectedWindowId ? (
          <POSWindowMulti
            windowId={selectedWindowId}
            onClose={() => handleCloseWindow(selectedWindowId)}
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-md">
              <div className="bg-white/5 border border-white/10 p-10 mb-6 rounded-3xl backdrop-blur-3xl inline-block relative overflow-hidden group">
                <LayoutGrid className="w-20 h-20 text-slate-600 mx-auto relative z-10" />
              </div>
              <h2 className="text-3xl font-black text-white mb-3 tracking-tight">Bienvenido al POS</h2>
              <p className="text-slate-400 mb-8 text-sm font-medium">Seleccione una ventana existente o abra una nueva para comenzar a atender clientes</p>
              <button
                onClick={handleOpenNewWindow}
                className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black py-3 px-8 rounded-xl transition-all duration-300 inline-flex items-center gap-3 shadow-2xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <Plus className="w-5 h-5 relative z-10" />
                <span className="text-sm relative z-10">ABRIR NUEVA VENTANA</span>
                <Sparkles className="w-4 h-4 relative z-10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}

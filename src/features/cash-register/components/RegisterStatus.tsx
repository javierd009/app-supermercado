'use client';

import { useState, useEffect } from 'react';
import { useCashRegister, useLoadCurrentRegister, useRegisterSummary } from '../hooks/useCashRegister';
import type { CashRegisterSummary } from '../types';

export function RegisterStatus() {
  useLoadCurrentRegister(); // Cargar caja al montar

  const { currentRegister, isOpen } = useCashRegister();
  const { getSummary } = useRegisterSummary();
  const [summary, setSummary] = useState<CashRegisterSummary | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cargar y actualizar resumen cada 5 segundos
  useEffect(() => {
    if (!currentRegister) return;

    const loadSummary = async () => {
      const data = await getSummary(currentRegister.id);
      setSummary(data);
    };

    loadSummary(); // Cargar inmediatamente

    // Auto-refresh cada 5 segundos
    const interval = setInterval(loadSummary, 5000);
    return () => clearInterval(interval);
  }, [currentRegister, getSummary]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-CR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const getTurnoDuration = () => {
    if (!currentRegister) return '0h 0m';
    const opened = new Date(currentRegister.openedAt);
    const diff = currentTime.getTime() - opened.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  if (!currentRegister || !isOpen) {
    return (
      <div className="bg-white/5 rounded-xl border border-white/10 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-white/5 rounded-lg">
            <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-black text-white uppercase">Caja Cerrada</h3>
            <p className="text-sm text-slate-500 font-medium">No hay turno activo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white/5 p-4 rounded-lg border border-white/5">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Turno Activo</p>
            <p className="font-black text-white">NO</p>
          </div>
          <div className="bg-white/5 p-4 rounded-lg border border-white/5">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Monto Inicial</p>
            <p className="font-black text-white">₡0.00</p>
          </div>
          <div className="bg-white/5 p-4 rounded-lg border border-white/5">
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Duración</p>
            <p className="font-black text-white">0h 0m</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
          <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-white uppercase">Caja Abierta</h3>
            <div className="flex items-center gap-2 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-emerald-400 uppercase">Operativa</span>
            </div>
          </div>
          <p className="text-sm text-slate-500 font-medium">Turno activo - Listo para procesar ventas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-3">
          <h4 className="text-[9px] font-bold text-blue-400 uppercase tracking-wide">Información del Turno</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="text-slate-500 font-medium">ID Caja:</span>
              <span className="font-black text-white font-mono">{currentRegister.id.substring(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="text-slate-500 font-medium">Apertura:</span>
              <span className="font-black text-white font-mono">{formatTime(currentRegister.openedAt)}</span>
            </div>
            <div className="flex justify-between bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="text-slate-500 font-medium">Duración:</span>
              <span className="font-black text-white">{getTurnoDuration()}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-[9px] font-bold text-blue-400 uppercase tracking-wide">Montos</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="text-slate-500 font-medium">Monto Inicial:</span>
              <span className="font-black text-white">{formatCurrency(currentRegister.initialAmount)}</span>
            </div>
            <div className="flex justify-between bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="text-slate-500 font-medium">Total Recaudado:</span>
              <span className="font-black text-emerald-400">{summary ? formatCurrency(summary.totalCash + summary.totalCard + summary.totalSinpe) : '₡0.00'}</span>
            </div>
            <div className="flex justify-between bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="text-slate-500 font-medium">Efectivo Actual:</span>
              <span className="font-black text-white">{summary ? formatCurrency(currentRegister.initialAmount + summary.totalCash) : formatCurrency(currentRegister.initialAmount)}</span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-[9px] font-bold text-blue-400 uppercase tracking-wide">Estadísticas</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="text-slate-500 font-medium">Ventas:</span>
              <span className="font-black text-white">{summary ? summary.salesCount : 0}</span>
            </div>
            <div className="flex justify-between bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="text-slate-500 font-medium">Transacciones:</span>
              <span className="font-black text-white">{summary ? summary.itemCount : 0} items</span>
            </div>
            <div className="flex justify-between bg-white/5 p-3 rounded-lg border border-white/5">
              <span className="text-slate-500 font-medium">Última Actualiz.:</span>
              <span className="font-black text-white font-mono">{currentTime.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

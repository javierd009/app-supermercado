'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useAllOpenRegisters, useAdminCloseRegister } from '@/features/cash-register/hooks/useCashRegister';
import {
  Home,
  LogOut,
  ArrowLeft,
  Landmark,
  RefreshCw,
  X,
  Clock,
  User,
  DollarSign,
  AlertTriangle
} from 'lucide-react';

export default function AdminRegistersPage() {
  const { user } = useAuth();
  const { registers, isLoading, error, loadAllOpenRegisters } = useAllOpenRegisters();
  const { adminCloseRegister } = useAdminCloseRegister();

  const [selectedRegister, setSelectedRegister] = useState<string | null>(null);
  const [closeAmount, setCloseAmount] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [closeError, setCloseError] = useState<string | null>(null);

  // Cargar cajas abiertas al montar
  useEffect(() => {
    loadAllOpenRegisters();
  }, []);

  // Verificar permisos
  if (user?.role !== 'admin' && user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acceso Denegado</h1>
          <p className="text-slate-400">Solo administradores pueden acceder a esta sección</p>
          <Link href="/dashboard" className="mt-4 inline-block text-blue-400 hover:underline">
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const handleCloseRegister = async () => {
    if (!selectedRegister || !closeAmount) return;

    setIsClosing(true);
    setCloseError(null);

    const amount = parseFloat(closeAmount);
    if (isNaN(amount) || amount < 0) {
      setCloseError('Monto inválido');
      setIsClosing(false);
      return;
    }

    const result = await adminCloseRegister(selectedRegister, amount, closeNotes);

    if (result.success) {
      setSelectedRegister(null);
      setCloseAmount('');
      setCloseNotes('');
      loadAllOpenRegisters(); // Recargar lista
    } else {
      setCloseError(result.error || 'Error al cerrar caja');
    }

    setIsClosing(false);
  };

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

  const getDuration = (openedAt: string) => {
    const opened = new Date(openedAt);
    const now = new Date();
    const diff = now.getTime() - opened.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Header */}
      <header className="min-h-[4.5rem] md:h-20 px-3 md:px-8 flex items-center justify-between border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-2 md:gap-6 flex-1 min-w-0">
          <Link href="/dashboard" className="flex-shrink-0 bg-gradient-to-br from-blue-600 to-indigo-700 p-2 md:p-2.5 rounded-xl border border-white/20 shadow-xl hover:scale-105 transition-transform">
            <Home className="h-4 w-4 md:h-5 md:w-5 text-white" />
          </Link>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 md:gap-2">
              <Landmark className="w-4 h-4 md:w-5 md:h-5 text-blue-500 flex-shrink-0" />
              <p className="text-base md:text-xl font-black text-white tracking-tight uppercase truncate">Cajas Abiertas</p>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider hidden sm:block">
              Control administrativo de cajas
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
          <button
            onClick={() => loadAllOpenRegisters()}
            disabled={isLoading}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-3 md:px-6 py-2.5 md:py-3 rounded-xl text-white font-bold text-xs md:text-sm transition-all flex items-center gap-1.5 md:gap-2 shadow-lg shadow-blue-500/30 uppercase tracking-wide disabled:opacity-50"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          <Link href="/dashboard" className="hidden md:block">
            <button className="px-4 py-2 bg-white/5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all border border-white/5 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide">Volver</span>
            </button>
          </Link>

          <Link href="/logout" className="hidden md:block">
            <button className="p-3 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-white/5">
              <LogOut className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Mensaje informativo */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Landmark className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-blue-400 mb-1">Control de Cajas</h3>
              <p className="text-sm text-blue-300">
                Aquí puede ver todas las cajas abiertas por todos los usuarios y cerrarlas si es necesario.
                Cada usuario solo puede tener una caja abierta a la vez.
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
            <p className="text-rose-400">{error}</p>
          </div>
        )}

        {/* Lista de cajas abiertas */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : registers.length === 0 ? (
          <div className="bg-white/5 rounded-xl border border-white/10 p-12 text-center">
            <Landmark className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">No hay cajas abiertas</h3>
            <p className="text-slate-400">Todas las cajas están cerradas en este momento</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {registers.map((register) => (
              <div
                key={register.id}
                className="bg-white/5 rounded-xl border border-white/10 p-6 hover:bg-white/[0.08] transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Info de la caja */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-emerald-500/20 rounded-lg">
                        <Landmark className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-lg">
                            {register.username}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 text-xs font-bold rounded-full uppercase">
                            Abierta
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono">
                          ID: {register.id.substring(0, 8)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs uppercase font-bold">Apertura</span>
                        </div>
                        <p className="font-bold text-white">{formatDateTime(register.openedAt)}</p>
                      </div>

                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="text-xs uppercase font-bold">Duración</span>
                        </div>
                        <p className="font-bold text-white">{getDuration(register.openedAt)}</p>
                      </div>

                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span className="text-xs uppercase font-bold">Monto Inicial</span>
                        </div>
                        <p className="font-bold text-emerald-400">{formatCurrency(register.initialAmount)}</p>
                      </div>

                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                          <User className="w-3.5 h-3.5" />
                          <span className="text-xs uppercase font-bold">Usuario</span>
                        </div>
                        <p className="font-bold text-white">{register.userId.substring(0, 8)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Botón cerrar */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => setSelectedRegister(register.id)}
                      className="w-full md:w-auto bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30"
                    >
                      <X className="w-4 h-4" />
                      Cerrar Caja
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal para cerrar caja */}
      {selectedRegister && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] rounded-2xl border border-white/10 max-w-md w-full p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/20 rounded-lg">
                  <Landmark className="w-5 h-5 text-rose-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Cerrar Caja (Admin)</h2>
              </div>
              <button
                onClick={() => {
                  setSelectedRegister(null);
                  setCloseError(null);
                }}
                className="p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {closeError && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                <p className="text-sm text-rose-400">{closeError}</p>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                  Monto Final Contado (CRC) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={closeAmount}
                  onChange={(e) => setCloseAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Motivo del cierre administrativo..."
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setSelectedRegister(null);
                  setCloseError(null);
                }}
                disabled={isClosing}
                className="flex-1 bg-white/5 hover:bg-white/10 px-4 py-3 rounded-xl text-white font-bold transition-all border border-white/10 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCloseRegister}
                disabled={isClosing || !closeAmount}
                className="flex-1 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 px-4 py-3 rounded-xl text-white font-bold transition-all shadow-lg shadow-rose-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isClosing ? 'Cerrando...' : 'Confirmar Cierre'}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-6 px-8 bg-[#020617]/80 backdrop-blur-xl border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-lg font-black text-white uppercase tracking-wider">SABROSITA</p>
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wide">
            Panel de Administración
          </p>
        </div>
      </footer>
    </div>
  );
}

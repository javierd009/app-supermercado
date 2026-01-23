'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCashRegister, useLoadCurrentRegister } from '@/features/cash-register/hooks/useCashRegister';
import { OpenRegisterForm, CloseRegisterForm, RegisterStatus } from '@/features/cash-register/components';
import {
  Clock,
  User,
  Home,
  FileText,
  Printer,
  CreditCard,
  ArrowRight,
  Lock,
  AlertTriangle,
  CheckCircle,
  Info,
  DollarSign,
  ShoppingCart,
  LogOut
} from 'lucide-react';

export default function CashRegisterPage() {
  const { user } = useAuth();
  useLoadCurrentRegister();

  const router = useRouter();
  const { currentRegister, isOpen } = useCashRegister();
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleOpenSuccess = () => {
    router.push('/pos');
  };

  const handleCloseSuccess = () => {
    setShowCloseForm(false);
    alert('Caja cerrada exitosamente');
    router.push('/dashboard');
  };

  const handlePrintReport = () => {
    router.push('/reports');
  };

  const handleViewHistory = () => {
    router.push('/sales');
  };

  const handleViewCashInfo = async () => {
    if (!currentRegister) {
      alert('No hay caja abierta');
      return;
    }

    const { useRegisterSummary } = await import('@/features/cash-register/hooks/useCashRegister');
    const summary = await useRegisterSummary().getSummary(currentRegister.id);

    const formatCurrency = (amount: number) =>
      new Intl.NumberFormat('es-CR', {
        style: 'currency',
        currency: 'CRC',
      }).format(amount);

    const totalRecaudado = summary.totalCash + summary.totalCard + summary.totalSinpe;
    const efectivoActual = currentRegister.initialAmount + summary.totalCash;

    const mensaje =
      `💰 ESTADO ACTUAL DE CAJA\n\n` +
      `Monto Inicial: ${formatCurrency(currentRegister.initialAmount)}\n\n` +
      `RECAUDACIÓN:\n` +
      `• Efectivo: ${formatCurrency(summary.totalCash)}\n` +
      `• Tarjeta: ${formatCurrency(summary.totalCard)}\n` +
      `• SINPE: ${formatCurrency(summary.totalSinpe)}\n` +
      `─────────────────\n` +
      `Total Recaudado: ${formatCurrency(totalRecaudado)}\n\n` +
      `💵 Efectivo en Caja: ${formatCurrency(efectivoActual)}\n\n` +
      `📊 ESTADÍSTICAS:\n` +
      `• Ventas: ${summary.salesCount}\n` +
      `• Items vendidos: ${summary.itemCount}`;

    alert(mensaje);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Header */}
      <header className="h-20 px-6 md:px-8 flex items-center justify-between border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl border border-white/20 shadow-xl hover:scale-105 transition-transform hover:from-blue-700 hover:to-indigo-800"
            title="Volver al Dashboard"
          >
            <Home className="h-5 w-5 text-white" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-500" />
              <p className="text-xl font-black text-white tracking-tight uppercase">Gestión de Caja</p>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              {isOpen ? '● Turno Activo' : '○ Sin Turno'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-lg font-bold text-white tabular-nums">{currentTime.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</p>
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">{currentTime.toLocaleDateString('es-CR', { weekday: 'short', day: '2-digit', month: 'short' })}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm">
                {user?.username?.substring(0, 1).toUpperCase()}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-white">{user?.username}</p>
                <p className="text-[8px] text-slate-500 uppercase tracking-wide">
                  {user?.role === 'super_admin' ? 'Super Admin' : user?.role === 'admin' ? 'Admin' : 'Cajero'}
                </p>
              </div>
            </div>

            <Link href="/logout">
              <button className="p-3 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-white/5">
                <LogOut className="w-4 h-4" />
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Action Bar */}
      <div className="px-6 md:px-8 py-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
        {/* Admin: Gestionar cajas de otros usuarios */}
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <Link
            href="/admin/registers"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 px-3 md:px-4 py-2 rounded-xl text-white font-bold text-[10px] md:text-xs uppercase tracking-wide transition-all flex items-center gap-1.5 md:gap-2 shadow-lg"
          >
            <User className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cajas de Usuarios</span>
            <span className="sm:hidden">Usuarios</span>
          </Link>
        )}
        {!(user?.role === 'admin' || user?.role === 'super_admin') && <div />}
        <div className="flex items-center gap-2">
          <button
            onClick={handleViewHistory}
            className="bg-white/5 hover:bg-blue-500/20 px-3 md:px-4 py-2 rounded-xl text-blue-400 font-bold text-[10px] md:text-xs uppercase tracking-wide transition-all border border-white/5 flex items-center gap-1.5 md:gap-2"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Historial</span>
          </button>
          <button
            onClick={handlePrintReport}
            className="bg-white/5 hover:bg-blue-500/20 px-3 md:px-4 py-2 rounded-xl text-blue-400 font-bold text-[10px] md:text-xs uppercase tracking-wide transition-all border border-white/5 flex items-center gap-1.5 md:gap-2"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reporte</span>
          </button>
        </div>
      </div>

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Panel de Estado */}
        <div>
          <RegisterStatus />
        </div>

        {/* Formulario de Apertura - Caja Cerrada */}
        {!isOpen && !currentRegister && (
          <div className="space-y-4">
            {/* Formulario de Apertura */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase">Apertura de Caja</h2>
                  <p className="text-sm text-slate-500 font-medium">Inicie su turno de trabajo</p>
                </div>
              </div>
              <OpenRegisterForm onSuccess={handleOpenSuccess} />
            </div>

            {/* Instrucciones - Diseño horizontal más ancho */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Info className="w-4 h-4 text-blue-400" />
                  <h3 className="font-black text-blue-400 text-sm uppercase">Instrucciones</h3>
                </div>
                <ul className="text-sm text-slate-300 space-y-1.5 font-medium">
                  <li>• Cuente el efectivo inicial y registre el monto exacto</li>
                  <li>• Verifique billetes y monedas antes de confirmar</li>
                </ul>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="font-black text-amber-400 text-sm uppercase">Importante</h3>
                </div>
                <ul className="text-sm text-slate-300 space-y-1.5 font-medium">
                  <li>• El monto inicial no podrá modificarse después</li>
                  <li>• Asegúrese de la cantidad exacta antes de continuar</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Acciones - Caja Abierta */}
        {isOpen && currentRegister && !showCloseForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Ir al POS */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="w-5 h-5 text-blue-400" />
                  <h3 className="font-black text-white text-sm uppercase">Operación Principal</h3>
                </div>
                <button
                  onClick={() => router.push('/pos')}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-5 h-5" />
                  IR AL PUNTO DE VENTA
                </button>
                <p className="text-xs text-slate-500 mt-4 font-medium">
                  Procesar transacciones del turno activo
                </p>
              </div>

              {/* Acciones Rápidas */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-5 h-5 text-blue-400" />
                  <h3 className="font-black text-white text-sm uppercase">Acciones Rápidas</h3>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={handlePrintReport}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 text-xs font-bold text-white transition-all rounded-lg text-left flex items-center gap-2"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimir Reporte Parcial
                  </button>
                  <button
                    onClick={handleViewHistory}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 text-xs font-bold text-white transition-all rounded-lg text-left flex items-center gap-2"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Ver Movimientos del Turno
                  </button>
                  <button
                    onClick={handleViewCashInfo}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 text-xs font-bold text-white transition-all rounded-lg text-left flex items-center gap-2"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    Consultar Efectivo Actual
                  </button>
                </div>
              </div>

              {/* Cierre de Caja - Disponible para todos */}
              <div className="bg-white/5 rounded-xl border border-white/10 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-5 h-5 text-rose-400" />
                  <h3 className="font-black text-white text-sm uppercase">Finalizar Turno</h3>
                </div>
                <button
                  onClick={() => setShowCloseForm(true)}
                  className="w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  CERRAR CAJA
                </button>
                <div className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs text-amber-400 font-bold uppercase mb-1">
                        {user?.role === 'cashier' ? 'Requiere autorización' : 'Irreversible'}
                      </p>
                      <p className="text-xs text-amber-400 font-medium">
                        {user?.role === 'cashier'
                          ? 'Se solicitará contraseña de administrador'
                          : 'Verifique el efectivo antes de cerrar'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulario de Cierre */}
        {isOpen && currentRegister && showCloseForm && (
          <div className="bg-white/5 rounded-xl border border-white/10 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-rose-600 rounded-lg">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white uppercase">Cierre de Caja y Arqueo</h2>
                <p className="text-sm text-slate-500 font-medium">Finalizar turno de trabajo</p>
              </div>
            </div>
            <CloseRegisterForm
              onSuccess={handleCloseSuccess}
              onCancel={() => setShowCloseForm(false)}
            />
          </div>
        )}
      </main>

      <footer className="py-6 px-8 bg-[#020617]/80 backdrop-blur-xl border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-lg font-black text-white uppercase tracking-wider">SABROSITA</p>
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wide">
            © 2026 Sabrosita POS v1.0
          </p>
        </div>
      </footer>
    </div>
  );
}

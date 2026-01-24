'use client';

import Link from 'next/link';
import { BusinessConfigForm } from '@/features/settings';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Settings, Home, LogOut, ArrowLeft, Activity, Printer } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Header */}
      <header className="h-20 px-6 md:px-8 flex items-center justify-between border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl border border-white/20 shadow-xl hover:scale-105 transition-transform">
            <Home className="h-5 w-5 text-white" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-500" />
              <p className="text-xl font-black text-white tracking-tight uppercase">Configuración del Sistema</p>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Datos del negocio</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <button className="px-4 py-2 bg-white/5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all border border-white/5 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide hidden sm:inline">Volver</span>
            </button>
          </Link>
          <Link href="/logout">
            <button className="p-3 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-white/5">
              <LogOut className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </header>

      <main className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
        <BusinessConfigForm />

        {/* Herramientas de Sistema - Solo Super Admin */}
        {isSuperAdmin && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                Herramientas de Sistema
              </h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/admin/diagnostics">
                <div className="flex items-center gap-4 p-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all cursor-pointer group">
                  <div className="p-3 bg-emerald-500/20 rounded-xl group-hover:scale-110 transition-transform">
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-bold text-white">Diagnósticos</p>
                    <p className="text-xs text-slate-400">Verificar sistema y logs</p>
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl opacity-60">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Printer className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Impresora</p>
                  <p className="text-xs text-slate-400">Configurar en POS</p>
                </div>
              </div>
            </div>
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

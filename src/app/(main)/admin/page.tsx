'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { configService } from '@/features/settings/services/configService';
import { Users, Settings, Printer, BarChart3, Home, Clock, LogOut, Shield, ChevronRight } from 'lucide-react';

export default function AdminPage() {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [businessName, setBusinessName] = useState('Sabrosita POS');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Cargar nombre del negocio desde configuración
    const loadBusinessName = async () => {
      const config = await configService.getBusinessConfig();
      if (config.business_name) {
        setBusinessName(config.business_name);
      }
    };
    loadBusinessName();
  }, []);

  const menuItems = [
    {
      title: 'Gestión de Usuarios',
      href: '/admin/users',
      icon: <Users className="w-5 h-5" />,
      description: 'Crear, editar y administrar usuarios del sistema',
      gradient: 'from-purple-500 to-purple-600',
    },
    {
      title: 'Configuración del Negocio',
      href: '/admin/settings',
      icon: <Settings className="w-5 h-5" />,
      description: 'Editar información y parámetros del sistema',
      gradient: 'from-cyan-500 to-blue-600',
    },
    {
      title: 'Impresión y Tickets',
      href: '/admin/printing',
      icon: <Printer className="w-5 h-5" />,
      description: 'Reimprimir tickets y pruebas de impresión',
      gradient: 'from-orange-500 to-amber-600',
    },
    {
      title: 'Reportes de IVA',
      href: '#',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Informes fiscales y declaraciones de impuestos',
      gradient: 'from-slate-500 to-slate-600',
      disabled: true,
    },
  ];

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
              <Shield className="w-5 h-5 text-blue-500" />
              <p className="text-xl font-black text-white tracking-tight uppercase">Administración</p>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Panel de control</p>
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

      <main className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
            <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
              <Shield className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Módulos Activos</p>
            <h3 className="text-2xl font-black text-white tabular-nums">{menuItems.filter(m => !m.disabled).length}/{menuItems.length}</h3>
          </div>

          <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
            <div className="p-3 bg-gradient-to-tr from-emerald-400 to-teal-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Sistema</p>
            <h3 className="text-xl font-black text-emerald-400">Activo</h3>
          </div>

          <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
            <div className="p-3 bg-gradient-to-tr from-amber-500 to-orange-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
              <Shield className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Seguridad</p>
            <h3 className="text-xl font-black text-amber-400">Alta</h3>
          </div>

          <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
            <div className="p-3 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Último Acceso</p>
            <h3 className="text-lg font-black text-white tabular-nums">
              {currentTime.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </h3>
          </div>
        </div>

        {/* Módulos */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">
            Módulos de Administración
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {menuItems.map((item, index) => (
              item.disabled ? (
                <div key={index} className="bg-white/5 rounded-xl p-6 border border-white/5 opacity-60 cursor-not-allowed">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${item.gradient} text-white`}>
                      {item.icon}
                    </div>
                    <span className="bg-amber-500/20 border border-amber-500/30 px-3 py-1 rounded-lg text-amber-400 font-bold text-xs uppercase">
                      Próximamente
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-400 mb-2 uppercase">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 font-medium text-sm">
                    {item.description}
                  </p>
                </div>
              ) : (
                <Link key={index} href={item.href} className="group">
                  <div className="bg-white/5 rounded-xl p-6 border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${item.gradient} text-white`}>
                        {item.icon}
                      </div>
                      <div className="p-2 rounded-lg bg-white/5 text-slate-600 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>

                    <h3 className="text-xl font-black text-white group-hover:text-blue-400 transition-colors mb-2 uppercase">
                      {item.title}
                    </h3>
                    <p className="text-slate-500 font-medium text-sm">
                      {item.description}
                    </p>

                    <div className="flex items-center text-[9px] font-bold text-blue-500 uppercase tracking-wide mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                      Acceder <ChevronRight className="w-3 h-3 ml-1" />
                    </div>
                  </div>
                </Link>
              )
            ))}
          </div>
        </div>

        {/* Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
            <h3 className="font-black text-blue-400 text-lg uppercase mb-3">Información</h3>
            <ul className="text-sm text-slate-300 space-y-2 font-medium">
              <li>• Acceso solo para administradores</li>
              <li>• Configuraciones afectan todo el sistema</li>
              <li>• Los cambios son inmediatos</li>
            </ul>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
            <h3 className="font-black text-amber-400 text-lg uppercase mb-3">Advertencia</h3>
            <ul className="text-sm text-slate-300 space-y-2 font-medium">
              <li>• No elimine datos sin respaldo</li>
              <li>• Los cambios no se pueden deshacer</li>
              <li>• Contacte soporte técnico si tiene dudas</li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="py-6 px-8 bg-[#020617]/80 backdrop-blur-xl border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-lg font-black text-white uppercase tracking-wider">{businessName}</p>
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wide">
            © 2026 {businessName} v1.0
          </p>
        </div>
      </footer>
    </div>
  );
}

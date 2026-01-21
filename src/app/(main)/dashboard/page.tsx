'use client';

import { useAuth } from '@/features/auth/hooks/useAuth';
import { useCashRegister, useLoadCurrentRegister } from '@/features/cash-register/hooks/useCashRegister';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { configService } from '@/features/settings/services/configService';
import {
  CircleDollarSign,
  Package,
  Landmark,
  BarChart3,
  Users,
  TrendingUp,
  Settings,
  LogOut,
  Clock,
  ChevronRight,
  ArrowUpRight,
  PieChart,
  Wallet
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { currentRegister } = useCashRegister();

  // Cargar estado de caja al montar el componente
  useLoadCurrentRegister();

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
      title: 'Punto de Venta',
      href: '/pos',
      icon: <CircleDollarSign className="w-5 h-5" />,
      description: 'Facturación rápida y cobros',
      gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
    },
    {
      title: 'Inventario',
      href: '/products',
      icon: <Package className="w-5 h-5" />,
      description: 'Stock y control de almacén',
      gradient: 'from-purple-500 via-indigo-500 to-purple-600',
    },
    {
      title: 'Caja y Bancos',
      href: '/cash-register',
      icon: <Landmark className="w-5 h-5" />,
      description: 'Flujo de efectivo diario',
      gradient: 'from-blue-500 via-indigo-500 to-blue-600',
    },
    {
      title: 'Libro de Ventas',
      href: '/sales',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Reportes de ventas por fecha',
      gradient: 'from-violet-500 via-purple-500 to-violet-600',
    },
    {
      title: 'Clientes',
      href: '/customers',
      icon: <Users className="w-5 h-5" />,
      description: 'Cartera y cuentas por cobrar',
      gradient: 'from-sky-500 via-blue-500 to-cyan-600',
    },
    {
      title: 'Contabilidad',
      href: '/reports',
      icon: <PieChart className="w-5 h-5" />,
      description: 'Estados y balances contables',
      gradient: 'from-pink-500 via-rose-500 to-pink-600',
    },
  ];

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'super_admin': return 'Director General';
      case 'admin': return 'Administrador';
      case 'cashier': return 'Cajero';
      default: return 'Usuario';
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Header */}
      <header className="h-20 px-6 md:px-8 flex items-center justify-between border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl border border-white/20 shadow-xl">
            <img src="/images/sabrosita-logo.png" alt="logo" className="h-5 w-5 brightness-0 invert" />
          </div>
          <div>
            <p className="text-xl font-black text-white tracking-tight uppercase">{businessName}</p>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Dashboard - Sistema POS</p>
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
                <p className="text-[8px] text-slate-500 uppercase tracking-wide">{getRoleLabel()}</p>
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

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Ventas del Día', value: '₡0.00', icon: <CircleDollarSign className="w-4 h-4" />, grad: 'from-blue-500 to-indigo-600' },
            { label: 'Estado de Caja', value: currentRegister ? 'Abierta' : 'Cerrada', icon: <Wallet className="w-4 h-4" />, grad: currentRegister ? 'from-emerald-500 to-emerald-600' : 'from-slate-500 to-slate-600' },
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
              <div className={`p-3 bg-gradient-to-tr ${stat.grad} rounded-lg text-white shadow-lg mb-4 inline-flex`}>
                {stat.icon}
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">{stat.label}</p>
              <h3 className="text-2xl font-black text-white tabular-nums">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Modules */}
        <div className="space-y-4">
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">
            Módulos
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {menuItems.map((item, index) => (
              <Link key={index} href={item.href} className="group">
                <div className="bg-white/5 rounded-xl p-6 border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${item.gradient} text-white`}>
                      {item.icon}
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 text-slate-600 group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <ArrowUpRight className="w-4 h-4" />
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
            ))}
          </div>
        </div>

        {/* Admin Tools - Only for Admin and Super Admin */}
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
          <div className="space-y-4">
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">
              Administración
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <Link href="/admin/users" className="group">
                <div className="bg-white/5 rounded-xl p-6 border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 via-blue-500 to-indigo-600 text-white">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 text-slate-600 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors mb-2 uppercase">
                    Usuarios
                  </h3>
                  <p className="text-slate-500 font-medium text-sm">
                    Gestión de usuarios y permisos
                  </p>

                  <div className="flex items-center text-[9px] font-bold text-indigo-500 uppercase tracking-wide mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Acceder <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              </Link>

              <Link href="/admin/settings" className="group">
                <div className="bg-white/5 rounded-xl p-6 border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-slate-500 via-gray-500 to-slate-600 text-white">
                      <Settings className="w-5 h-5" />
                    </div>
                    <div className="p-2 rounded-lg bg-white/5 text-slate-600 group-hover:bg-slate-500 group-hover:text-white transition-all">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>

                  <h3 className="text-xl font-black text-white group-hover:text-slate-400 transition-colors mb-2 uppercase">
                    Configuración
                  </h3>
                  <p className="text-slate-500 font-medium text-sm">
                    Datos del negocio y sistema
                  </p>

                  <div className="flex items-center text-[9px] font-bold text-slate-500 uppercase tracking-wide mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                    Acceder <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              </Link>
            </div>
          </div>
        )}
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

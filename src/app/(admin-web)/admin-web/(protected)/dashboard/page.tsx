'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  ShoppingCart,
  AlertTriangle,
  Clock,
  RefreshCw,
} from 'lucide-react';

interface DashboardStats {
  todaySales: number;
  todayRevenue: number;
  lowStockProducts: number;
  totalProducts: number;
  totalCustomers: number;
  activeCashRegisters: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todaySales: 0,
    todayRevenue: 0,
    lowStockProducts: 0,
    totalProducts: 0,
    totalCustomers: 0,
    activeCashRegisters: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const supabase = createClient();

  useEffect(() => {
    loadStats();

    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      loadStats();
    }, 30000);

    // Suscribirse a cambios en tiempo real
    const salesChannel = supabase
      .channel('admin-dashboard-sales')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sales' }, () => {
        console.log('[Admin Dashboard] Nueva venta detectada');
        loadStats();
      })
      .subscribe();

    const productsChannel = supabase
      .channel('admin-dashboard-products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        console.log('[Admin Dashboard] Productos actualizados');
        loadStats();
      })
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(productsChannel);
    };
  }, []);

  const loadStats = async () => {
    try {
      setIsLoading(true);

      // Fecha de hoy
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      // Ventas de hoy
      const { data: todaySalesData } = await supabase
        .from('sales')
        .select('total')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .is('canceled_at', null);

      const todaySales = todaySalesData?.length || 0;
      const todayRevenue = todaySalesData?.reduce((sum, sale) => sum + parseFloat(sale.total), 0) || 0;

      // Productos
      const { data: productsData } = await supabase
        .from('products')
        .select('stock, min_stock');

      const totalProducts = productsData?.length || 0;
      const lowStockProducts = productsData?.filter(p => p.stock <= p.min_stock).length || 0;

      // Clientes
      const { count: totalCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      // Cajas abiertas
      const { data: openRegisters } = await supabase
        .from('cash_registers')
        .select('id')
        .eq('status', 'open');

      setStats({
        todaySales,
        todayRevenue,
        lowStockProducts,
        totalProducts,
        totalCustomers: totalCustomers || 0,
        activeCashRegisters: openRegisters?.length || 0,
      });

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-CR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#020617] pb-20 lg:pb-6">
      {/* Header */}
      <div className="bg-[#020617]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10 px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-white">Dashboard</h1>
            <p className="text-slate-400 text-sm font-medium mt-1">
              Gestión remota en tiempo real
            </p>
          </div>
          <button
            onClick={loadStats}
            disabled={isLoading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
          <Clock className="w-3 h-3" />
          <span>Última actualización: {formatTime(lastUpdate)}</span>
          <span className="bg-green-500 w-2 h-2 rounded-full animate-pulse"></span>
          <span className="text-green-400 font-bold">En tiempo real</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="px-4 lg:px-8 py-6 space-y-6">
        {/* Ventas de Hoy */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 border border-blue-500/50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-200 text-sm font-bold uppercase tracking-wide mb-2">
                  Ventas Hoy
                </p>
                <h2 className="text-4xl font-black text-white mb-1">{stats.todaySales}</h2>
                <p className="text-blue-200 text-xs font-medium">Transacciones</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 border border-green-500/50">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-green-200 text-sm font-bold uppercase tracking-wide mb-2">
                  Ingresos Hoy
                </p>
                <h2 className="text-3xl font-black text-white mb-1">{formatCurrency(stats.todayRevenue)}</h2>
                <p className="text-green-200 text-xs font-medium">Ventas activas</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Productos y Stock */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-2">
              Total Productos
            </p>
            <h3 className="text-3xl font-black text-white">{stats.totalProducts}</h3>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${
                stats.lowStockProducts > 0
                  ? 'bg-gradient-to-br from-yellow-500 to-orange-600'
                  : 'bg-gradient-to-br from-green-500 to-green-600'
              }`}>
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-2">
              Stock Bajo
            </p>
            <h3 className={`text-3xl font-black ${
              stats.lowStockProducts > 0 ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {stats.lowStockProducts}
            </h3>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/[0.08] transition-all">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 p-3 rounded-xl">
                <Users className="w-5 h-5 text-white" />
              </div>
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wide mb-2">
              Clientes
            </p>
            <h3 className="text-3xl font-black text-white">{stats.totalCustomers}</h3>
          </div>
        </div>

        {/* Cajas Activas */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-black text-lg">Cajas Activas</h3>
              <p className="text-slate-400 text-sm font-medium">Turnos abiertos en este momento</p>
            </div>
          </div>
          <div className="text-center py-8">
            <h2 className="text-5xl font-black text-white mb-2">{stats.activeCashRegisters}</h2>
            <p className="text-slate-400 text-sm font-medium">
              {stats.activeCashRegisters === 0
                ? 'No hay cajas abiertas'
                : stats.activeCashRegisters === 1
                ? '1 caja operando'
                : `${stats.activeCashRegisters} cajas operando`}
            </p>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-sm mb-1">
                Datos en Tiempo Real
              </h4>
              <p className="text-blue-200 text-sm font-medium">
                Los cambios en los POS se reflejan automáticamente aquí.
                La sincronización es bidireccional: cambios aquí se ven en los POS en menos de 1 segundo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { salesService } from '@/features/sales/services';
import { printService } from '@/features/printing/services';
import { customersService } from '@/features/customers';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { CancelSaleModal } from '@/features/sales/components/CancelSaleModal';
import type { Sale } from '@/features/sales/types';
import type { Customer } from '@/features/customers';
import {
  Clock,
  User,
  Home,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  RefreshCw,
  ShoppingBag,
  XCircle,
  DollarSign,
  TrendingUp,
  CreditCard,
  Search,
  Filter,
  Printer,
  X,
  Receipt
} from 'lucide-react';

export default function SalesPage() {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [selectedSaleTotal, setSelectedSaleTotal] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh cada 10 segundos
    const refreshInterval = setInterval(() => {
      loadData();
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [salesData, customersData] = await Promise.all([
      salesService.getRecentSales(100),
      customersService.getAll(),
    ]);
    setSales(salesData);
    setCustomers(customersData);
    setIsLoading(false);
  };

  const handleReprint = async (saleId: string) => {
    const sale = await salesService.getSaleWithItems(saleId);
    if (!sale) {
      alert('No se pudo cargar la venta');
      return;
    }

    const result = await printService.printSaleTicket(
      sale,
      user?.username || 'Cajero',
      'REIMPRESIÓN'
    );

    if (result.success) {
      alert('Ticket enviado a la impresora');
    } else {
      alert(`Error al imprimir: ${result.error}`);
    }
  };

  const openCancelModal = (sale: Sale) => {
    setSelectedSaleId(sale.id);
    setSelectedSaleTotal(sale.total);
  };

  const closeCancelModal = () => {
    setSelectedSaleId(null);
    setSelectedSaleTotal(0);
  };

  const handleCancelSuccess = () => {
    loadData();
  };

  const handleExportCSV = () => {
    alert('Exportando a CSV... (Funcionalidad próximamente)');
  };

  const handleExportPDF = () => {
    alert('Exportando a PDF... (Funcionalidad próximamente)');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  const formatDateShort = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
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

  const getCustomerName = (customerId?: string) => {
    if (!customerId) return 'PÚBLICO GENERAL';
    const customer = customers.find((c) => c.id === customerId);
    return customer?.name || 'DESCONOCIDO';
  };

  const getPaymentMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'EFECTIVO',
      card: 'TARJETA',
      sinpe: 'SINPE',
    };
    return labels[method] || method;
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  // Filtros aplicados
  const filteredSales = sales.filter(sale => {
    const customerName = getCustomerName(sale.customerId).toLowerCase();
    const search = searchTerm.toLowerCase();
    const matchesSearch = customerName.includes(search) || sale.id.includes(search);

    const matchesPayment = paymentFilter === 'all' || sale.paymentMethod === paymentFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && !sale.canceledAt) ||
      (statusFilter === 'canceled' && sale.canceledAt);

    return matchesSearch && matchesPayment && matchesStatus;
  });

  const activeSales = filteredSales.filter(s => !s.canceledAt);
  const canceledSales = filteredSales.filter(s => s.canceledAt);
  const totalRevenue = activeSales.reduce((sum, s) => sum + s.total, 0);
  const averageTicket = activeSales.length > 0 ? totalRevenue / activeSales.length : 0;

  // Estadísticas por método de pago
  const cashSales = activeSales.filter(s => s.paymentMethod === 'cash');
  const cardSales = activeSales.filter(s => s.paymentMethod === 'card');
  const sinpeSales = activeSales.filter(s => s.paymentMethod === 'sinpe');

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Header */}
      <header className="h-20 px-6 md:px-8 flex items-center justify-between border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <a href="/dashboard" className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl border border-white/20 shadow-xl hover:scale-105 transition-transform">
            <Home className="h-5 w-5 text-white" />
          </a>
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-blue-500" />
              <p className="text-xl font-black text-white tracking-tight uppercase">Historial de Ventas</p>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Gestión y análisis de ventas</p>
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl text-blue-400 font-bold text-xs uppercase tracking-wide transition-all flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl text-blue-400 font-bold text-xs uppercase tracking-wide transition-all flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              PDF
            </button>
            <button
              onClick={loadData}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-white font-bold text-xs uppercase tracking-wide transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Actualizar
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-6 space-y-6 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
            <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Ventas Activas</p>
            <h3 className="text-2xl font-black text-white tabular-nums">{activeSales.length}</h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">Transacciones válidas</p>
          </div>

          <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
            <div className="p-3 bg-gradient-to-tr from-rose-500 to-rose-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
              <XCircle className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Anuladas</p>
            <h3 className="text-2xl font-black text-rose-400 tabular-nums">{canceledSales.length}</h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">Transacciones canceladas</p>
          </div>

          <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
            <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
              <DollarSign className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Total Recaudado</p>
            <h3 className="text-lg font-black text-white tabular-nums">{formatCurrency(totalRevenue)}</h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">Ingresos brutos</p>
          </div>

          <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
            <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Ticket Promedio</p>
            <h3 className="text-lg font-black text-white tabular-nums">{formatCurrency(averageTicket)}</h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">Por transacción</p>
          </div>

          <div className="bg-white/5 p-5 rounded-xl border border-white/5 hover:bg-white/[0.08] transition-all">
            <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
              <CreditCard className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Métodos Pago</p>
            <div className="text-xs font-medium space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">EFECTIVO:</span>
                <span className="font-black text-white">{cashSales.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">TARJETA:</span>
                <span className="font-black text-white">{cardSales.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">SINPE:</span>
                <span className="font-black text-white">{sinpeSales.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white/5 p-6 rounded-xl border border-white/5">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-blue-500" />
            <h3 className="font-black text-white text-sm uppercase tracking-wide">
              Filtros y Búsqueda
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Búsqueda */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                Buscar por Cliente o ID
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  placeholder="Nombre cliente o ID venta..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                />
              </div>
            </div>

            {/* Filtro por método de pago */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                Método de Pago
              </label>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="all" className="bg-[#020617] text-white">TODOS LOS MÉTODOS</option>
                <option value="cash" className="bg-[#020617] text-white">EFECTIVO</option>
                <option value="card" className="bg-[#020617] text-white">TARJETA</option>
                <option value="sinpe" className="bg-[#020617] text-white">SINPE</option>
              </select>
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                Estado de la Venta
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
              >
                <option value="all" className="bg-[#020617] text-white">TODOS LOS ESTADOS</option>
                <option value="active" className="bg-[#020617] text-white">SOLO ACTIVAS</option>
                <option value="canceled" className="bg-[#020617] text-white">SOLO ANULADAS</option>
              </select>
            </div>
          </div>
        </div>

        {/* Sales Table */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <div className="border-b border-white/10 px-5 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-blue-500" />
                <h3 className="font-black text-white text-sm uppercase tracking-wide">
                  Registro de Transacciones
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium">
                Mostrando <span className="text-white font-black">{filteredSales.length}</span> de <span className="text-white font-black">{sales.length}</span> ventas
              </span>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-white/10 bg-white/5">
                <tr>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase text-slate-400 tracking-wide">
                    ID Transacción
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase text-slate-400 tracking-wide">
                    Fecha
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase text-slate-400 tracking-wide">
                    Hora
                  </th>
                  <th className="px-3 py-3 text-left text-[10px] font-bold uppercase text-slate-400 tracking-wide">
                    Cliente
                  </th>
                  <th className="px-3 py-3 text-right text-[10px] font-bold uppercase text-slate-400 tracking-wide">
                    Total
                  </th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold uppercase text-slate-400 tracking-wide">
                    Método
                  </th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold uppercase text-slate-400 tracking-wide">
                    Estado
                  </th>
                  <th className="px-3 py-3 text-center text-[10px] font-bold uppercase text-slate-400 tracking-wide">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-blue-500/20 border-t-blue-500"></div>
                      <p className="mt-4 text-white font-bold text-xs uppercase tracking-wide">Cargando datos...</p>
                    </td>
                  </tr>
                ) : filteredSales.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center">
                      <div className="flex flex-col items-center">
                        <div className="bg-white/5 border border-white/10 p-6 mb-3 rounded-2xl">
                          <Receipt className="w-12 h-12 text-slate-600 mx-auto" />
                        </div>
                        <p className="text-sm font-black text-white uppercase tracking-wide">
                          {searchTerm || paymentFilter !== 'all' || statusFilter !== 'all' ? 'No se encontraron ventas con los filtros aplicados' : 'No hay ventas registradas'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className={`transition-all duration-300 ${
                        sale.canceledAt ? 'bg-red-500/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <td className="px-3 py-3 text-xs font-mono text-slate-300">
                        {sale.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-300 font-medium">
                        {formatDateShort(sale.createdAt)}
                      </td>
                      <td className="px-3 py-3 text-xs font-mono text-slate-300">
                        {formatTime(sale.createdAt)}
                      </td>
                      <td className="px-3 py-3 text-xs text-slate-300 font-medium">
                        {getCustomerName(sale.customerId)}
                      </td>
                      <td className="px-3 py-3 text-right text-xs font-black text-white">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className="inline-flex items-center bg-blue-500/20 border border-blue-500/30 px-2 py-1 text-[10px] font-black text-blue-300 rounded-lg">
                          {getPaymentMethodLabel(sale.paymentMethod)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-center">
                        {sale.canceledAt ? (
                          <span className="inline-flex items-center bg-rose-500/20 border border-rose-500/30 px-2 py-1 text-[10px] font-black text-rose-300 rounded-lg">
                            ANULADA
                          </span>
                        ) : (
                          <span className="inline-flex items-center bg-emerald-500/20 border border-emerald-500/30 px-2 py-1 text-[10px] font-black text-emerald-300 rounded-lg">
                            ACTIVA
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleReprint(sale.id)}
                            className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-blue-500/30 p-1.5 rounded-lg transition-all duration-300"
                            title="Reimprimir"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition-transform" />
                          </button>
                          {!sale.canceledAt && isAdmin && (
                            <button
                              onClick={() => openCancelModal(sale)}
                              className="group bg-white/5 hover:bg-white/10 border border-white/10 hover:border-red-500/30 p-1.5 rounded-lg transition-all duration-300"
                              title="Anular"
                            >
                              <X className="w-3.5 h-3.5 text-red-400 group-hover:scale-110 transition-transform" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="border-t border-white/10 bg-white/5 px-5 py-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-400">
                REGISTRO TOTAL: <span className="text-blue-400 font-black">{filteredSales.length}</span> VENTA{filteredSales.length !== 1 ? 'S' : ''}
                {(searchTerm || paymentFilter !== 'all' || statusFilter !== 'all') && (
                  <span className="ml-2 text-blue-400 font-black">
                    (FILTRADO DE {sales.length})
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-400 font-medium">
                  Actualización: <span className="text-white font-black">{currentTime.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer className="py-6 px-8 bg-[#020617]/80 backdrop-blur-xl border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-lg font-black text-white uppercase tracking-wider">SABROSITA</p>
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wide">
            © 2026 Sabrosita POS v1.0
          </p>
        </div>
      </footer>

      {/* Cancel Modal */}
      <CancelSaleModal
        saleId={selectedSaleId}
        saleTotal={selectedSaleTotal}
        onClose={closeCancelModal}
        onSuccess={handleCancelSuccess}
      />
    </div>
  );
}

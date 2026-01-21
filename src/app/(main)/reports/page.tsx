'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { reportsService } from '@/features/reports/services';
import {
  getSalesReportAction,
  getInventoryReportAction,
  getCustomersReportAction,
  getFinancialReportAction,
} from '@/features/reports/actions/reportsActions';
import type {
  SalesReportRow,
  InventoryReportRow,
  CustomerReportRow,
  FinancialReportRow,
} from '@/features/reports/services';
import {
  FileText,
  Home,
  LogOut,
  FileSpreadsheet,
  Clock,
  Calendar,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  Loader2,
  Download,
  Printer,
} from 'lucide-react';

type ReportType = 'sales' | 'inventory' | 'customers' | 'financial';
type DatePreset = 'today' | 'week' | 'month' | 'year' | 'custom';
type ReportData = SalesReportRow[] | InventoryReportRow[] | CustomerReportRow[] | FinancialReportRow[];

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [datePreset, setDatePreset] = useState<DatePreset>('custom');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [reportData, setReportData] = useState<ReportData>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const applyDatePreset = (preset: DatePreset) => {
    setDatePreset(preset);
    const today = new Date();
    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        setDateFrom(formatDate(today));
        setDateTo(formatDate(today));
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        setDateFrom(formatDate(weekStart));
        setDateTo(formatDate(today));
        break;
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        setDateFrom(formatDate(monthStart));
        setDateTo(formatDate(today));
        break;
      case 'year':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        setDateFrom(formatDate(yearStart));
        setDateTo(formatDate(today));
        break;
      case 'custom':
        break;
    }
  };

  const reports = [
    {
      id: 'sales' as ReportType,
      title: 'Reporte de Ventas',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Ventas por período, producto y cajero',
    },
    {
      id: 'inventory' as ReportType,
      title: 'Reporte de Inventario',
      icon: <Package className="w-5 h-5" />,
      description: 'Stock actual, productos con bajo stock',
    },
    {
      id: 'customers' as ReportType,
      title: 'Reporte de Clientes',
      icon: <Users className="w-5 h-5" />,
      description: 'Clientes frecuentes y análisis de compras',
    },
    {
      id: 'financial' as ReportType,
      title: 'Reporte Financiero',
      icon: <DollarSign className="w-5 h-5" />,
      description: 'Ingresos, costos y utilidades',
    },
  ];

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      alert('Seleccione un tipo de reporte');
      return;
    }

    // Inventario no necesita fechas
    if (selectedReport !== 'inventory' && (!dateFrom || !dateTo)) {
      alert('Seleccione el rango de fechas');
      return;
    }

    setIsLoading(true);
    setHasGenerated(false);
    setReportData([]);

    try {
      let result;

      switch (selectedReport) {
        case 'sales':
          result = await getSalesReportAction(dateFrom, dateTo);
          break;
        case 'inventory':
          result = await getInventoryReportAction();
          break;
        case 'customers':
          result = await getCustomersReportAction(dateFrom, dateTo);
          break;
        case 'financial':
          result = await getFinancialReportAction(dateFrom, dateTo);
          break;
      }

      if (result && !result.success) {
        throw new Error(result.error || 'Error al generar reporte');
      }

      const data = result?.data || [];
      setReportData(data);
      setHasGenerated(true);

      if (data.length === 0) {
        alert('No hay datos para el período seleccionado');
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      alert('Error al generar reporte: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      alert('Primero genere un reporte');
      return;
    }

    const reportName = reports.find((r) => r.id === selectedReport)?.title || 'reporte';
    const filename = `${reportName.toLowerCase().replace(/ /g, '_')}_${dateFrom}_${dateTo}`;
    reportsService.exportToCSV(reportData, filename);
  };

  const handlePrint = () => {
    if (reportData.length === 0) {
      alert('Primero genere un reporte');
      return;
    }
    reportsService.exportToPDF();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
    }).format(amount);
  };

  const renderReportTable = () => {
    if (!hasGenerated) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-4">
            <FileText className="w-16 h-16 text-slate-600 mx-auto" />
          </div>
          <p className="text-sm font-black text-white uppercase tracking-wide">
            Seleccione un reporte y presione "Generar"
          </p>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Los datos se mostrarán en esta área
          </p>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-sm font-black text-white uppercase tracking-wide">
            Generando reporte...
          </p>
        </div>
      );
    }

    if (reportData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-4">
            <FileText className="w-16 h-16 text-slate-600 mx-auto" />
          </div>
          <p className="text-sm font-black text-white uppercase tracking-wide">
            No hay datos para mostrar
          </p>
          <p className="text-xs text-slate-400 mt-2 font-medium">
            Intente con otro período o tipo de reporte
          </p>
        </div>
      );
    }

    // Renderizar tabla según el tipo de reporte
    switch (selectedReport) {
      case 'sales':
        return renderSalesTable(reportData as SalesReportRow[]);
      case 'inventory':
        return renderInventoryTable(reportData as InventoryReportRow[]);
      case 'customers':
        return renderCustomersTable(reportData as CustomerReportRow[]);
      case 'financial':
        return renderFinancialTable(reportData as FinancialReportRow[]);
      default:
        return null;
    }
  };

  const renderSalesTable = (data: SalesReportRow[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-white/10 border-b border-white/20">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide">
              ID
            </th>
            <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide">
              Fecha
            </th>
            <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide">
              Cajero
            </th>
            <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide">
              Cliente
            </th>
            <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide">
              Método
            </th>
            <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wide">
              Items
            </th>
            <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wide">
              Subtotal
            </th>
            <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wide">
              IVA
            </th>
            <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wide">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-3 text-white font-mono text-xs">{row.saleId}</td>
              <td className="px-4 py-3 text-white font-medium text-xs">{row.date}</td>
              <td className="px-4 py-3 text-white font-medium text-xs">{row.cashier}</td>
              <td className="px-4 py-3 text-white font-medium text-xs">{row.customer}</td>
              <td className="px-4 py-3 text-white font-medium text-xs">{row.paymentMethod}</td>
              <td className="px-4 py-3 text-white font-bold text-xs text-right">{row.items}</td>
              <td className="px-4 py-3 text-white font-bold text-xs text-right tabular-nums">
                {formatCurrency(row.subtotal)}
              </td>
              <td className="px-4 py-3 text-white font-bold text-xs text-right tabular-nums">
                {formatCurrency(row.tax)}
              </td>
              <td className="px-4 py-3 text-emerald-400 font-black text-xs text-right tabular-nums">
                {formatCurrency(row.total)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-white/10 border-t-2 border-blue-500">
          <tr>
            <td colSpan={6} className="px-4 py-3 text-right text-xs font-black text-white uppercase">
              TOTALES:
            </td>
            <td className="px-4 py-3 text-white font-black text-xs text-right tabular-nums">
              {formatCurrency(data.reduce((sum, row) => sum + row.subtotal, 0))}
            </td>
            <td className="px-4 py-3 text-white font-black text-xs text-right tabular-nums">
              {formatCurrency(data.reduce((sum, row) => sum + row.tax, 0))}
            </td>
            <td className="px-4 py-3 text-emerald-400 font-black text-xs text-right tabular-nums">
              {formatCurrency(data.reduce((sum, row) => sum + row.total, 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  const renderInventoryTable = (data: InventoryReportRow[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-white/10 border-b border-white/20">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide">
              Código
            </th>
            <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide">
              Producto
            </th>
            <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide">
              Categoría
            </th>
            <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wide">
              Stock
            </th>
            <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wide">
              Min
            </th>
            <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wide">
              Costo
            </th>
            <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wide">
              Precio
            </th>
            <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wide">
              Valor Stock
            </th>
            <th className="px-4 py-3 text-center text-xs font-black text-slate-400 uppercase tracking-wide">
              Estado
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-3 text-white font-mono text-xs">{row.code}</td>
              <td className="px-4 py-3 text-white font-medium text-xs">{row.name}</td>
              <td className="px-4 py-3 text-white font-medium text-xs">{row.category}</td>
              <td className="px-4 py-3 text-white font-bold text-xs text-right">{row.stock}</td>
              <td className="px-4 py-3 text-slate-400 font-bold text-xs text-right">{row.minStock}</td>
              <td className="px-4 py-3 text-white font-bold text-xs text-right tabular-nums">
                {formatCurrency(row.cost)}
              </td>
              <td className="px-4 py-3 text-white font-bold text-xs text-right tabular-nums">
                {formatCurrency(row.price)}
              </td>
              <td className="px-4 py-3 text-emerald-400 font-black text-xs text-right tabular-nums">
                {formatCurrency(row.stockValue)}
              </td>
              <td className="px-4 py-3 text-center">
                <span
                  className={`inline-block px-2 py-1 rounded-lg text-xs font-black ${
                    row.status === 'OK'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : row.status === 'Bajo'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-white/10 border-t-2 border-blue-500">
          <tr>
            <td colSpan={7} className="px-4 py-3 text-right text-xs font-black text-white uppercase">
              VALOR TOTAL:
            </td>
            <td className="px-4 py-3 text-emerald-400 font-black text-xs text-right tabular-nums">
              {formatCurrency(data.reduce((sum, row) => sum + row.stockValue, 0))}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  const renderCustomersTable = (data: CustomerReportRow[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-white/10 border-b border-white/20">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide">
              Cliente
            </th>
            <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide">
              Teléfono
            </th>
            <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide">
              Email
            </th>
            <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wide">
              Compras
            </th>
            <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wide">
              Total Gastado
            </th>
            <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide">
              Última Compra
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-3 text-white font-bold text-xs">{row.name}</td>
              <td className="px-4 py-3 text-white font-medium text-xs">{row.phone}</td>
              <td className="px-4 py-3 text-white font-medium text-xs">{row.email}</td>
              <td className="px-4 py-3 text-white font-bold text-xs text-right">{row.totalPurchases}</td>
              <td className="px-4 py-3 text-emerald-400 font-black text-xs text-right tabular-nums">
                {formatCurrency(row.totalSpent)}
              </td>
              <td className="px-4 py-3 text-white font-medium text-xs">{row.lastPurchase}</td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-white/10 border-t-2 border-blue-500">
          <tr>
            <td colSpan={4} className="px-4 py-3 text-right text-xs font-black text-white uppercase">
              TOTALES:
            </td>
            <td className="px-4 py-3 text-emerald-400 font-black text-xs text-right tabular-nums">
              {formatCurrency(data.reduce((sum, row) => sum + row.totalSpent, 0))}
            </td>
            <td></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  const renderFinancialTable = (data: FinancialReportRow[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-white/10 border-b border-white/20">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-black text-slate-400 uppercase tracking-wide">
              Fecha
            </th>
            <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wide">
              Transacciones
            </th>
            <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wide">
              Ventas
            </th>
            <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wide">
              Costos
            </th>
            <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wide">
              Ganancia
            </th>
            <th className="px-4 py-3 text-right text-xs font-black text-slate-400 uppercase tracking-wide">
              Margen %
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {data.map((row, index) => (
            <tr key={index} className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-3 text-white font-medium text-xs">{row.date}</td>
              <td className="px-4 py-3 text-white font-bold text-xs text-right">{row.transactions}</td>
              <td className="px-4 py-3 text-white font-bold text-xs text-right tabular-nums">
                {formatCurrency(row.sales)}
              </td>
              <td className="px-4 py-3 text-rose-400 font-bold text-xs text-right tabular-nums">
                {formatCurrency(row.costs)}
              </td>
              <td className="px-4 py-3 text-emerald-400 font-black text-xs text-right tabular-nums">
                {formatCurrency(row.profit)}
              </td>
              <td className="px-4 py-3 text-blue-400 font-black text-xs text-right tabular-nums">
                {row.profitMargin.toFixed(2)}%
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-white/10 border-t-2 border-blue-500">
          <tr>
            <td className="px-4 py-3 text-right text-xs font-black text-white uppercase">TOTALES:</td>
            <td className="px-4 py-3 text-white font-black text-xs text-right">
              {data.reduce((sum, row) => sum + row.transactions, 0)}
            </td>
            <td className="px-4 py-3 text-white font-black text-xs text-right tabular-nums">
              {formatCurrency(data.reduce((sum, row) => sum + row.sales, 0))}
            </td>
            <td className="px-4 py-3 text-rose-400 font-black text-xs text-right tabular-nums">
              {formatCurrency(data.reduce((sum, row) => sum + row.costs, 0))}
            </td>
            <td className="px-4 py-3 text-emerald-400 font-black text-xs text-right tabular-nums">
              {formatCurrency(data.reduce((sum, row) => sum + row.profit, 0))}
            </td>
            <td className="px-4 py-3 text-blue-400 font-black text-xs text-right tabular-nums">
              {(() => {
                const totalSales = data.reduce((sum, row) => sum + row.sales, 0);
                const totalProfit = data.reduce((sum, row) => sum + row.profit, 0);
                return totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(2) : '0.00';
              })()}
              %
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Header */}
      <header className="h-20 px-6 md:px-8 flex items-center justify-between border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-20 print:hidden">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl border border-white/20 shadow-xl hover:scale-105 transition-transform"
          >
            <Home className="h-5 w-5 text-white" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <p className="text-xl font-black text-white tracking-tight uppercase">Reportes y Análisis</p>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              Generación de informes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex flex-col items-end">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <p className="text-lg font-bold text-white tabular-nums">
                {currentTime.toLocaleTimeString('es-CR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false,
                })}
              </p>
            </div>
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
              {currentTime.toLocaleDateString('es-CR', { weekday: 'short', day: '2-digit', month: 'short' })}
            </p>
          </div>

          <Link href="/logout">
            <button className="p-3 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-white/5">
              <LogOut className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </header>

      <main className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 print:hidden">
          <div className="bg-white/5 p-5 rounded-xl border border-white/5">
            <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
              <FileText className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Tipo de Reporte</p>
            <h3 className="text-xl font-black text-white">
              {selectedReport ? reports.find((r) => r.id === selectedReport)?.title.substring(11) : '---'}
            </h3>
          </div>

          <div className="bg-white/5 p-5 rounded-xl border border-white/5">
            <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Período</p>
            <h3 className="text-lg font-black text-white">
              {datePreset !== 'custom' ? (
                <>
                  {datePreset === 'today' && 'HOY'}
                  {datePreset === 'week' && 'SEMANA'}
                  {datePreset === 'month' && 'MES'}
                  {datePreset === 'year' && 'AÑO'}
                </>
              ) : (
                'CUSTOM'
              )}
            </h3>
          </div>

          <div className="bg-white/5 p-5 rounded-xl border border-white/5">
            <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
              <TrendingUp className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Registros</p>
            <h3 className="text-2xl font-black text-white tabular-nums">{reportData.length}</h3>
          </div>

          <div className="bg-white/5 p-5 rounded-xl border border-white/5">
            <div className="p-3 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg text-white shadow-lg mb-4 inline-flex">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wide mb-2">Estado</p>
            <h3 className="text-lg font-black text-white">
              {isLoading ? 'CARGANDO...' : hasGenerated ? 'LISTO' : 'PENDIENTE'}
            </h3>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Panel - Report Configuration (2 columns) */}
          <div className="lg:col-span-2 space-y-6 print:hidden">
            {/* Report Type Selector */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="border-b border-white/10 px-5 py-3">
                <h2 className="font-black text-white text-sm uppercase tracking-wide">Tipo de Reporte</h2>
              </div>
              <div className="p-5 grid grid-cols-1 gap-3">
                {reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => setSelectedReport(report.id)}
                    className={`rounded-xl border transition-all text-left overflow-hidden ${
                      selectedReport === report.id
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="p-4 flex items-center gap-4">
                      <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-3 rounded-lg text-white shadow-lg">
                        {report.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-black text-white text-sm uppercase tracking-wide">{report.title}</h3>
                        <p className="text-xs text-slate-400 font-medium mt-1">{report.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Date Configuration */}
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="border-b border-white/10 px-5 py-3">
                <h2 className="font-black text-white text-sm uppercase tracking-wide">Configuración de Fechas</h2>
              </div>
              <div className="p-5 space-y-4">
                {/* Date Presets */}
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                    Períodos Rápidos
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => applyDatePreset('today')}
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                        datePreset === 'today'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-slate-400 hover:bg-white/20'
                      }`}
                    >
                      HOY
                    </button>
                    <button
                      onClick={() => applyDatePreset('week')}
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                        datePreset === 'week'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-slate-400 hover:bg-white/20'
                      }`}
                    >
                      SEMANA
                    </button>
                    <button
                      onClick={() => applyDatePreset('month')}
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                        datePreset === 'month'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-slate-400 hover:bg-white/20'
                      }`}
                    >
                      MES
                    </button>
                    <button
                      onClick={() => applyDatePreset('year')}
                      className={`px-3 py-2 text-xs font-bold rounded-lg transition-all ${
                        datePreset === 'year'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white/10 text-slate-400 hover:bg-white/20'
                      }`}
                    >
                      AÑO
                    </button>
                  </div>
                </div>

                {/* Custom Dates */}
                {selectedReport !== 'inventory' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                        Fecha Desde
                      </label>
                      <input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => {
                          setDateFrom(e.target.value);
                          setDatePreset('custom');
                        }}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                        Fecha Hasta
                      </label>
                      <input
                        type="date"
                        value={dateTo}
                        onChange={(e) => {
                          setDateTo(e.target.value);
                          setDatePreset('custom');
                        }}
                        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                      />
                    </div>
                  </>
                )}

                {/* Generate Button */}
                <button
                  onClick={handleGenerateReport}
                  disabled={!selectedReport || isLoading}
                  className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-4 text-sm font-bold text-white rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generando...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="w-4 h-4" />
                      Generar Reporte
                    </>
                  )}
                </button>

                {/* Export Buttons */}
                {hasGenerated && reportData.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                    <button
                      onClick={handleExportCSV}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-3 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Download className="w-3.5 h-3.5" />
                      CSV/Excel
                    </button>
                    <button
                      onClick={handlePrint}
                      className="bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-3 text-xs font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      Imprimir PDF
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Report Data Preview (3 columns) */}
          <div className="lg:col-span-3">
            <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
              <div className="border-b border-white/10 px-5 py-3 print:bg-white print:border-black">
                <h2 className="font-black text-white text-sm uppercase tracking-wide print:text-black">
                  {selectedReport
                    ? `${reports.find((r) => r.id === selectedReport)?.title} - ${
                        selectedReport === 'inventory' ? 'Stock Actual' : `${dateFrom} a ${dateTo}`
                      }`
                    : 'Vista Previa de Datos'}
                </h2>
              </div>
              <div className="p-5">{renderReportTable()}</div>
            </div>
          </div>
        </div>
      </main>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            margin: 1cm;
          }
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  );
}

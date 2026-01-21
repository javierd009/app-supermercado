'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  FileText,
  Download,
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  BarChart3,
} from 'lucide-react';

type ReportType = 'sales' | 'inventory' | 'customers' | 'financial';

export default function AdminReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [isLoading, setIsLoading] = useState(false);
  const [reportData, setReportData] = useState<any[]>([]);
  const supabase = createClient();

  const reports = [
    {
      type: 'sales' as ReportType,
      name: 'Ventas',
      icon: TrendingUp,
      color: 'from-blue-600 to-blue-700',
      description: 'Reporte detallado de ventas por período',
    },
    {
      type: 'inventory' as ReportType,
      name: 'Inventario',
      icon: Package,
      color: 'from-purple-600 to-purple-700',
      description: 'Estado actual del inventario y stock',
    },
    {
      type: 'customers' as ReportType,
      name: 'Clientes',
      icon: Users,
      color: 'from-green-600 to-green-700',
      description: 'Compras y estadísticas de clientes',
    },
    {
      type: 'financial' as ReportType,
      name: 'Financiero',
      icon: DollarSign,
      color: 'from-orange-600 to-orange-700',
      description: 'Análisis de costos, ventas y márgenes',
    },
  ];

  const generateReport = async () => {
    try {
      setIsLoading(true);
      setReportData([]);

      switch (reportType) {
        case 'sales':
          await generateSalesReport();
          break;
        case 'inventory':
          await generateInventoryReport();
          break;
        case 'customers':
          await generateCustomersReport();
          break;
        case 'financial':
          await generateFinancialReport();
          break;
      }
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error al generar reporte');
    } finally {
      setIsLoading(false);
    }
  };

  const generateSalesReport = async () => {
    const startDate = `${dateFrom}T00:00:00`;
    const endDate = `${dateTo}T23:59:59`;

    const { data: sales } = await supabase
      .from('sales')
      .select(`
        id,
        created_at,
        total,
        payment_method,
        users!inner(username),
        customers!inner(name)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .is('canceled_at', null)
      .order('created_at', { ascending: false });

    setReportData(sales || []);
  };

  const generateInventoryReport = async () => {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .order('name', { ascending: true });

    setReportData(products || []);
  };

  const generateCustomersReport = async () => {
    const startDate = `${dateFrom}T00:00:00`;
    const endDate = `${dateTo}T23:59:59`;

    const { data: customers } = await supabase
      .from('customers')
      .select('id, name, phone, email, created_at')
      .neq('name', 'Cliente General');

    const customersWithStats = await Promise.all(
      (customers || []).map(async (customer) => {
        const { data: salesData } = await supabase
          .from('sales')
          .select('total')
          .eq('customer_id', customer.id)
          .gte('created_at', startDate)
          .lte('created_at', endDate)
          .is('canceled_at', null);

        return {
          ...customer,
          totalPurchases: salesData?.length || 0,
          totalSpent: salesData?.reduce((sum, sale) => sum + parseFloat(sale.total), 0) || 0,
        };
      })
    );

    setReportData(customersWithStats.filter((c) => c.totalPurchases > 0));
  };

  const generateFinancialReport = async () => {
    const startDate = `${dateFrom}T00:00:00`;
    const endDate = `${dateTo}T23:59:59`;

    const { data: sales } = await supabase
      .from('sales')
      .select(`
        id,
        created_at,
        total,
        sale_items!inner(
          quantity,
          products!inner(cost)
        )
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .is('canceled_at', null);

    // Agrupar por día
    const dailyStats = (sales || []).reduce((acc: any, sale: any) => {
      const date = new Date(sale.created_at).toLocaleDateString('es-CR');
      if (!acc[date]) {
        acc[date] = { sales: 0, cost: 0, transactions: 0 };
      }
      acc[date].sales += parseFloat(sale.total);
      acc[date].cost += sale.sale_items.reduce(
        (sum: number, item: any) => sum + item.quantity * (item.products?.cost || 0),
        0
      );
      acc[date].transactions += 1;
      return acc;
    }, {});

    const reportData = Object.entries(dailyStats).map(([date, stats]: [string, any]) => ({
      date,
      sales: stats.sales,
      cost: stats.cost,
      profit: stats.sales - stats.cost,
      margin: ((stats.sales - stats.cost) / stats.sales) * 100,
      transactions: stats.transactions,
    }));

    setReportData(reportData);
  };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(','),
      ...reportData.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value || '');
            return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
          })
          .join(',')
      ),
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_${reportType}_${dateFrom}_${dateTo}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#020617] pb-20 lg:pb-6">
      {/* Header */}
      <div className="bg-[#020617]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10 px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-white">Reportes</h1>
            <p className="text-slate-400 text-base font-medium mt-1">
              Análisis y exportación de datos
            </p>
          </div>
          <BarChart3 className="w-8 h-8 text-blue-500" />
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 lg:px-8 py-6 space-y-6">
        {/* Report Type Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {reports.map((report) => {
            const Icon = report.icon;
            const isSelected = reportType === report.type;

            return (
              <button
                key={report.type}
                onClick={() => setReportType(report.type)}
                className={`bg-gradient-to-br ${report.color} rounded-2xl p-6 text-left transition-all transform ${
                  isSelected ? 'ring-4 ring-white/30 scale-105' : 'opacity-60 hover:opacity-100'
                }`}
              >
                <Icon className="w-10 h-10 text-white mb-3" />
                <h3 className="text-white font-black text-xl mb-1">{report.name}</h3>
                <p className="text-white/80 text-sm font-medium">{report.description}</p>
              </button>
            );
          })}
        </div>

        {/* Date Range Selection */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-blue-400" />
            <h3 className="text-white font-black text-xl">Rango de Fechas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-400 text-base font-bold uppercase block mb-2">Desde</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-5 py-4 bg-white/10 border border-white/20 rounded-xl text-white text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-slate-400 text-sm font-bold uppercase block mb-2">Hasta</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col md:flex-row gap-3">
          <button
            onClick={generateReport}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xl py-5 rounded-xl transition-all disabled:opacity-50"
          >
            <FileText className={`w-6 h-6 ${isLoading ? 'animate-pulse' : ''}`} />
            {isLoading ? 'Generando...' : 'Generar Reporte'}
          </button>

          {reportData.length > 0 && (
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-black text-xl py-5 px-6 rounded-xl transition-all"
            >
              <Download className="w-6 h-6" />
              Exportar CSV
            </button>
          )}
        </div>

        {/* Report Results */}
        {reportData.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-black text-2xl">Resultados</h3>
              <span className="text-slate-400 font-bold text-base">
                {reportData.length} registro{reportData.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    {Object.keys(reportData[0]).map((key) => (
                      <th
                        key={key}
                        className="text-left text-slate-400 text-sm font-bold uppercase py-3 px-3"
                      >
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reportData.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5">
                      {Object.entries(row).map(([key, value], cellIdx) => (
                        <td key={cellIdx} className="text-white text-base font-medium py-3 px-3">
                          {typeof value === 'number'
                            ? key.includes('margin') || key.includes('percent')
                              ? `${value.toFixed(1)}%`
                              : key.includes('total') ||
                                key.includes('cost') ||
                                key.includes('price') ||
                                key.includes('sales') ||
                                key.includes('profit') ||
                                key.includes('Spent')
                              ? formatCurrency(value)
                              : value
                            : typeof value === 'object'
                            ? JSON.stringify(value)
                            : key.includes('created_at') || key.includes('date')
                            ? formatDate(String(value))
                            : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              {reportData.length > 50 && (
                <p className="text-slate-400 text-base font-medium text-center mt-4">
                  Mostrando los primeros 50 registros de {reportData.length}. Exporta a CSV para ver todos.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-white font-bold text-base mb-2">Exportación de Datos</h4>
              <ul className="space-y-1 text-blue-200 text-base font-medium">
                <li>• Los reportes se generan en tiempo real desde Supabase</li>
                <li>• Puedes exportar a CSV para análisis en Excel</li>
                <li>• Los datos incluyen todas las transacciones del período seleccionado</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

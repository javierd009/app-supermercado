/**
 * Reports Service - Generación de reportes del sistema
 */

import { databaseAdapter } from '@/lib/database/adapter';

export interface SalesReportRow {
  saleId: string;
  date: string;
  cashier: string;
  customer: string;
  paymentMethod: string;
  subtotal: number;
  tax: number;
  total: number;
  items: number;
}

export interface InventoryReportRow {
  code: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  cost: number;
  price: number;
  stockValue: number;
  status: 'OK' | 'Bajo' | 'Crítico';
}

export interface CustomerReportRow {
  name: string;
  phone: string;
  email: string;
  totalPurchases: number;
  totalSpent: number;
  lastPurchase: string;
}

export interface FinancialReportRow {
  date: string;
  sales: number;
  costs: number;
  profit: number;
  profitMargin: number;
  transactions: number;
}

class ReportsService {
  /**
   * Reporte de Ventas
   */
  async getSalesReport(dateFrom: string, dateTo: string): Promise<SalesReportRow[]> {
    try {
      // Normalizar fechas para comparación inclusiva
      // dateFrom: inicio del día (00:00:00)
      // dateTo: fin del día (23:59:59)
      const startDate = `${dateFrom}T00:00:00`;
      const endDate = `${dateTo}T23:59:59`;

      console.log(`[ReportsService] Buscando ventas desde ${startDate} hasta ${endDate}`);

      const sales = await databaseAdapter.query<any>(
        `SELECT
          s.id as sale_id,
          s.created_at as date,
          u.username as cashier,
          c.name as customer,
          s.payment_method,
          s.total,
          COUNT(si.id) as items
        FROM sales s
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN customers c ON s.customer_id = c.id
        LEFT JOIN sale_items si ON s.id = si.sale_id
        WHERE s.created_at >= ? AND s.created_at <= ?
        GROUP BY s.id
        ORDER BY s.created_at DESC`,
        [startDate, endDate]
      );

      console.log(`[ReportsService] Encontradas ${sales?.length || 0} ventas`);

      return (sales || []).map((sale: any) => {
        // Calcular subtotal e impuesto (asumiendo 13% IVA)
        const total = sale.total || 0;
        const subtotal = total / 1.13;
        const tax = total - subtotal;

        return {
          saleId: sale.sale_id.substring(0, 8).toUpperCase(),
          date: new Date(sale.date).toLocaleString('es-CR'),
          cashier: sale.cashier || 'N/A',
          customer: sale.customer || 'Cliente General',
          paymentMethod: this.formatPaymentMethod(sale.payment_method),
          subtotal,
          tax,
          total,
          items: sale.items || 0,
        };
      });
    } catch (error) {
      console.error('Error fetching sales report:', error);
      return [];
    }
  }

  /**
   * Reporte de Inventario
   */
  async getInventoryReport(): Promise<InventoryReportRow[]> {
    try {
      const products = await databaseAdapter.query<any>(
        `SELECT
          code,
          name,
          category,
          stock,
          min_stock,
          cost,
          price
        FROM products
        ORDER BY name ASC`,
        []
      );

      return (products || []).map((product: any) => {
        const stock = product.stock || 0;
        const minStock = product.min_stock || 0;
        const stockValue = stock * (product.cost || 0);

        let status: 'OK' | 'Bajo' | 'Crítico' = 'OK';
        if (stock === 0) {
          status = 'Crítico';
        } else if (stock <= minStock) {
          status = 'Bajo';
        }

        return {
          code: product.code,
          name: product.name,
          category: product.category || 'Sin categoría',
          stock,
          minStock,
          cost: product.cost || 0,
          price: product.price || 0,
          stockValue,
          status,
        };
      });
    } catch (error) {
      console.error('Error fetching inventory report:', error);
      return [];
    }
  }

  /**
   * Reporte de Clientes
   */
  async getCustomersReport(dateFrom: string, dateTo: string): Promise<CustomerReportRow[]> {
    try {
      // Normalizar fechas para comparación inclusiva
      const startDate = `${dateFrom}T00:00:00`;
      const endDate = `${dateTo}T23:59:59`;

      const customers = await databaseAdapter.query<any>(
        `SELECT
          c.name,
          c.phone,
          c.email,
          COUNT(s.id) as total_purchases,
          COALESCE(SUM(s.total), 0) as total_spent,
          MAX(s.created_at) as last_purchase
        FROM customers c
        LEFT JOIN sales s ON c.id = s.customer_id
          AND s.created_at >= ? AND s.created_at <= ?
        WHERE c.name != 'Cliente General'
        GROUP BY c.id
        HAVING total_purchases > 0
        ORDER BY total_spent DESC`,
        [startDate, endDate]
      );

      return (customers || []).map((customer: any) => ({
        name: customer.name,
        phone: customer.phone || 'N/A',
        email: customer.email || 'N/A',
        totalPurchases: customer.total_purchases || 0,
        totalSpent: customer.total_spent || 0,
        lastPurchase: customer.last_purchase
          ? new Date(customer.last_purchase).toLocaleDateString('es-CR')
          : 'N/A',
      }));
    } catch (error) {
      console.error('Error fetching customers report:', error);
      return [];
    }
  }

  /**
   * Reporte Financiero
   */
  async getFinancialReport(dateFrom: string, dateTo: string): Promise<FinancialReportRow[]> {
    try {
      // Normalizar fechas para comparación inclusiva
      const startDate = `${dateFrom}T00:00:00`;
      const endDate = `${dateTo}T23:59:59`;

      const financial = await databaseAdapter.query<any>(
        `SELECT
          DATE(s.created_at) as date,
          COUNT(DISTINCT s.id) as transactions,
          SUM(s.total) as sales,
          SUM(si.quantity * p.cost) as costs
        FROM sales s
        LEFT JOIN sale_items si ON s.id = si.sale_id
        LEFT JOIN products p ON si.product_id = p.id
        WHERE s.created_at >= ? AND s.created_at <= ?
        GROUP BY DATE(s.created_at)
        ORDER BY date ASC`,
        [startDate, endDate]
      );

      return (financial || []).map((row: any) => {
        const sales = row.sales || 0;
        const costs = row.costs || 0;
        const profit = sales - costs;
        const profitMargin = sales > 0 ? (profit / sales) * 100 : 0;

        return {
          date: new Date(row.date).toLocaleDateString('es-CR'),
          sales,
          costs,
          profit,
          profitMargin,
          transactions: row.transactions || 0,
        };
      });
    } catch (error) {
      console.error('Error fetching financial report:', error);
      return [];
    }
  }

  /**
   * Formatear método de pago
   */
  private formatPaymentMethod(method: string): string {
    const methods: Record<string, string> = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      transfer: 'Transferencia',
      mixed: 'Mixto',
    };
    return methods[method] || method;
  }

  /**
   * Exportar a CSV (compatible con Excel)
   */
  exportToCSV(data: any[], filename: string) {
    if (data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Obtener headers
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','), // Header row
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header];
            // Escapar comas y comillas
            const stringValue =
              typeof value === 'number' ? value.toString() : String(value || '');
            return stringValue.includes(',') || stringValue.includes('"')
              ? `"${stringValue.replace(/"/g, '""')}"`
              : stringValue;
          })
          .join(',')
      ),
    ].join('\n');

    // Crear y descargar archivo
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Exportar a PDF (usando impresión del navegador)
   */
  exportToPDF() {
    window.print();
  }
}

export const reportsService = new ReportsService();

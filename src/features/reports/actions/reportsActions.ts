'use server';

/**
 * Server Actions para Reportes
 * Ejecuta queries SQL directamente en Supabase desde el servidor
 */

import { createClient } from '@/lib/supabase/server';
import type {
  SalesReportRow,
  InventoryReportRow,
  CustomerReportRow,
  FinancialReportRow,
} from '../services';

/**
 * Reporte de Ventas
 */
export async function getSalesReportAction(
  dateFrom: string,
  dateTo: string
): Promise<{ success: boolean; data?: SalesReportRow[]; error?: string }> {
  try {
    const supabase = await createClient();

    // Normalizar fechas para comparación inclusiva
    const startDate = `${dateFrom}T00:00:00`;
    const endDate = `${dateTo}T23:59:59`;

    console.log(`[getSalesReportAction] Buscando ventas desde ${startDate} hasta ${endDate}`);

    // Primero obtener las ventas con sus relaciones
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select(`
        id,
        created_at,
        payment_method,
        total,
        user_id,
        customer_id,
        users (username),
        customers (name)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (salesError) {
      console.error('[getSalesReportAction] Error:', salesError);
      return { success: false, error: salesError.message };
    }

    console.log(`[getSalesReportAction] Encontradas ${sales?.length || 0} ventas`);

    // Para cada venta, contar sus items
    const reportData: SalesReportRow[] = await Promise.all(
      (sales || []).map(async (sale: any) => {
        const { count } = await supabase
          .from('sale_items')
          .select('*', { count: 'exact', head: true })
          .eq('sale_id', sale.id);

        // Calcular subtotal e impuesto (asumiendo 13% IVA)
        const total = parseFloat(sale.total) || 0;
        const subtotal = total / 1.13;
        const tax = total - subtotal;

        return {
          saleId: sale.id.substring(0, 8).toUpperCase(),
          date: new Date(sale.created_at).toLocaleString('es-CR'),
          cashier: sale.users?.username || 'N/A',
          customer: sale.customers?.name || 'Cliente General',
          paymentMethod: formatPaymentMethod(sale.payment_method),
          subtotal,
          tax,
          total,
          items: count || 0,
        };
      })
    );

    return { success: true, data: reportData };
  } catch (error: any) {
    console.error('[getSalesReportAction] Exception:', error);
    return { success: false, error: error.message || 'Error al obtener reporte de ventas' };
  }
}

/**
 * Reporte de Inventario
 */
export async function getInventoryReportAction(): Promise<{
  success: boolean;
  data?: InventoryReportRow[];
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: products, error } = await supabase
      .from('products')
      .select('code, name, category, stock, min_stock, cost, price')
      .order('name', { ascending: true });

    if (error) {
      console.error('[getInventoryReportAction] Error:', error);
      return { success: false, error: error.message };
    }

    const reportData: InventoryReportRow[] = (products || []).map((product) => {
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

    return { success: true, data: reportData };
  } catch (error: any) {
    console.error('[getInventoryReportAction] Exception:', error);
    return { success: false, error: error.message || 'Error al obtener reporte de inventario' };
  }
}

/**
 * Reporte de Clientes
 */
export async function getCustomersReportAction(
  dateFrom: string,
  dateTo: string
): Promise<{ success: boolean; data?: CustomerReportRow[]; error?: string }> {
  try {
    const supabase = await createClient();

    // Normalizar fechas
    const startDate = `${dateFrom}T00:00:00`;
    const endDate = `${dateTo}T23:59:59`;

    // Obtener todos los clientes (excepto Cliente General)
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, phone, email')
      .neq('name', 'Cliente General');

    if (customersError) {
      console.error('[getCustomersReportAction] Error:', customersError);
      return { success: false, error: customersError.message };
    }

    // Para cada cliente, calcular sus estadísticas
    const reportData: CustomerReportRow[] = [];

    for (const customer of customers || []) {
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('id, total, created_at')
        .eq('customer_id', customer.id)
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (salesError) continue;

      const totalPurchases = sales?.length || 0;
      if (totalPurchases === 0) continue;

      const totalSpent = sales?.reduce((sum, sale) => sum + parseFloat(sale.total), 0) || 0;
      const lastPurchaseDate = sales?.[0]?.created_at;

      reportData.push({
        name: customer.name,
        phone: customer.phone || 'N/A',
        email: customer.email || 'N/A',
        totalPurchases,
        totalSpent,
        lastPurchase: lastPurchaseDate
          ? new Date(lastPurchaseDate).toLocaleDateString('es-CR')
          : 'N/A',
      });
    }

    // Ordenar por total gastado descendente
    reportData.sort((a, b) => b.totalSpent - a.totalSpent);

    return { success: true, data: reportData };
  } catch (error: any) {
    console.error('[getCustomersReportAction] Exception:', error);
    return { success: false, error: error.message || 'Error al obtener reporte de clientes' };
  }
}

/**
 * Reporte Financiero
 */
export async function getFinancialReportAction(
  dateFrom: string,
  dateTo: string
): Promise<{ success: boolean; data?: FinancialReportRow[]; error?: string }> {
  try {
    const supabase = await createClient();

    // Normalizar fechas
    const startDate = `${dateFrom}T00:00:00`;
    const endDate = `${dateTo}T23:59:59`;

    // Obtener todas las ventas en el rango
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('id, total, created_at')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: true });

    if (salesError) {
      console.error('[getFinancialReportAction] Error:', salesError);
      return { success: false, error: salesError.message };
    }

    // Agrupar por fecha
    const groupedByDate = new Map<string, { sales: number; costs: number; transactions: number }>();

    for (const sale of sales || []) {
      const dateKey = new Date(sale.created_at).toISOString().split('T')[0];
      const saleTotal = parseFloat(sale.total);

      // Obtener items de la venta para calcular costos
      const { data: items } = await supabase
        .from('sale_items')
        .select(`
          quantity,
          products (cost)
        `)
        .eq('sale_id', sale.id);

      const saleCosts = items?.reduce((sum, item: any) => {
        const cost = item.products?.cost || 0;
        return sum + (item.quantity * cost);
      }, 0) || 0;

      if (!groupedByDate.has(dateKey)) {
        groupedByDate.set(dateKey, { sales: 0, costs: 0, transactions: 0 });
      }

      const group = groupedByDate.get(dateKey)!;
      group.sales += saleTotal;
      group.costs += saleCosts;
      group.transactions += 1;
    }

    // Convertir a array y formatear
    const reportData: FinancialReportRow[] = Array.from(groupedByDate.entries()).map(
      ([date, data]) => {
        const profit = data.sales - data.costs;
        const profitMargin = data.sales > 0 ? (profit / data.sales) * 100 : 0;

        return {
          date: new Date(date).toLocaleDateString('es-CR'),
          sales: data.sales,
          costs: data.costs,
          profit,
          profitMargin,
          transactions: data.transactions,
        };
      }
    );

    // Ordenar por fecha
    reportData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return { success: true, data: reportData };
  } catch (error: any) {
    console.error('[getFinancialReportAction] Exception:', error);
    return { success: false, error: error.message || 'Error al obtener reporte financiero' };
  }
}

/**
 * Helper: Formatear método de pago
 */
function formatPaymentMethod(method: string): string {
  const methods: Record<string, string> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    sinpe: 'Sinpe',
    transfer: 'Transferencia',
    mixed: 'Mixto',
  };
  return methods[method] || method;
}

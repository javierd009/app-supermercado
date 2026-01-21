import type { TicketData, PrinterConfig } from '../types';
import { ESC_POS_COMMANDS } from '../types';
import { calculateSaleTaxBreakdown } from '@/features/tax/utils/taxCalculations';

/**
 * Servicio para formatear tickets en protocolo ESC/POS
 */
class TicketFormatter {
  private config: PrinterConfig;

  constructor(config?: Partial<PrinterConfig>) {
    this.config = {
      name: config?.name || 'default',
      width: config?.width || 40, // 40 caracteres (impresoras 58mm)
      encoding: config?.encoding || 'UTF-8',
    };
  }

  /**
   * Generar ticket completo en formato ESC/POS
   */
  format(data: TicketData): string {
    const {
      sale,
      businessName,
      businessAddress,
      businessPhone,
      cashierName,
      registerNumber,
    } = data;

    let ticket = '';

    // Inicializar impresora
    ticket += ESC_POS_COMMANDS.INIT;

    // Header - Nombre del negocio
    ticket += ESC_POS_COMMANDS.ALIGN_CENTER;
    ticket += ESC_POS_COMMANDS.DOUBLE_SIZE;
    ticket += ESC_POS_COMMANDS.BOLD_ON;
    ticket += this.center(businessName);
    ticket += ESC_POS_COMMANDS.LINE_FEED;
    ticket += ESC_POS_COMMANDS.BOLD_OFF;
    ticket += ESC_POS_COMMANDS.NORMAL;

    // Dirección y teléfono
    if (businessAddress) {
      ticket += this.center(businessAddress);
      ticket += ESC_POS_COMMANDS.LINE_FEED;
    }
    if (businessPhone) {
      ticket += this.center(`Tel: ${businessPhone}`);
      ticket += ESC_POS_COMMANDS.LINE_FEED;
    }

    // Separador
    ticket += this.line();
    ticket += ESC_POS_COMMANDS.LINE_FEED;

    // Fecha y hora
    ticket += ESC_POS_COMMANDS.ALIGN_LEFT;
    ticket += ESC_POS_COMMANDS.NORMAL;
    const date = new Date(sale.createdAt);
    ticket += `Fecha: ${this.formatDate(date)}${ESC_POS_COMMANDS.LINE_FEED}`;
    ticket += `Hora:  ${this.formatTime(date)}${ESC_POS_COMMANDS.LINE_FEED}`;

    // Info de cajero y caja
    ticket += `Cajero: ${cashierName}${ESC_POS_COMMANDS.LINE_FEED}`;
    if (registerNumber) {
      ticket += `Caja: ${registerNumber}${ESC_POS_COMMANDS.LINE_FEED}`;
    }
    ticket += `Ticket: ${sale.id.substring(0, 8).toUpperCase()}${ESC_POS_COMMANDS.LINE_FEED}`;

    // Separador
    ticket += this.line();
    ticket += ESC_POS_COMMANDS.LINE_FEED;

    // Header de items
    ticket += ESC_POS_COMMANDS.BOLD_ON;
    ticket += this.formatRow('CANT', 'DESCRIPCION', 'TOTAL');
    ticket += ESC_POS_COMMANDS.LINE_FEED;
    ticket += ESC_POS_COMMANDS.BOLD_OFF;
    ticket += this.line('-');
    ticket += ESC_POS_COMMANDS.LINE_FEED;

    // Items
    for (const item of sale.items) {
      // Línea 1: Cantidad, Nombre (truncado), Total
      const qtyStr = item.quantity.toString().padStart(4);
      const totalStr = this.formatCurrency(item.subtotal);
      const nameMaxLen = this.config.width - qtyStr.length - totalStr.length - 2;
      const name = this.truncate(item.name, nameMaxLen);

      ticket += this.formatRow(qtyStr, name, totalStr);
      ticket += ESC_POS_COMMANDS.LINE_FEED;

      // Línea 2: Precio unitario (si hay más de 1)
      if (item.quantity > 1) {
        const priceInfo = `  @ ${this.formatCurrency(item.unitPrice)}`;
        ticket += priceInfo;
        ticket += ESC_POS_COMMANDS.LINE_FEED;
      }
    }

    // Separador
    ticket += this.line();
    ticket += ESC_POS_COMMANDS.LINE_FEED;

    // Desglose de IVA
    const taxBreakdown = calculateSaleTaxBreakdown(sale.items);

    // Título de desglose
    ticket += ESC_POS_COMMANDS.BOLD_ON;
    ticket += ESC_POS_COMMANDS.ALIGN_CENTER;
    ticket += 'DESGLOSE DE IVA';
    ticket += ESC_POS_COMMANDS.LINE_FEED;
    ticket += ESC_POS_COMMANDS.BOLD_OFF;
    ticket += ESC_POS_COMMANDS.ALIGN_LEFT;
    ticket += this.line('-');
    ticket += ESC_POS_COMMANDS.LINE_FEED;

    // Desglose por tasa (ordenado de menor a mayor)
    const sortedRates = Object.entries(taxBreakdown.byRate).sort(
      ([a], [b]) => parseFloat(a) - parseFloat(b)
    );

    for (const [rate, data] of sortedRates) {
      const rateLabel = parseFloat(rate) === 0 ? 'Exento' : `IVA ${rate}%`;
      const rateLine = `${rateLabel}:`.padEnd(25) + this.formatCurrency(data.tax).padStart(15);
      ticket += rateLine;
      ticket += ESC_POS_COMMANDS.LINE_FEED;
    }

    ticket += this.line('-');
    ticket += ESC_POS_COMMANDS.LINE_FEED;

    // Subtotal y total de IVA
    const subtotalLine = 'Subtotal:'.padEnd(25) + this.formatCurrency(taxBreakdown.subtotal).padStart(15);
    ticket += subtotalLine;
    ticket += ESC_POS_COMMANDS.LINE_FEED;

    const taxLine = 'Total IVA:'.padEnd(25) + this.formatCurrency(taxBreakdown.totalTax).padStart(15);
    ticket += taxLine;
    ticket += ESC_POS_COMMANDS.LINE_FEED;

    ticket += this.line();
    ticket += ESC_POS_COMMANDS.LINE_FEED;

    // Totales
    ticket += ESC_POS_COMMANDS.DOUBLE_HEIGHT;
    ticket += ESC_POS_COMMANDS.BOLD_ON;
    ticket += ESC_POS_COMMANDS.ALIGN_RIGHT;
    ticket += `TOTAL: ${this.formatCurrency(sale.total)}`;
    ticket += ESC_POS_COMMANDS.LINE_FEED;
    ticket += ESC_POS_COMMANDS.NORMAL;
    ticket += ESC_POS_COMMANDS.BOLD_OFF;
    ticket += ESC_POS_COMMANDS.ALIGN_LEFT;

    // Método de pago
    const paymentMethodLabel = this.getPaymentMethodLabel(sale.paymentMethod);
    ticket += `${ESC_POS_COMMANDS.LINE_FEED}`;
    ticket += `Pago: ${paymentMethodLabel}${ESC_POS_COMMANDS.LINE_FEED}`;
    ticket += `Recibido: ${this.formatCurrency(sale.amountReceived)}${ESC_POS_COMMANDS.LINE_FEED}`;

    if (sale.changeGiven > 0) {
      ticket += ESC_POS_COMMANDS.BOLD_ON;
      ticket += `Cambio: ${this.formatCurrency(sale.changeGiven)}${ESC_POS_COMMANDS.LINE_FEED}`;
      ticket += ESC_POS_COMMANDS.BOLD_OFF;
    }

    // Separador
    ticket += this.line();
    ticket += ESC_POS_COMMANDS.LINE_FEED;

    // Footer
    ticket += ESC_POS_COMMANDS.ALIGN_CENTER;
    ticket += ESC_POS_COMMANDS.NORMAL;
    ticket += `${ESC_POS_COMMANDS.LINE_FEED}`;
    ticket += this.center('¡Gracias por su compra!');
    ticket += `${ESC_POS_COMMANDS.LINE_FEED}`;
    ticket += this.center('Vuelva pronto');
    ticket += `${ESC_POS_COMMANDS.LINE_FEED}`;

    // Feed y corte
    ticket += ESC_POS_COMMANDS.FEED_3_LINES;
    ticket += ESC_POS_COMMANDS.PARTIAL_CUT;

    return ticket;
  }

  /**
   * Generar línea separadora
   */
  private line(char: string = '='): string {
    return char.repeat(this.config.width);
  }

  /**
   * Centrar texto
   */
  private center(text: string): string {
    const padding = Math.max(0, Math.floor((this.config.width - text.length) / 2));
    return ' '.repeat(padding) + text;
  }

  /**
   * Formatear fila de 3 columnas
   */
  private formatRow(col1: string, col2: string, col3: string): string {
    const col1Width = 4;
    const col3Width = 10;
    const col2Width = this.config.width - col1Width - col3Width - 2;

    return (
      col1.padStart(col1Width) +
      ' ' +
      this.truncate(col2, col2Width).padEnd(col2Width) +
      ' ' +
      col3.padStart(col3Width)
    );
  }

  /**
   * Truncar texto
   */
  private truncate(text: string, maxLen: number): string {
    if (text.length <= maxLen) return text;
    return text.substring(0, maxLen - 3) + '...';
  }

  /**
   * Formatear moneda (₡)
   */
  private formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  /**
   * Formatear fecha
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-CR', {
      dateStyle: 'short',
    }).format(date);
  }

  /**
   * Formatear hora
   */
  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('es-CR', {
      timeStyle: 'short',
    }).format(date);
  }

  /**
   * Obtener etiqueta de método de pago
   */
  private getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      cash: 'Efectivo',
      card: 'Tarjeta',
      sinpe: 'Sinpe Móvil',
    };
    return labels[method] || method;
  }
}

export const ticketFormatter = new TicketFormatter();

import type { SaleWithItems } from '@/features/sales/types';

export interface TicketData {
  sale: SaleWithItems;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  cashierName: string;
  registerNumber?: string;
}

export interface PrinterConfig {
  name: string;
  width: number; // Ancho en caracteres (40, 48, etc.)
  encoding: 'UTF-8' | 'ISO-8859-1';
}

export interface PrintResult {
  success: boolean;
  error?: string;
}

// Comandos ESC/POS comunes
export const ESC = '\x1B';
export const GS = '\x1D';

export const ESC_POS_COMMANDS = {
  // Inicializar impresora
  INIT: `${ESC}@`,

  // Alineación
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,

  // Tamaño de texto
  NORMAL: `${GS}!\x00`,
  DOUBLE_HEIGHT: `${GS}!\x01`,
  DOUBLE_WIDTH: `${GS}!\x10`,
  DOUBLE_SIZE: `${GS}!\x11`,

  // Estilo
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  UNDERLINE_ON: `${ESC}-\x01`,
  UNDERLINE_OFF: `${ESC}-\x00`,

  // Feed y corte
  LINE_FEED: '\n',
  FEED_3_LINES: '\n\n\n',
  CUT: `${GS}V\x00`,
  PARTIAL_CUT: `${GS}V\x01`,
};

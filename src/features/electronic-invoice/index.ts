/**
 * Feature: Facturación Electrónica de Costa Rica
 *
 * Este módulo maneja la generación y envío de comprobantes electrónicos
 * al Ministerio de Hacienda de Costa Rica según la versión 4.4.
 *
 * Soporta dos modos de facturación:
 * - regular: Ticket/factura normal (sin envío a Hacienda)
 * - electronic: Factura electrónica (con envío a Hacienda)
 */

// Tipos
export * from './types';

// Servicios
export { invoiceService } from './services/invoiceService';

// Utilidades
export {
  generateNumericKey,
  generateConsecutive,
  generateSecurityCode,
  validateNumericKey,
  validateConsecutive,
  parseNumericKey,
  parseConsecutive,
} from './utils/keyGenerator';

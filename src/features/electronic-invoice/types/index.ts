/**
 * Tipos para Facturación Electrónica de Costa Rica
 * Basado en especificaciones del Ministerio de Hacienda v4.4
 */

// =====================================================
// MODOS DE FACTURACIÓN
// =====================================================

export type InvoiceMode = 'regular' | 'electronic';

export const INVOICE_MODES = {
  REGULAR: 'regular' as const,      // Ticket/factura normal (sin envío a Hacienda)
  ELECTRONIC: 'electronic' as const, // Factura electrónica (con envío a Hacienda)
};

// =====================================================
// TIPOS DE DOCUMENTOS ELECTRÓNICOS
// =====================================================

export type DocumentType = '01' | '02' | '03' | '04' | '08' | '09';

export const DOCUMENT_TYPES = {
  FACTURA: '01' as const,           // Factura Electrónica
  NOTA_DEBITO: '02' as const,       // Nota de Débito Electrónica
  NOTA_CREDITO: '03' as const,      // Nota de Crédito Electrónica
  TIQUETE: '04' as const,           // Tiquete Electrónico
  FACTURA_COMPRA: '08' as const,    // Factura Electrónica de Compra
  FACTURA_EXPORTACION: '09' as const, // Factura Electrónica de Exportación
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  '01': 'Factura Electrónica',
  '02': 'Nota de Débito',
  '03': 'Nota de Crédito',
  '04': 'Tiquete Electrónico',
  '08': 'Factura de Compra',
  '09': 'Factura de Exportación',
};

// =====================================================
// TIPOS DE IDENTIFICACIÓN
// =====================================================

export type IdType = '01' | '02' | '03' | '04';

export const ID_TYPES = {
  FISICA: '01' as const,            // Cédula Física
  JURIDICA: '02' as const,          // Cédula Jurídica
  DIMEX: '03' as const,             // DIMEX (extranjeros)
  NITE: '04' as const,              // NITE (sin identificación)
};

export const ID_TYPE_LABELS: Record<IdType, string> = {
  '01': 'Cédula Física',
  '02': 'Cédula Jurídica',
  '03': 'DIMEX',
  '04': 'NITE',
};

// =====================================================
// ESTADOS DE DOCUMENTO
// =====================================================

export type DocumentStatus = 'pending' | 'sent' | 'accepted' | 'rejected' | 'contingency';

export const DOCUMENT_STATUS = {
  PENDING: 'pending' as const,       // Pendiente de envío
  SENT: 'sent' as const,             // Enviado, esperando respuesta
  ACCEPTED: 'accepted' as const,     // Aceptado por Hacienda
  REJECTED: 'rejected' as const,     // Rechazado por Hacienda
  CONTINGENCY: 'contingency' as const, // Modo contingencia (sin conexión)
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  pending: 'Pendiente',
  sent: 'Enviado',
  accepted: 'Aceptado',
  rejected: 'Rechazado',
  contingency: 'Contingencia',
};

// =====================================================
// UNIDADES DE MEDIDA
// =====================================================

export const UNIT_MEASURES = {
  UNID: 'Unid',     // Unidad
  KG: 'Kg',         // Kilogramo
  G: 'g',           // Gramo
  LT: 'Lt',         // Litro
  ML: 'ml',         // Mililitro
  M: 'm',           // Metro
  CM: 'cm',         // Centímetro
  M2: 'm²',         // Metro cuadrado
  M3: 'm³',         // Metro cúbico
  DOCENA: 'Docena', // Docena
  PAR: 'Par',       // Par
  CAJA: 'Caja',     // Caja
  PAQUETE: 'Paq',   // Paquete
  BOLSA: 'Bolsa',   // Bolsa
  OTROS: 'Otros',   // Otros
};

export const UNIT_MEASURE_OPTIONS = [
  { value: 'Unid', label: 'Unidad' },
  { value: 'Kg', label: 'Kilogramo' },
  { value: 'g', label: 'Gramo' },
  { value: 'Lt', label: 'Litro' },
  { value: 'ml', label: 'Mililitro' },
  { value: 'm', label: 'Metro' },
  { value: 'cm', label: 'Centímetro' },
  { value: 'Docena', label: 'Docena' },
  { value: 'Par', label: 'Par' },
  { value: 'Caja', label: 'Caja' },
  { value: 'Paq', label: 'Paquete' },
  { value: 'Bolsa', label: 'Bolsa' },
];

// =====================================================
// INTERFACES
// =====================================================

/**
 * Información del negocio (emisor)
 */
export interface BusinessInfo {
  id: string;
  legalName: string;
  tradeName: string | null;
  idType: IdType;
  idNumber: string;
  activityCode: string | null;
  activityDescription: string | null;
  province: string | null;
  canton: string | null;
  district: string | null;
  neighborhood: string | null;
  otherAddress: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  feEnabled: boolean;
  feEnvironment: 'stag' | 'prod';
  feAtvUser: string | null;
  consecutiveFactura: number;
  consecutiveTiquete: number;
  consecutiveNc: number;
  consecutiveNd: number;
  branchCode: string;
  terminalCode: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Documento electrónico
 */
export interface ElectronicDocument {
  id: string;
  saleId: string | null;
  numericKey: string;
  documentType: DocumentType;
  consecutive: string;
  receptorName: string | null;
  receptorIdType: IdType | null;
  receptorIdNumber: string | null;
  receptorEmail: string | null;
  status: DocumentStatus;
  xmlContent: string | null;
  xmlResponse: string | null;
  haciendaStatus: string | null;
  haciendaMessage: string | null;
  haciendaDetail: string | null;
  emissionDate: string;
  sentDate: string | null;
  responseDate: string | null;
  invoiceMode: InvoiceMode;
  createdAt: string;
  updatedAt: string;
}

/**
 * Datos del receptor para factura electrónica
 */
export interface InvoiceReceptor {
  name: string;
  idType: IdType;
  idNumber: string;
  email?: string;
  phone?: string;
}

/**
 * Línea de detalle para factura electrónica
 */
export interface InvoiceLineDetail {
  lineNumber: number;
  cabysCode: string;
  commercialCode?: string;
  quantity: number;
  unitMeasure: string;
  description: string;
  unitPrice: number;
  totalAmount: number;
  discount?: number;
  discountNature?: string;
  subtotal: number;
  taxCode: string;        // Código de impuesto (01 = IVA)
  taxRateCode: string;    // Código de tarifa (01-08)
  taxRate: number;        // Porcentaje (0, 1, 2, 4, 13)
  taxAmount: number;
  lineTotal: number;
}

/**
 * Resumen de factura
 */
export interface InvoiceSummary {
  currency: string;                    // CRC o USD
  exchangeRate?: number;               // Tipo de cambio si es USD
  totalServicesExempt: number;
  totalServicesExonerated: number;
  totalServicesExcluded: number;
  totalServicesTaxed: number;
  totalGoodsExempt: number;
  totalGoodsExonerated: number;
  totalGoodsExcluded: number;
  totalGoodsTaxed: number;
  totalExempt: number;
  totalExonerated: number;
  totalExcluded: number;
  totalTaxed: number;
  totalSale: number;
  totalDiscount: number;
  totalNetSale: number;
  totalTax: number;
  totalVoucher: number;               // Total del comprobante
}

/**
 * Input para crear documento electrónico
 */
export interface CreateElectronicDocumentInput {
  saleId?: string;
  documentType: DocumentType;
  receptor?: InvoiceReceptor;
  lines: InvoiceLineDetail[];
  summary: InvoiceSummary;
  paymentMethod: string;
  emissionDate?: Date;
}

/**
 * Configuración de facturación electrónica
 */
export interface InvoiceConfig {
  defaultMode: InvoiceMode;
  autoSend: boolean;
  printOnAccept: boolean;
  contingencyEnabled: boolean;
}

/**
 * Generador de claves y consecutivos para Facturación Electrónica
 * Según especificaciones del Ministerio de Hacienda de Costa Rica v4.4
 */

import type { DocumentType } from '../types';

/**
 * Genera la clave numérica de 50 dígitos para un documento electrónico
 *
 * Estructura:
 * - Posiciones 1-3: Código del país (506 = Costa Rica)
 * - Posiciones 4-5: Día
 * - Posiciones 6-7: Mes
 * - Posiciones 8-9: Año (2 dígitos)
 * - Posiciones 10-21: Cédula del emisor (12 dígitos, rellenado con ceros a la izquierda)
 * - Posición 22: Situación del comprobante (8 = Normal)
 * - Posiciones 23-42: Consecutivo del documento (20 caracteres)
 * - Posiciones 43-50: Código de seguridad (8 dígitos aleatorios)
 *
 * @param emissionDate - Fecha de emisión del documento
 * @param emitterIdNumber - Número de cédula del emisor
 * @param consecutive - Consecutivo generado (20 caracteres)
 * @param documentType - Tipo de documento (01, 02, 03, 04, etc.)
 * @returns Clave numérica de 50 dígitos
 */
export function generateNumericKey(
  emissionDate: Date,
  emitterIdNumber: string,
  consecutive: string,
  documentType: DocumentType
): string {
  // Código del país
  const countryCode = '506';

  // Fecha (DDMMAA)
  const day = emissionDate.getDate().toString().padStart(2, '0');
  const month = (emissionDate.getMonth() + 1).toString().padStart(2, '0');
  const year = emissionDate.getFullYear().toString().slice(-2);

  // Cédula del emisor (12 dígitos)
  const emitterId = emitterIdNumber.replace(/[^0-9]/g, '').padStart(12, '0');

  // Situación del comprobante (8 = Normal)
  const situation = '8';

  // Código de seguridad (8 dígitos aleatorios)
  const securityCode = generateSecurityCode();

  // Construir clave
  const numericKey = `${countryCode}${day}${month}${year}${emitterId}${situation}${consecutive}${securityCode}`;

  // Validar longitud (debe ser 50 dígitos)
  if (numericKey.length !== 50) {
    console.error(`[KeyGenerator] Clave inválida: ${numericKey.length} dígitos (esperados: 50)`);
    console.error(`[KeyGenerator] Componentes: país=${countryCode}, fecha=${day}${month}${year}, emisor=${emitterId}, situación=${situation}, consecutivo=${consecutive}, seguridad=${securityCode}`);
  }

  return numericKey;
}

/**
 * Genera el consecutivo de 20 caracteres para un documento
 *
 * Estructura:
 * - Posiciones 1-3: Código de sucursal (001-999)
 * - Posiciones 4-8: Código de terminal (00001-99999)
 * - Posiciones 9-10: Tipo de documento (01, 02, 03, 04, etc.)
 * - Posiciones 11-20: Número consecutivo (10 dígitos, rellenado con ceros)
 *
 * @param branchCode - Código de sucursal (3 dígitos)
 * @param terminalCode - Código de terminal (5 dígitos)
 * @param documentType - Tipo de documento
 * @param consecutiveNumber - Número consecutivo
 * @returns Consecutivo de 20 caracteres
 */
export function generateConsecutive(
  branchCode: string,
  terminalCode: string,
  documentType: DocumentType,
  consecutiveNumber: number
): string {
  // Validar y formatear código de sucursal (3 dígitos)
  const branch = branchCode.replace(/[^0-9]/g, '').padStart(3, '0').slice(-3);

  // Validar y formatear código de terminal (5 dígitos)
  const terminal = terminalCode.replace(/[^0-9]/g, '').padStart(5, '0').slice(-5);

  // Número consecutivo (10 dígitos)
  const consecutive = consecutiveNumber.toString().padStart(10, '0');

  // Construir consecutivo
  const fullConsecutive = `${branch}${terminal}${documentType}${consecutive}`;

  // Validar longitud (debe ser 20 caracteres)
  if (fullConsecutive.length !== 20) {
    console.error(`[KeyGenerator] Consecutivo inválido: ${fullConsecutive.length} caracteres (esperados: 20)`);
  }

  return fullConsecutive;
}

/**
 * Genera un código de seguridad aleatorio de 8 dígitos
 */
export function generateSecurityCode(): string {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
}

/**
 * Valida el formato de una clave numérica
 */
export function validateNumericKey(key: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar longitud
  if (key.length !== 50) {
    errors.push(`Longitud incorrecta: ${key.length} (esperado: 50)`);
  }

  // Validar que solo contenga números
  if (!/^\d+$/.test(key)) {
    errors.push('La clave debe contener solo números');
  }

  // Validar código de país
  if (!key.startsWith('506')) {
    errors.push('Código de país incorrecto (debe ser 506)');
  }

  // Validar situación (posición 22, índice 21)
  if (key.length >= 22 && !['1', '2', '3', '8'].includes(key[21])) {
    errors.push(`Situación inválida: ${key[21]} (esperado: 1, 2, 3 u 8)`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Valida el formato de un consecutivo
 */
export function validateConsecutive(consecutive: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validar longitud
  if (consecutive.length !== 20) {
    errors.push(`Longitud incorrecta: ${consecutive.length} (esperado: 20)`);
  }

  // Validar que solo contenga números
  if (!/^\d+$/.test(consecutive)) {
    errors.push('El consecutivo debe contener solo números');
  }

  // Validar tipo de documento (posiciones 9-10, índices 8-9)
  if (consecutive.length >= 10) {
    const docType = consecutive.substring(8, 10);
    const validTypes = ['01', '02', '03', '04', '05', '06', '07', '08', '09'];
    if (!validTypes.includes(docType)) {
      errors.push(`Tipo de documento inválido: ${docType}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Extrae los componentes de una clave numérica
 */
export function parseNumericKey(key: string): {
  countryCode: string;
  day: string;
  month: string;
  year: string;
  emitterId: string;
  situation: string;
  consecutive: string;
  securityCode: string;
} | null {
  if (key.length !== 50) return null;

  return {
    countryCode: key.substring(0, 3),
    day: key.substring(3, 5),
    month: key.substring(5, 7),
    year: key.substring(7, 9),
    emitterId: key.substring(9, 21),
    situation: key.substring(21, 22),
    consecutive: key.substring(22, 42),
    securityCode: key.substring(42, 50),
  };
}

/**
 * Extrae los componentes de un consecutivo
 */
export function parseConsecutive(consecutive: string): {
  branchCode: string;
  terminalCode: string;
  documentType: string;
  number: string;
} | null {
  if (consecutive.length !== 20) return null;

  return {
    branchCode: consecutive.substring(0, 3),
    terminalCode: consecutive.substring(3, 8),
    documentType: consecutive.substring(8, 10),
    number: consecutive.substring(10, 20),
  };
}

/**
 * Utilidades para cálculos de IVA según legislación de Costa Rica
 * Ley N° 6826 del Impuesto sobre las Ventas
 */

export const TAX_RATES = {
  EXEMPT: 0.00,      // Canasta básica (arroz, frijoles, aceite, azúcar, sal, huevos, leche, pan)
  REDUCED: 4.00,     // Medicamentos con receta médica
  STANDARD: 13.00,   // General (mayoría de productos)
} as const;

export type TaxRateValue = typeof TAX_RATES[keyof typeof TAX_RATES];

export interface TaxCalculation {
  subtotalBeforeTax: number;  // Precio sin IVA
  taxAmount: number;          // Monto de IVA
  total: number;              // Precio con IVA
  taxRate: number;            // Tasa aplicada
}

export interface SaleItemWithTax {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxRate: number;
}

export interface SaleTaxBreakdown {
  subtotal: number;
  totalTax: number;
  total: number;
  byRate: Record<number, { subtotal: number; tax: number; count: number }>;
}

/**
 * Calcula IVA desde precio con impuesto incluido
 * Ejemplo: price=1130, taxRate=13 → subtotal=1000, tax=130
 *
 * Fórmula: subtotal = total / (1 + (tasa/100))
 */
export function calculateTaxFromTotal(
  priceWithTax: number,
  taxRate: TaxRateValue
): TaxCalculation {
  if (taxRate === 0) {
    return {
      subtotalBeforeTax: priceWithTax,
      taxAmount: 0,
      total: priceWithTax,
      taxRate: 0,
    };
  }

  const divisor = 1 + (taxRate / 100);
  const subtotalBeforeTax = priceWithTax / divisor;
  const taxAmount = priceWithTax - subtotalBeforeTax;

  return {
    subtotalBeforeTax: Math.round(subtotalBeforeTax * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: priceWithTax,
    taxRate,
  };
}

/**
 * Calcula IVA desde precio sin impuesto
 * Ejemplo: price=1000, taxRate=13 → tax=130, total=1130
 *
 * Fórmula: total = subtotal * (1 + (tasa/100))
 */
export function calculateTaxFromSubtotal(
  priceBeforeTax: number,
  taxRate: TaxRateValue
): TaxCalculation {
  const taxAmount = (priceBeforeTax * taxRate) / 100;
  const total = priceBeforeTax + taxAmount;

  return {
    subtotalBeforeTax: priceBeforeTax,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round(total * 100) / 100,
    taxRate,
  };
}

/**
 * Calcula desglose de IVA para múltiples items de una venta
 * Agrupa por tasa de IVA y calcula totales
 */
export function calculateSaleTaxBreakdown(items: SaleItemWithTax[]): SaleTaxBreakdown {
  let subtotal = 0;
  let totalTax = 0;
  const byRate: Record<number, { subtotal: number; tax: number; count: number }> = {};

  items.forEach(item => {
    const calc = calculateTaxFromTotal(item.subtotal, item.taxRate);
    subtotal += calc.subtotalBeforeTax;
    totalTax += calc.taxAmount;

    if (!byRate[item.taxRate]) {
      byRate[item.taxRate] = { subtotal: 0, tax: 0, count: 0 };
    }
    byRate[item.taxRate].subtotal += calc.subtotalBeforeTax;
    byRate[item.taxRate].tax += calc.taxAmount;
    byRate[item.taxRate].count += item.quantity;
  });

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    total: Math.round((subtotal + totalTax) * 100) / 100,
    byRate,
  };
}

/**
 * Valida que una tasa de IVA sea válida según legislación de Costa Rica
 */
export function isValidTaxRate(rate: number): rate is TaxRateValue {
  return rate === TAX_RATES.EXEMPT || rate === TAX_RATES.REDUCED || rate === TAX_RATES.STANDARD;
}

/**
 * Obtiene el nombre descriptivo de una tasa de IVA
 */
export function getTaxRateLabel(rate: number): string {
  switch (rate) {
    case TAX_RATES.EXEMPT:
      return '0% - Exento (Canasta Básica)';
    case TAX_RATES.REDUCED:
      return '4% - Reducido (Medicamentos)';
    case TAX_RATES.STANDARD:
      return '13% - General';
    default:
      return `${rate}% - Personalizado`;
  }
}

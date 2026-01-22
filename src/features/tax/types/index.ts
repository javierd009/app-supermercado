import type { SaleItemWithTax as _SaleItemWithTax } from '../utils/taxCalculations';

export type { TaxRateValue, TaxCalculation, SaleItemWithTax, SaleTaxBreakdown } from '../utils/taxCalculations';
export { TAX_RATES } from '../utils/taxCalculations';

/**
 * Props para componentes de desglose de IVA
 */
export interface TaxBreakdownProps {
  items: _SaleItemWithTax[];
  className?: string;
}

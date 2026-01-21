// Components
export { TaxRateSelector } from './components';

// Utils
export { 
  TAX_RATES,
  calculateTaxFromTotal,
  calculateTaxFromSubtotal,
  calculateSaleTaxBreakdown,
  isValidTaxRate,
  getTaxRateLabel
} from './utils/taxCalculations';

// Types
export type {
  TaxRateValue,
  TaxCalculation,
  SaleItemWithTax,
  SaleTaxBreakdown
} from './types';

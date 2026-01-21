export type CashRegisterStatus = 'open' | 'closed';

export interface CashRegister {
  id: string;
  userId: string;
  openedAt: string;
  closedAt: string | null;
  initialAmount: number;
  finalAmount: number | null;
  expectedAmount: number | null;
  difference: number | null;
  notes: string | null;
  status: CashRegisterStatus;
  exchangeRate: number; // Tipo de cambio USD a CRC (ej: 570 = $1 = ₡570)
}

export interface OpenCashRegisterInput {
  userId: string;
  initialAmount: number;
  exchangeRate: number; // Tipo de cambio del día
}

export interface CloseCashRegisterInput {
  registerId: string;
  finalAmount: number;
  notes?: string;
}

export interface CashRegisterSummary {
  register: CashRegister;
  totalSales: number;
  totalCash: number;
  totalCard: number;
  totalSinpe: number;
  salesCount: number;
}

export interface CashRegisterState {
  currentRegister: CashRegister | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface UpdateExchangeRateInput {
  registerId: string;
  newExchangeRate: number;
}

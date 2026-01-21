import type { SaleItem, PaymentMethod } from '@/features/pos/types';

export interface CreateSaleInput {
  cashRegisterId: string;
  userId: string;
  customerId?: string;  // ID del cliente (opcional, default: genérico)
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
  amountReceived: number;
  change: number;
  paymentCurrency?: 'CRC' | 'USD';  // Moneda de pago (default: CRC)
  amountReceivedUsd?: number;  // Monto en dólares si paymentCurrency = USD
  exchangeRateUsed?: number;  // Tipo de cambio usado
}

export interface Sale {
  id: string;
  cashRegisterId: string;
  userId: string;
  customerId?: string;  // ID del cliente
  subtotal: number;  // Total sin IVA
  totalTax: number;  // Total de IVA
  total: number;  // Total con IVA
  paymentMethod: PaymentMethod;
  amountReceived: number;
  changeGiven: number;
  paymentCurrency?: 'CRC' | 'USD';  // Moneda de pago
  amountReceivedUsd?: number;  // Monto en dólares
  exchangeRateUsed?: number;  // Tipo de cambio usado
  createdAt: string;
  syncedAt: string | null;
  canceledAt?: string | null;  // Fecha de anulación
  canceledBy?: string | null;  // Usuario que anuló
  cancelReason?: string | null;  // Razón de anulación
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
}

import type { Product } from '@/features/products/types';

export type PaymentMethod = 'cash' | 'card' | 'sinpe';

export interface SaleItem {
  id: string;  // ID temporal para el carrito
  productId: string;
  code: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  taxRate: number;  // Tasa de IVA (0, 4, o 13)
  taxAmount?: number;  // Monto de IVA calculado
  subtotalBeforeTax?: number;  // Subtotal sin IVA
}

export interface Cart {
  items: SaleItem[];
  subtotal: number;
  discount: number;
  total: number;
}

export interface PaymentInfo {
  method: PaymentMethod;
  amountReceived: number;
  change: number;
}

export interface POSState {
  cart: Cart;
  isPaymentModalOpen: boolean;
  paymentInfo: PaymentInfo | null;
  currentWindowId: string;
  selectedItemId: string | null;  // ID del ítem seleccionado en el carrito (para F9)
  customerId: string;  // ID del cliente seleccionado (default: genérico)
}

// Helpers
export function calculateCartTotals(items: SaleItem[], discount: number = 0): Cart {
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const total = subtotal - discount;

  return {
    items,
    subtotal,
    discount,
    total,
  };
}

export function createSaleItem(product: Product, quantity: number = 1): SaleItem {
  const subtotal = product.price * quantity;

  return {
    id: `${product.id}_${Date.now()}`,
    productId: product.id,
    code: product.code,
    name: product.name,
    quantity,
    unitPrice: product.price,
    subtotal,
    taxRate: product.taxRate,  // Incluir tasa de IVA del producto
  };
}

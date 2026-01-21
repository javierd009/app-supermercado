import { create } from 'zustand';
import type { POSState, SaleItem, PaymentInfo, PaymentMethod } from '../types';
import { calculateCartTotals } from '../types';
import { GENERIC_CUSTOMER_ID } from '@/features/customers';

interface POSStore extends POSState {
  // Actions
  addItem: (item: SaleItem) => void;
  updateItemQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  setDiscount: (discount: number) => void;
  openPaymentModal: () => void;
  closePaymentModal: () => void;
  setPaymentInfo: (info: PaymentInfo) => void;
  setSelectedItemId: (itemId: string | null) => void;
  removeSelectedItem: () => void;
  setCustomerId: (customerId: string) => void;

  // Helpers
  getItemCount: () => number;
  findItemByProductId: (productId: string) => SaleItem | undefined;
}

export const usePOSStore = create<POSStore>((set, get) => ({
  // State inicial
  cart: {
    items: [],
    subtotal: 0,
    discount: 0,
    total: 0,
  },
  isPaymentModalOpen: false,
  paymentInfo: null,
  currentWindowId: 'main',
  selectedItemId: null,
  customerId: GENERIC_CUSTOMER_ID,  // Cliente genérico por defecto

  // Agregar producto al carrito
  addItem: (newItem) => {
    set((state) => {
      const existingItem = state.cart.items.find(
        (item) => item.productId === newItem.productId
      );

      let updatedItems: SaleItem[];

      if (existingItem) {
        // Si ya existe, incrementar cantidad
        updatedItems = state.cart.items.map((item) =>
          item.id === existingItem.id
            ? {
                ...item,
                quantity: item.quantity + newItem.quantity,
                subtotal: (item.quantity + newItem.quantity) * item.unitPrice,
              }
            : item
        );
      } else {
        // Si no existe, agregarlo
        updatedItems = [...state.cart.items, newItem];
      }

      const cart = calculateCartTotals(updatedItems, state.cart.discount);

      return { cart };
    });
  },

  // Actualizar cantidad de un ítem
  updateItemQuantity: (itemId, quantity) => {
    set((state) => {
      if (quantity <= 0) {
        // Si la cantidad es 0 o menor, eliminar el ítem
        const updatedItems = state.cart.items.filter((item) => item.id !== itemId);
        const cart = calculateCartTotals(updatedItems, state.cart.discount);
        return { cart };
      }

      const updatedItems = state.cart.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              quantity,
              subtotal: quantity * item.unitPrice,
            }
          : item
      );

      const cart = calculateCartTotals(updatedItems, state.cart.discount);

      return { cart };
    });
  },

  // Eliminar ítem del carrito
  removeItem: (itemId) => {
    set((state) => {
      const updatedItems = state.cart.items.filter((item) => item.id !== itemId);
      const cart = calculateCartTotals(updatedItems, state.cart.discount);
      return { cart };
    });
  },

  // Limpiar carrito
  clearCart: () =>
    set({
      cart: {
        items: [],
        subtotal: 0,
        discount: 0,
        total: 0,
      },
      paymentInfo: null,
      selectedItemId: null,
      customerId: GENERIC_CUSTOMER_ID,  // Resetear a cliente genérico
    }),

  // Establecer descuento
  setDiscount: (discount) => {
    set((state) => {
      const cart = calculateCartTotals(state.cart.items, discount);
      return { cart };
    });
  },

  // Abrir modal de pago
  openPaymentModal: () => set({ isPaymentModalOpen: true }),

  // Cerrar modal de pago
  closePaymentModal: () => set({ isPaymentModalOpen: false }),

  // Establecer info de pago
  setPaymentInfo: (paymentInfo) => set({ paymentInfo }),

  // Establecer ítem seleccionado
  setSelectedItemId: (itemId) => set({ selectedItemId: itemId }),

  // Eliminar ítem seleccionado (F9)
  removeSelectedItem: () => {
    const { selectedItemId, cart } = get();
    if (selectedItemId) {
      const updatedItems = cart.items.filter((item) => item.id !== selectedItemId);
      const newCart = calculateCartTotals(updatedItems, cart.discount);
      set({ cart: newCart, selectedItemId: null });
    }
  },

  // Establecer cliente seleccionado
  setCustomerId: (customerId) => set({ customerId }),

  // Obtener cantidad total de ítems
  getItemCount: () => {
    const { cart } = get();
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  },

  // Buscar ítem por ID de producto
  findItemByProductId: (productId) => {
    const { cart } = get();
    return cart.items.find((item) => item.productId === productId);
  },
}));

// Selectors
export const selectCart = (state: POSStore) => state.cart;
export const selectCartItems = (state: POSStore) => state.cart.items;
export const selectCartTotal = (state: POSStore) => state.cart.total;
export const selectItemCount = (state: POSStore) => state.getItemCount();

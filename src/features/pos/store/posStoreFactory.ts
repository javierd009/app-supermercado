/**
 * POS Store Factory - Crea instancias independientes de store por ventana
 * Permite múltiples carritos simultáneos sin interferencia
 * Con persistencia en localStorage para sobrevivir recargas de página
 */

import { create, StoreApi, UseBoundStore } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { POSState, SaleItem, PaymentInfo } from '../types';
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

// Mapa de stores por windowId
const storeInstances = new Map<string, UseBoundStore<StoreApi<POSStore>>>();

/**
 * Crea o retorna una instancia de store para una ventana específica
 */
export function createPOSStore(windowId: string): UseBoundStore<StoreApi<POSStore>> {
  // Si ya existe el store para esta ventana, retornarlo
  if (storeInstances.has(windowId)) {
    console.log(`📦 Reutilizando store existente para ventana ${windowId}`);
    return storeInstances.get(windowId)!;
  }

  console.log(`🆕 Creando nuevo store para ventana ${windowId}`);

  // Verificar si hay datos en localStorage para esta ventana
  const persistedData = localStorage.getItem(`pos-window-${windowId}`);
  if (persistedData) {
    console.log(`💾 Datos encontrados en localStorage para ${windowId}:`, persistedData.substring(0, 100) + '...');
  } else {
    console.log(`⚠️ No hay datos en localStorage para ${windowId}`);
  }

  // Crear nuevo store para esta ventana con persistencia
  const store = create<POSStore>()(
    persist(
      (set, get) => ({
        // State inicial
        cart: {
          items: [],
          subtotal: 0,
          discount: 0,
          total: 0,
        },
        isPaymentModalOpen: false,
        paymentInfo: null,
        currentWindowId: windowId,
        selectedItemId: null,
        customerId: GENERIC_CUSTOMER_ID,

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
        customerId: GENERIC_CUSTOMER_ID,
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
  }),
      {
        name: `pos-window-${windowId}`, // Clave única por ventana en localStorage
        storage: createJSONStorage(() => localStorage),
        // Solo persistir estado crítico, no modales ni info de pago temporal
        partialize: (state) => ({
          cart: state.cart,
          customerId: state.customerId,
          selectedItemId: state.selectedItemId,
          currentWindowId: state.currentWindowId,
        }),
        // Callback después de hidratar del localStorage
        onRehydrateStorage: () => {
          return (state, error) => {
            if (error) {
              console.error('Error al recuperar datos del localStorage:', error);
            } else if (state) {
              console.log(`✓ Ventana ${windowId} recuperada del localStorage:`, {
                items: state.cart.items.length,
                total: state.cart.total,
              });
            }
          };
        },
      }
    )
  );

  // Guardar en mapa de instancias
  storeInstances.set(windowId, store);

  return store;
}

/**
 * Destruye el store de una ventana cuando se cierra
 * También limpia su localStorage
 */
export function destroyPOSStore(windowId: string): void {
  storeInstances.delete(windowId);
  // Limpiar localStorage de esta ventana
  localStorage.removeItem(`pos-window-${windowId}`);
}

/**
 * Hook personalizado para obtener el store de la ventana actual
 */
export function usePOSWindowStore(windowId: string) {
  return createPOSStore(windowId);
}

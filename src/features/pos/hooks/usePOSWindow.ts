import { useCallback } from 'react';
import { usePOSWindowStore } from '../store/posStoreFactory';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useCashRegister } from '@/features/cash-register/hooks/useCashRegister';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { salesService } from '@/features/sales/services';
import { printService } from '@/features/printing/services';
import { configService } from '@/features/settings/services/configService';
import { createSaleItem } from '../types';
import type { PaymentMethod } from '../types';
import type { CreateSaleInput } from '@/features/sales/types';
import { useWindowManager } from '../store/windowManager';

/**
 * Hook principal para POS con soporte multi-ventana
 */
export function usePOSWindow(windowId: string) {
  const store = usePOSWindowStore(windowId);
  const { updateWindowState } = useWindowManager();
  const { products } = useProducts();

  const cart = store((state) => state.cart);
  const items = store((state) => state.cart.items);
  const total = store((state) => state.cart.total);
  const itemCount = store((state) => state.getItemCount());
  const isPaymentModalOpen = store((state) => state.isPaymentModalOpen);
  const paymentInfo = store((state) => state.paymentInfo);
  const selectedItemId = store((state) => state.selectedItemId);
  const customerId = store((state) => state.customerId);

  const addItem = store((state) => state.addItem);
  const updateItemQuantityRaw = store((state) => state.updateItemQuantity);
  const removeItem = store((state) => state.removeItem);
  const clearCart = store((state) => state.clearCart);
  const setDiscount = store((state) => state.setDiscount);
  const openPaymentModal = store((state) => state.openPaymentModal);
  const closePaymentModal = store((state) => state.closePaymentModal);
  const setPaymentInfo = store((state) => state.setPaymentInfo);
  const setSelectedItemId = store((state) => state.setSelectedItemId);
  const removeSelectedItem = store((state) => state.removeSelectedItem);
  const setCustomerId = store((state) => state.setCustomerId);

  // Sincronizar cambios con window manager (memoizado para evitar re-renders)
  const syncWithWindowManager = useCallback(() => {
    const currentItemCount = store.getState().getItemCount();
    const currentTotal = store.getState().cart.total;
    const currentCustomerId = store.getState().customerId;

    updateWindowState(windowId, {
      itemCount: currentItemCount,
      total: currentTotal,
      customerId: currentCustomerId,
    });
  }, [windowId, updateWindowState, store]);

  // Wrapper de updateItemQuantity con validación de stock
  const updateItemQuantity = useCallback(async (itemId: string, newQuantity: number) => {
    // Verificar si el control de inventario está habilitado
    const inventoryControlEnabled = await configService.getConfigValue('inventory_control_enabled');
    const shouldCheckStock = inventoryControlEnabled !== 'false';

    if (shouldCheckStock) {
      // Buscar el ítem en el carrito
      const item = items.find(i => i.id === itemId);
      if (item) {
        // Buscar el producto en la lista de productos
        const product = products.find(p => p.id === item.productId);
        if (product && newQuantity > product.stock) {
          alert(`Stock insuficiente. Disponible: ${product.stock}`);
          return;
        }
      }
    }

    // Si pasa la validación, actualizar
    updateItemQuantityRaw(itemId, newQuantity);
    syncWithWindowManager();
  }, [items, products, updateItemQuantityRaw, syncWithWindowManager]);

  return {
    windowId,
    cart,
    items,
    total,
    itemCount,
    isPaymentModalOpen,
    paymentInfo,
    selectedItemId,
    customerId,
    addItem,
    updateItemQuantity,
    removeItem,
    clearCart,
    setDiscount,
    openPaymentModal,
    closePaymentModal,
    setPaymentInfo,
    setSelectedItemId,
    removeSelectedItem,
    setCustomerId,
    syncWithWindowManager,
  };
}

/**
 * Hook para agregar producto por código O nombre (con windowId)
 */
export function useAddProductByCode(windowId: string) {
  const { searchProduct } = useProducts();
  const { addItem, syncWithWindowManager } = usePOSWindow(windowId);

  const addProductByCode = async (query: string, quantity: number = 1): Promise<boolean> => {
    const product = searchProduct(query);

    if (!product) {
      return false;
    }

    // Verificar stock solo si el control de inventario está habilitado
    const inventoryControlEnabled = await configService.getConfigValue('inventory_control_enabled');
    const shouldCheckStock = inventoryControlEnabled !== 'false'; // Por defecto true

    if (shouldCheckStock && product.stock < quantity) {
      alert(`Stock insuficiente. Disponible: ${product.stock}`);
      return false;
    }

    const saleItem = createSaleItem(product, quantity);
    addItem(saleItem);
    syncWithWindowManager();

    return true;
  };

  return { addProductByCode };
}

/**
 * Hook para procesar pago (con windowId)
 */
export function useProcessPayment(windowId: string) {
  const { cart, customerId, clearCart, closePaymentModal, setPaymentInfo, syncWithWindowManager } = usePOSWindow(windowId);
  const { currentRegister } = useCashRegister();
  const { user } = useAuth();

  const processPayment = async (
    method: PaymentMethod,
    amountReceived: number,
    paymentCurrency?: 'CRC' | 'USD',
    amountReceivedUsd?: number,
    exchangeRateUsed?: number
  ) => {
    const change = amountReceived - cart.total;

    if (change < 0) {
      alert('Monto recibido insuficiente');
      return { success: false };
    }

    // Validar que haya caja abierta
    if (!currentRegister) {
      alert('Debe abrir una caja antes de procesar ventas');
      return { success: false };
    }

    // Validar usuario autenticado
    if (!user) {
      alert('Debe iniciar sesión para procesar ventas');
      return { success: false };
    }

    try {
      // Guardar info de pago
      setPaymentInfo({
        method,
        amountReceived,
        change,
      });

      // Preparar datos de la venta
      const saleInput: CreateSaleInput = {
        cashRegisterId: currentRegister.id,
        userId: user.id,
        customerId,
        items: cart.items,
        total: cart.total,
        paymentMethod: method,
        amountReceived,
        change,
        paymentCurrency: paymentCurrency || 'CRC',
        amountReceivedUsd,
        exchangeRateUsed,
      };

      // Guardar venta en Supabase
      const result = await salesService.createSale(saleInput);

      if (!result.success) {
        alert(result.error || 'Error al procesar venta');
        return { success: false };
      }

      // Imprimir ticket
      let printMessage = '';
      if (result.sale?.id) {
        try {
          const saleWithItems = await salesService.getSaleWithItems(result.sale.id);

          if (saleWithItems) {
            const printResult = await printService.printSaleTicket(
              saleWithItems,
              user.username,
              currentRegister.id.substring(0, 8).toUpperCase()
            );

            if (printResult.success) {
              if (printResult.error?.includes('Modo web')) {
                printMessage = '\n\n📋 Modo Web: Ticket generado en consola del navegador (F12 para ver)';
              } else {
                printMessage = '\n\n✓ Ticket impreso correctamente';
              }
            } else {
              printMessage = '\n\n⚠️ Advertencia: ' + (printResult.error || 'No se pudo imprimir el ticket');
            }
          }
        } catch (printError: any) {
          console.error('Print error:', printError);
          printMessage = '\n\n⚠️ Error al imprimir: ' + printError.message;
        }
      }

      // Limpiar carrito
      clearCart();
      closePaymentModal();
      syncWithWindowManager();

      return {
        success: true,
        change,
        saleId: result.sale?.id,
        printMessage,
      };
    } catch (error: any) {
      console.error('Process payment error:', error);
      alert(error.message || 'Error al procesar venta');
      return { success: false };
    }
  };

  return { processPayment };
}

/**
 * Hook para búsqueda de productos con auto-focus (con windowId)
 */
export function useProductSearch(windowId: string) {
  const { searchProduct } = useProducts();
  const { addItem, syncWithWindowManager } = usePOSWindow(windowId);

  const searchAndAdd = (query: string): boolean => {
    const product = searchProduct(query);

    if (!product) {
      return false;
    }

    const saleItem = createSaleItem(product, 1);
    addItem(saleItem);
    syncWithWindowManager();

    return true;
  };

  return { searchAndAdd };
}

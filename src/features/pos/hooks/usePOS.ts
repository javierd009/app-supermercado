import { usePOSStore, selectCart, selectCartItems, selectCartTotal, selectItemCount } from '../store/posStore';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useCashRegister } from '@/features/cash-register/hooks/useCashRegister';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { salesService } from '@/features/sales/services';
import { printService } from '@/features/printing/services';
import { configService } from '@/features/settings/services/configService';
import { createSaleItem } from '../types';
import type { PaymentMethod } from '../types';
import type { CreateSaleInput } from '@/features/sales/types';

/**
 * Hook principal para POS
 */
export function usePOS() {
  const cart = usePOSStore(selectCart);
  const items = usePOSStore(selectCartItems);
  const total = usePOSStore(selectCartTotal);
  const itemCount = usePOSStore(selectItemCount);
  const isPaymentModalOpen = usePOSStore((state) => state.isPaymentModalOpen);
  const paymentInfo = usePOSStore((state) => state.paymentInfo);
  const selectedItemId = usePOSStore((state) => state.selectedItemId);
  const customerId = usePOSStore((state) => state.customerId);

  const addItem = usePOSStore((state) => state.addItem);
  const updateItemQuantity = usePOSStore((state) => state.updateItemQuantity);
  const removeItem = usePOSStore((state) => state.removeItem);
  const clearCart = usePOSStore((state) => state.clearCart);
  const setDiscount = usePOSStore((state) => state.setDiscount);
  const openPaymentModal = usePOSStore((state) => state.openPaymentModal);
  const closePaymentModal = usePOSStore((state) => state.closePaymentModal);
  const setPaymentInfo = usePOSStore((state) => state.setPaymentInfo);
  const setSelectedItemId = usePOSStore((state) => state.setSelectedItemId);
  const removeSelectedItem = usePOSStore((state) => state.removeSelectedItem);
  const setCustomerId = usePOSStore((state) => state.setCustomerId);

  return {
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
  };
}

/**
 * Hook para agregar producto por código O nombre
 */
export function useAddProductByCode() {
  const { searchProduct } = useProducts();
  const { addItem } = usePOS();

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

    return true;
  };

  return { addProductByCode };
}

/**
 * Hook para procesar pago
 */
export function useProcessPayment() {
  const { cart, customerId, clearCart, closePaymentModal, setPaymentInfo } = usePOS();
  const { currentRegister } = useCashRegister();
  const { user } = useAuth();

  const processPayment = async (method: PaymentMethod, amountReceived: number) => {
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
        customerId,  // Incluir cliente seleccionado
        items: cart.items,
        total: cart.total,
        paymentMethod: method,
        amountReceived,
        change,
      };

      // Guardar venta en Supabase (también actualiza stock)
      const result = await salesService.createSale(saleInput);

      if (!result.success) {
        alert(result.error || 'Error al procesar venta');
        return { success: false };
      }

      // Imprimir ticket
      if (result.sale?.id) {
        try {
          // Obtener venta completa con items
          const saleWithItems = await salesService.getSaleWithItems(result.sale.id);

          if (saleWithItems) {
            // Imprimir ticket
            const printResult = await printService.printSaleTicket(
              saleWithItems,
              user.username,
              currentRegister.id.substring(0, 8).toUpperCase()
            );

            if (!printResult.success) {
              console.warn('Print warning:', printResult.error);
              // No bloqueamos la venta si falla la impresión
              // El usuario puede reimprimir después
            }
          }
        } catch (printError: any) {
          console.error('Print error:', printError);
          // No bloqueamos la venta si falla la impresión
        }
      }

      // Limpiar carrito
      clearCart();
      closePaymentModal();

      return {
        success: true,
        change,
        saleId: result.sale?.id,
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
 * Hook para búsqueda de productos con auto-focus
 */
export function useProductSearch() {
  const { searchProduct } = useProducts();
  const { addItem } = usePOS();

  const searchAndAdd = (query: string): boolean => {
    const product = searchProduct(query);

    if (!product) {
      return false;
    }

    const saleItem = createSaleItem(product, 1);
    addItem(saleItem);

    return true;
  };

  return { searchAndAdd };
}

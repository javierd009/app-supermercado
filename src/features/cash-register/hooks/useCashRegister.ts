import { useEffect, useState } from 'react';
import { useCashRegisterStore, selectCurrentRegister, selectIsOpen } from '../store/cashRegisterStore';
import { cashRegisterService } from '../services/cashRegisterService';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { OpenCashRegisterInput, CloseCashRegisterInput, CashRegister } from '../types';

/**
 * Hook principal para cash register
 */
export function useCashRegister() {
  const currentRegister = useCashRegisterStore(selectCurrentRegister);
  const isOpen = useCashRegisterStore(selectIsOpen);
  const isLoading = useCashRegisterStore((state) => state.isLoading);
  const error = useCashRegisterStore((state) => state.error);

  const setCurrentRegister = useCashRegisterStore((state) => state.setCurrentRegister);
  const setLoading = useCashRegisterStore((state) => state.setLoading);
  const setError = useCashRegisterStore((state) => state.setError);
  const clearRegister = useCashRegisterStore((state) => state.clearRegister);

  return {
    currentRegister,
    isOpen,
    isLoading,
    error,
    setCurrentRegister,
    setLoading,
    setError,
    clearRegister,
  };
}

/**
 * Hook para cargar caja abierta al iniciar sesión
 */
export function useLoadCurrentRegister() {
  const { user } = useAuth();
  const { setCurrentRegister, setLoading, setError } = useCashRegister();

  useEffect(() => {
    const loadRegister = async () => {
      if (!user?.id) return;

      setLoading(true);

      try {
        const register = await cashRegisterService.getOpenRegister(user.id);
        setCurrentRegister(register);
      } catch (err: any) {
        setError(err.message || 'Error al cargar caja');
      } finally {
        setLoading(false);
      }
    };

    loadRegister();
  }, [user?.id, setCurrentRegister, setLoading, setError]);
}

/**
 * Hook para abrir caja
 */
export function useOpenCashRegister() {
  const { user } = useAuth();
  const { setCurrentRegister, setLoading, setError } = useCashRegister();

  const openRegister = async (initialAmount: number, exchangeRate: number = 570) => {
    if (!user?.id) {
      setError('Usuario no autenticado');
      return { success: false, error: 'Usuario no autenticado' };
    }

    setLoading(true);
    setError(null);

    const input: OpenCashRegisterInput = {
      userId: user.id,
      initialAmount,
      exchangeRate,
    };

    const result = await cashRegisterService.openRegister(input);

    if (result.success && result.register) {
      setCurrentRegister(result.register);
    } else {
      setError(result.error || 'Error al abrir caja');
    }

    setLoading(false);

    return result;
  };

  return { openRegister };
}

/**
 * Hook para cerrar caja
 */
export function useCloseCashRegister() {
  const { currentRegister, setCurrentRegister, setLoading, setError } = useCashRegister();

  const closeRegister = async (finalAmount: number, notes?: string) => {
    if (!currentRegister) {
      setError('No hay caja abierta');
      return { success: false, error: 'No hay caja abierta' };
    }

    setLoading(true);
    setError(null);

    const input: CloseCashRegisterInput = {
      registerId: currentRegister.id,
      finalAmount,
      notes,
    };

    const result = await cashRegisterService.closeRegister(input);

    if (result.success && result.register) {
      setCurrentRegister(result.register);
      // Después de cerrar, limpiar el store
      setTimeout(() => {
        setCurrentRegister(null);
      }, 100);
    } else {
      setError(result.error || 'Error al cerrar caja');
    }

    setLoading(false);

    return result;
  };

  return { closeRegister };
}

/**
 * Hook para obtener resumen de caja actual
 */
export function useRegisterSummary() {
  const { currentRegister } = useCashRegister();

  const getSummary = async (registerId?: string) => {
    const idToUse = registerId || currentRegister?.id;
    if (!idToUse) return null;

    return await cashRegisterService.getRegisterSummary(idToUse);
  };

  return { getSummary };
}

/**
 * Hook para requerir caja abierta
 * Redirige o muestra mensaje si no hay caja abierta
 */
export function useRequireOpenRegister() {
  const { isOpen, currentRegister } = useCashRegister();

  return {
    isOpen,
    currentRegister,
    canProcessSale: isOpen && currentRegister !== null,
  };
}

/**
 * Hook para actualizar el tipo de cambio (solo super_admin)
 */
export function useUpdateExchangeRate() {
  const { currentRegister, setCurrentRegister, setError } = useCashRegister();

  const updateExchangeRate = async (newRate: number) => {
    if (!currentRegister) {
      setError('No hay caja abierta');
      return { success: false, error: 'No hay caja abierta' };
    }

    const result = await cashRegisterService.updateExchangeRate(
      currentRegister.id,
      newRate
    );

    if (result.success) {
      // Actualizar el store local
      setCurrentRegister({
        ...currentRegister,
        exchangeRate: newRate,
      });
    } else {
      setError(result.error || 'Error al actualizar tipo de cambio');
    }

    return result;
  };

  return { updateExchangeRate };
}

/**
 * Hook para administradores - ver todas las cajas abiertas
 */
export function useAllOpenRegisters() {
  const [registers, setRegisters] = useState<Array<CashRegister & { username?: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllOpenRegisters = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await cashRegisterService.getAllOpenRegisters();
      setRegisters(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar cajas abiertas');
    } finally {
      setIsLoading(false);
    }
  };

  return { registers, isLoading, error, loadAllOpenRegisters };
}

/**
 * Hook para administradores - cerrar cualquier caja
 */
export function useAdminCloseRegister() {
  const { user } = useAuth();

  const adminCloseRegister = async (
    registerId: string,
    finalAmount: number,
    notes?: string
  ) => {
    return await cashRegisterService.adminCloseRegister(
      registerId,
      finalAmount,
      notes,
      user?.id
    );
  };

  return { adminCloseRegister };
}

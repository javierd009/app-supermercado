import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CashRegister, CashRegisterState } from '../types';

interface CashRegisterStore extends CashRegisterState {
  // Actions
  setCurrentRegister: (register: CashRegister | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearRegister: () => void;
}

export const useCashRegisterStore = create<CashRegisterStore>()(
  persist(
    (set, get) => ({
      // State inicial
      currentRegister: null,
      isOpen: false,
      isLoading: false,
      error: null,

      // Establecer caja actual
      setCurrentRegister: (register) =>
        set({
          currentRegister: register,
          isOpen: register?.status === 'open',
          error: null,
        }),

      // Establecer loading
      setLoading: (isLoading) => set({ isLoading }),

      // Establecer error
      setError: (error) => set({ error, isLoading: false }),

      // Limpiar caja (al cerrar sesión)
      clearRegister: () =>
        set({
          currentRegister: null,
          isOpen: false,
          error: null,
        }),
    }),
    {
      name: 'sabrosita-cash-register-storage',
      partialize: (state) => ({
        currentRegister: state.currentRegister,
        isOpen: state.isOpen,
      }),
    }
  )
);

// Selectors
export const selectCurrentRegister = (state: CashRegisterStore) => state.currentRegister;
export const selectIsOpen = (state: CashRegisterStore) => state.isOpen;

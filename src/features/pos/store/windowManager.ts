/**
 * Window Manager - Sistema de gestión de múltiples ventanas POS
 * Permite abrir y gestionar múltiples instancias de POS simultáneamente
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { POSStore } from './posStore';

export interface POSWindowState {
  id: string;
  title: string;
  userId: string; // Usuario que creó la ventana
  createdAt: string;
  lastActivity: string;
  customerId?: string;
  itemCount: number;
  total: number;
}

interface WindowManagerStore {
  windows: Map<string, POSWindowState>;
  activeWindowId: string | null;

  // Actions
  createWindow: (userId: string) => string;
  closeWindow: (windowId: string) => void;
  setActiveWindow: (windowId: string) => void;
  updateWindowState: (windowId: string, state: Partial<POSWindowState>) => void;
  getWindowState: (windowId: string) => POSWindowState | undefined;
  getAllWindows: () => POSWindowState[];
  getWindowsByUser: (userId: string) => POSWindowState[];
  clearAllWindows: () => void;
}

export const useWindowManager = create<WindowManagerStore>()(
  persist(
    (set, get) => ({
      windows: new Map(),
      activeWindowId: null,

      createWindow: (userId: string) => {
        const windowId = `pos-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const userWindows = Array.from(get().windows.values()).filter(w => w.userId === userId);
        const newWindow: POSWindowState = {
          id: windowId,
          title: `Cliente ${userWindows.length + 1}`,
          userId,
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          itemCount: 0,
          total: 0,
        };

        set((state) => ({
          windows: new Map(state.windows).set(windowId, newWindow),
          activeWindowId: windowId,
        }));

        return windowId;
      },

      closeWindow: (windowId: string) => {
        set((state) => {
          const newWindows = new Map(state.windows);
          newWindows.delete(windowId);

          // Si cerramos la ventana activa, activar la primera disponible
          let newActiveWindowId = state.activeWindowId;
          if (state.activeWindowId === windowId) {
            const remaining = Array.from(newWindows.keys());
            newActiveWindowId = remaining.length > 0 ? remaining[0] : null;
          }

          return {
            windows: newWindows,
            activeWindowId: newActiveWindowId,
          };
        });
      },

      setActiveWindow: (windowId: string) => {
        set({ activeWindowId: windowId });
      },

      updateWindowState: (windowId: string, state: Partial<POSWindowState>) => {
        set((prev) => {
          const window = prev.windows.get(windowId);
          if (!window) return prev;

          const updatedWindow = {
            ...window,
            ...state,
            lastActivity: new Date().toISOString(),
          };

          const newWindows = new Map(prev.windows);
          newWindows.set(windowId, updatedWindow);

          return { windows: newWindows };
        });
      },

      getWindowState: (windowId: string) => {
        return get().windows.get(windowId);
      },

      getAllWindows: () => {
        return Array.from(get().windows.values()).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },

      getWindowsByUser: (userId: string) => {
        return Array.from(get().windows.values())
          .filter((window) => window.userId === userId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      clearAllWindows: () => {
        set({
          windows: new Map(),
          activeWindowId: null,
        });
      },
    }),
    {
      name: 'pos-window-manager',
      // Serialización personalizada para Map
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              windows: new Map(state.windows),
            },
          };
        },
        setItem: (name, value) => {
          const str = JSON.stringify({
            state: {
              ...value.state,
              windows: Array.from(value.state.windows.entries()),
            },
          });
          localStorage.setItem(name, str);
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);

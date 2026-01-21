// Tipos globales para Electron APIs

declare global {
  interface PrintData {
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      subtotal: number;
    }>;
    total: number;
    paymentMethod: string;
    amountReceived: number;
    change: number;
    cashier: string;
    ticketNumber: string;
  }

  interface ElectronAPI {
    db: {
      query: (query: string, params?: any[]) => Promise<any>;
    };
    printer: {
      print: (data: string) => Promise<{ success: boolean; error?: string }>;
    };
    scanner: {
      listen: () => Promise<{ success: boolean }>;
      onScan: (callback: (data: string) => void) => void;
    };
    window: {
      createNew: () => Promise<{ success: boolean; windowId?: number; error?: string }>;
    };
    platform: string;
    isElectron: boolean;
  }

  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};

import { useEffect, useState } from 'react';

/**
 * Hook para acceder a las APIs de Electron de forma segura
 * Detecta si está corriendo en Electron o en navegador web
 */
export function useElectron() {
  const [isElectron, setIsElectron] = useState(false);
  const [api, setApi] = useState<ElectronAPI | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI) {
      setIsElectron(true);
      setApi(window.electronAPI);
    }
  }, []);

  return {
    isElectron,
    api,
  };
}

/**
 * Hook para escuchar eventos del scanner de código de barras
 */
export function useBarcodeScanner(onScan: (barcode: string) => void) {
  const { api, isElectron } = useElectron();

  useEffect(() => {
    if (!isElectron || !api) return;

    // Iniciar listener
    api.scanner.listen();

    // Escuchar scans
    api.scanner.onScan((data) => {
      console.log('Barcode scanned:', data);
      onScan(data);
    });
  }, [isElectron, api, onScan]);
}

/**
 * Hook para detectar atajos de teclado (F1-F10, Esc, etc.)
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key;

      // Mapeo de teclas
      const keyMap: Record<string, string> = {
        F1: 'F1',
        F2: 'F2',
        F3: 'F3',
        F4: 'F4',
        F5: 'F5',
        F6: 'F6',
        F7: 'F7',
        F8: 'F8',
        F9: 'F9',
        F10: 'F10',
        Escape: 'Escape',
        Enter: 'Enter',
      };

      const mappedKey = keyMap[key];
      if (mappedKey && shortcuts[mappedKey]) {
        event.preventDefault();
        shortcuts[mappedKey]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

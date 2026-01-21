import { useState, useEffect, useRef, useCallback } from 'react';
import type { ScannerConfig, ScanEvent } from '../types';
import { DEFAULT_SCANNER_CONFIG } from '../types';

/**
 * Hook para detectar input de scanner vs teclado manual
 */
export function useScanner(config: Partial<ScannerConfig> = {}) {
  const fullConfig = { ...DEFAULT_SCANNER_CONFIG, ...config };

  const [lastScan, setLastScan] = useState<ScanEvent | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  const scanBuffer = useRef<string>('');
  const lastKeyTime = useRef<number>(0);
  const scanTimeout = useRef<NodeJS.Timeout | null>(null);

  /**
   * Detectar si el input es de scanner basado en velocidad de tipeo
   */
  const isScannerInput = useCallback((charDelay: number): boolean => {
    return charDelay < (fullConfig.scanDelay || 50);
  }, [fullConfig.scanDelay]);

  /**
   * Procesar carácter
   */
  const handleKeyPress = useCallback((char: string) => {
    const now = Date.now();
    const delay = now - lastKeyTime.current;

    // Determinar si es scanner por velocidad
    const fromScanner = lastKeyTime.current > 0 && isScannerInput(delay);

    if (fromScanner) {
      setIsScanning(true);
    }

    // Agregar al buffer
    scanBuffer.current += char;
    lastKeyTime.current = now;

    // Clear timeout anterior
    if (scanTimeout.current) {
      clearTimeout(scanTimeout.current);
    }

    // Esperar a que termine el escaneo
    scanTimeout.current = setTimeout(() => {
      const code = scanBuffer.current.trim();

      // Remover prefijo y sufijo si existen
      let cleanCode = code;
      if (fullConfig.prefix && cleanCode.startsWith(fullConfig.prefix)) {
        cleanCode = cleanCode.substring(fullConfig.prefix.length);
      }
      if (fullConfig.suffix && cleanCode.endsWith(fullConfig.suffix)) {
        cleanCode = cleanCode.substring(0, cleanCode.length - fullConfig.suffix.length);
      }

      // Validar longitud
      const isValid = cleanCode.length >= (fullConfig.minLength || 0) &&
                     cleanCode.length <= (fullConfig.maxLength || 999);

      if (isValid && cleanCode) {
        setLastScan({
          code: cleanCode,
          timestamp: now,
          source: fromScanner ? 'scanner' : 'keyboard',
        });
      }

      // Reset
      scanBuffer.current = '';
      lastKeyTime.current = 0;
      setIsScanning(false);
    }, 100);
  }, [fullConfig, isScannerInput]);

  /**
   * Reset detector
   */
  const reset = useCallback(() => {
    scanBuffer.current = '';
    lastKeyTime.current = 0;
    setIsScanning(false);
    setLastScan(null);
  }, []);

  return {
    lastScan,
    isScanning,
    handleKeyPress,
    reset,
  };
}

/**
 * Hook simplificado para detectar códigos escaneados
 */
export function useScanDetection(
  onScan: (code: string) => void,
  config?: Partial<ScannerConfig>
) {
  const { lastScan, isScanning } = useScanner(config);

  useEffect(() => {
    if (lastScan && lastScan.source === 'scanner') {
      onScan(lastScan.code);
    }
  }, [lastScan, onScan]);

  return { isScanning };
}

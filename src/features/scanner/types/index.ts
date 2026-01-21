export interface ScannerConfig {
  prefix?: string;        // Prefijo del scanner (ej: "SCAN:")
  suffix?: string;        // Sufijo del scanner (ej: Enter, Tab)
  minLength?: number;     // Longitud mínima de código
  maxLength?: number;     // Longitud máxima de código
  scanDelay?: number;     // Delay entre caracteres para detectar scanner (ms)
}

export interface ScanEvent {
  code: string;
  timestamp: number;
  source: 'scanner' | 'keyboard';
}

export const DEFAULT_SCANNER_CONFIG: ScannerConfig = {
  prefix: '',
  suffix: '\n', // Enter
  minLength: 3,
  maxLength: 50,
  scanDelay: 50, // Si se escribe más rápido que 50ms entre chars, es scanner
};

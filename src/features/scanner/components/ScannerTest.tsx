'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';
import { useScanner } from '../hooks/useScanner';

export function ScannerTest() {
  const [scannedCodes, setScannedCodes] = useState<Array<{
    code: string;
    source: 'scanner' | 'keyboard';
    timestamp: Date;
  }>>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const { lastScan, isScanning, reset } = useScanner();

  // Registrar códigos escaneados
  useEffect(() => {
    if (lastScan) {
      setScannedCodes(prev => [
        {
          code: lastScan.code,
          source: lastScan.source,
          timestamp: new Date(lastScan.timestamp),
        },
        ...prev,
      ].slice(0, 10)); // Mantener últimos 10
    }
  }, [lastScan]);

  const clearHistory = () => {
    setScannedCodes([]);
    reset();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          Test de Scanner
        </h2>
        <p className="text-sm text-gray-600">
          Escanea un código de barras para verificar configuración
        </p>
      </div>

      {/* Estado del scanner */}
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className={`h-4 w-4 rounded-full ${isScanning ? 'animate-pulse bg-green-500' : 'bg-gray-300'}`}></div>
          <span className="text-lg font-medium text-gray-700">
            {isScanning ? '🔍 Escaneando...' : '⏳ Esperando escaneo'}
          </span>
        </div>
      </div>

      {/* Input de prueba */}
      <div>
        <Input
          ref={inputRef}
          label="Campo de Prueba"
          placeholder="Escanee o escriba aquí..."
          helperText="Los códigos de scanner se detectan automáticamente"
          autoFocus
        />
      </div>

      {/* Último código */}
      {lastScan && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Último código:</p>
              <p className="text-2xl font-mono font-bold text-gray-900">
                {lastScan.code}
              </p>
            </div>
            <div className="text-right">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                lastScan.source === 'scanner'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {lastScan.source === 'scanner' ? '📷 Scanner' : '⌨️ Teclado'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Historial */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Historial ({scannedCodes.length})
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            disabled={scannedCodes.length === 0}
          >
            Limpiar
          </Button>
        </div>

        {scannedCodes.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-gray-500">No hay códigos escaneados aún</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scannedCodes.map((scan, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-lg">
                    {scan.source === 'scanner' ? '📷' : '⌨️'}
                  </span>
                  <div>
                    <p className="font-mono text-sm font-medium text-gray-900">
                      {scan.code}
                    </p>
                    <p className="text-xs text-gray-500">
                      {scan.timestamp.toLocaleTimeString('es-CR')}
                    </p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-xs ${
                  scan.source === 'scanner'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {scan.source}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instrucciones */}
      <div className="rounded-lg bg-blue-50 p-4">
        <h4 className="mb-2 font-semibold text-blue-900">
          💡 Instrucciones
        </h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>• Conecte el scanner USB al computador</li>
          <li>• Haga clic en el campo de prueba arriba</li>
          <li>• Escanee un código de barras</li>
          <li>• Verifique que se detecte como "Scanner"</li>
          <li>• Si se detecta como "Teclado", ajuste la configuración del scanner</li>
        </ul>
      </div>

      {/* Info técnica */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h4 className="mb-2 text-sm font-semibold text-gray-700">
          ⚙️ Configuración Actual
        </h4>
        <dl className="space-y-1 text-xs text-gray-600">
          <div className="flex justify-between">
            <dt>Delay de detección:</dt>
            <dd className="font-mono">50ms</dd>
          </div>
          <div className="flex justify-between">
            <dt>Longitud mínima:</dt>
            <dd className="font-mono">3 caracteres</dd>
          </div>
          <div className="flex justify-between">
            <dt>Longitud máxima:</dt>
            <dd className="font-mono">50 caracteres</dd>
          </div>
          <div className="flex justify-between">
            <dt>Sufijo esperado:</dt>
            <dd className="font-mono">Enter (\\n)</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

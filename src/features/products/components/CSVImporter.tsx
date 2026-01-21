'use client';

import { useState, useRef } from 'react';
import { Button } from '@/shared/components/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/Card';
import { useImportCSV } from '../hooks/useProducts';
import { parseCSV, readFileAsText } from '../services/csvParser';
import type { CSVImportResult } from '../types';

interface CSVImporterProps {
  onSuccess: () => void;
}

export function CSVImporter({ onSuccess }: CSVImporterProps) {
  const { importCSV } = useImportCSV();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<CSVImportResult | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setResult(null);
    setIsProcessing(true);

    try {
      // Leer archivo
      const content = await readFileAsText(file);

      // Parsear CSV
      const rows = parseCSV(content);

      if (rows.length === 0) {
        setResult({
          success: false,
          imported: 0,
          failed: 0,
          errors: [{ row: 0, error: 'El archivo CSV está vacío o no tiene el formato correcto', data: null }],
        });
        setIsProcessing(false);
        return;
      }

      // Importar a Supabase
      const importResult = await importCSV(rows);
      setResult(importResult);

      if (importResult.success) {
        onSuccess();
      }
    } catch (err: any) {
      setResult({
        success: false,
        imported: 0,
        failed: 0,
        errors: [{ row: 0, error: err.message || 'Error al leer archivo', data: null }],
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setFileName(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar desde Mónica 8.5</CardTitle>
        <CardDescription>
          Sube un archivo CSV exportado desde Mónica 8.5 para importar tus productos
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Formato esperado */}
        <div className="rounded-md bg-blue-50 p-4">
          <h4 className="mb-2 text-sm font-medium text-blue-900">
            Formato CSV esperado:
          </h4>
          <p className="text-sm text-blue-700">
            El archivo debe tener columnas como: <code className="rounded bg-blue-100 px-1">codigo</code>,{' '}
            <code className="rounded bg-blue-100 px-1">nombre</code>,{' '}
            <code className="rounded bg-blue-100 px-1">cantidad</code>,{' '}
            <code className="rounded bg-blue-100 px-1">costo</code>,{' '}
            <code className="rounded bg-blue-100 px-1">precio</code>
          </p>
          <p className="mt-2 text-xs text-blue-600">
            El sistema detecta automáticamente variaciones de nombres (español/inglés)
          </p>
        </div>

        {/* Input de archivo */}
        {!result && (
          <div className="flex items-center justify-center">
            <label className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 hover:border-blue-500 hover:bg-blue-50">
              <div className="text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="mt-4 flex text-sm text-gray-600">
                  <span className="relative cursor-pointer rounded-md font-medium text-blue-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:text-blue-500">
                    Selecciona un archivo
                  </span>
                  <p className="pl-1">o arrastra aquí</p>
                </div>
                <p className="text-xs text-gray-500">CSV hasta 10MB</p>
                {fileName && (
                  <p className="mt-2 text-sm font-medium text-gray-900">{fileName}</p>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={isProcessing}
              />
            </label>
          </div>
        )}

        {/* Loading */}
        {isProcessing && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Importando productos...</p>
            </div>
          </div>
        )}

        {/* Resultado */}
        {result && !isProcessing && (
          <div className="space-y-4">
            {/* Resumen */}
            <div
              className={`rounded-md p-4 ${
                result.success ? 'bg-green-50' : 'bg-yellow-50'
              }`}
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  {result.success ? (
                    <svg
                      className="h-5 w-5 text-green-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <div className="ml-3">
                  <h3
                    className={`text-sm font-medium ${
                      result.success ? 'text-green-800' : 'text-yellow-800'
                    }`}
                  >
                    {result.success
                      ? 'Importación completada exitosamente'
                      : 'Importación completada con errores'}
                  </h3>
                  <div
                    className={`mt-2 text-sm ${
                      result.success ? 'text-green-700' : 'text-yellow-700'
                    }`}
                  >
                    <ul className="list-disc space-y-1 pl-5">
                      <li>
                        <strong>{result.imported}</strong> productos importados
                      </li>
                      {result.failed > 0 && (
                        <li>
                          <strong>{result.failed}</strong> errores encontrados
                        </li>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Errores detallados */}
            {result.errors.length > 0 && (
              <div className="max-h-60 overflow-y-auto rounded-md bg-red-50 p-4">
                <h4 className="mb-2 text-sm font-medium text-red-800">
                  Errores ({result.errors.length}):
                </h4>
                <ul className="space-y-2 text-sm text-red-700">
                  {result.errors.slice(0, 10).map((err, idx) => (
                    <li key={idx} className="flex">
                      <span className="mr-2 font-medium">Fila {err.row}:</span>
                      <span>{err.error}</span>
                    </li>
                  ))}
                  {result.errors.length > 10 && (
                    <li className="text-xs italic">
                      ... y {result.errors.length - 10} errores más
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={handleReset}>
                Importar Otro Archivo
              </Button>
              {result.success && (
                <Button variant="primary" onClick={onSuccess}>
                  Continuar
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

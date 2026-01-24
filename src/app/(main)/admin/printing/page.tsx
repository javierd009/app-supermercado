'use client';

import { useState, useEffect } from 'react';
import { salesService } from '@/features/sales/services';
import { printService } from '@/features/printing/services';
import { BackToDashboard } from '@/shared/components/BackToDashboard';
import { useDialog } from '@/shared/components/ConfirmDialog';
import { Printer, RefreshCw, Check, AlertCircle } from 'lucide-react';
import type { Sale } from '@/features/sales/types';

interface PrinterInfo {
  name: string;
  displayName: string;
  description: string;
  status: number;
  isDefault: boolean;
}

export default function PrintingPage() {
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState<string | null>(null);
  const [isLoadingPrinters, setIsLoadingPrinters] = useState(false);
  const [isElectron, setIsElectron] = useState(false);
  const dialog = useDialog();

  useEffect(() => {
    loadRecentSales();
    checkElectronAndLoadPrinters();
  }, []);

  const checkElectronAndLoadPrinters = async () => {
    if (typeof window !== 'undefined' && window.electronAPI?.printer?.list) {
      setIsElectron(true);
      await loadPrinters();
    }
  };

  const loadPrinters = async () => {
    if (!window.electronAPI?.printer?.list) return;

    setIsLoadingPrinters(true);
    try {
      const result = await window.electronAPI.printer.list();
      if (result.success) {
        setPrinters(result.printers || []);
        setSelectedPrinter(result.selectedPrinter || null);
      }
    } catch (error) {
      console.error('Error loading printers:', error);
    }
    setIsLoadingPrinters(false);
  };

  const handleSelectPrinter = async (printerName: string) => {
    if (!window.electronAPI?.printer?.select) return;

    try {
      const result = await window.electronAPI.printer.select(printerName);
      if (result.success) {
        setSelectedPrinter(printerName);
        await dialog.success(`Impresora "${printerName}" seleccionada correctamente`, 'Impresora Configurada');
      }
    } catch (error) {
      await dialog.error('No se pudo seleccionar la impresora', 'Error');
    }
  };

  const loadRecentSales = async () => {
    setIsLoading(true);
    const sales = await salesService.getRecentSales(20);
    setRecentSales(sales.filter((s) => !s.canceledAt)); // Solo ventas activas
    setIsLoading(false);
  };

  const handleTestPrint = async () => {
    setIsPrinting(true);
    const result = await printService.printTestTicket();

    if (result.success) {
      await dialog.success('El ticket de prueba se envió a la impresora', 'Impresión Exitosa');
    } else {
      await dialog.error(result.error || 'Error desconocido', 'Error de Impresión');
    }

    setIsPrinting(false);
  };

  const handleReprint = async (saleId: string) => {
    const sale = await salesService.getSaleWithItems(saleId);
    if (!sale) {
      await dialog.error('No se pudo cargar la información de la venta', 'Error');
      return;
    }

    const result = await printService.printSaleTicket(
      sale,
      'Cajero',
      'REIMPRESIÓN'
    );

    if (result.success) {
      await dialog.success('El ticket se reenvió a la impresora', 'Reimpresión Exitosa');
    } else {
      await dialog.error(result.error || 'Error desconocido', 'Error de Impresión');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-CR', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-50 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <BackToDashboard />
          <div className="mt-6">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Impresión y Tickets
            </h1>
            <p className="mt-2 text-lg text-slate-600">
              Pruebe la impresora y reimprima tickets anteriores
            </p>
          </div>
        </div>

        {/* Printer Selection Card - Solo visible en Electron */}
        {isElectron && (
          <div className="rounded-2xl bg-white shadow-xl border border-slate-200/60 overflow-hidden mb-8">
            <div className="border-b border-slate-200 bg-gradient-to-r from-blue-50 to-white px-8 py-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg shadow-blue-500/30 mr-4">
                    <Printer className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">Seleccionar Impresora</h2>
                    <p className="text-sm text-slate-600 mt-1">
                      Elija la impresora térmica para tickets de venta
                    </p>
                  </div>
                </div>
                <button
                  onClick={loadPrinters}
                  disabled={isLoadingPrinters}
                  className="flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingPrinters ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>
              </div>
            </div>

            <div className="p-6">
              {isLoadingPrinters ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
                  <span className="ml-4 text-slate-600">Cargando impresoras...</span>
                </div>
              ) : printers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="rounded-full bg-slate-100 p-6 mx-auto w-fit mb-4">
                    <AlertCircle className="h-12 w-12 text-slate-400" />
                  </div>
                  <p className="text-lg font-semibold text-slate-600">No se encontraron impresoras</p>
                  <p className="text-sm text-slate-500 mt-2">
                    Conecte una impresora y haga clic en "Actualizar"
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {printers.map((printer) => (
                    <div
                      key={printer.name}
                      onClick={() => handleSelectPrinter(printer.name)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedPrinter === printer.name
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`rounded-lg p-2 ${
                          selectedPrinter === printer.name
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Printer className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {printer.displayName || printer.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {printer.description || 'Impresora del sistema'}
                            {printer.isDefault && (
                              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                Por defecto
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      {selectedPrinter === printer.name && (
                        <div className="flex items-center gap-2 text-emerald-600">
                          <Check className="h-5 w-5" />
                          <span className="font-semibold text-sm">Seleccionada</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedPrinter && (
                <div className="mt-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-emerald-800">Impresora configurada</p>
                      <p className="text-sm text-emerald-600">
                        Los tickets se imprimirán en: <strong>{selectedPrinter}</strong>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Test Print Card */}
        <div className="rounded-2xl bg-white shadow-xl border border-slate-200/60 overflow-hidden mb-8">
          <div className="border-b border-slate-200 bg-gradient-to-r from-emerald-50 to-white px-8 py-6">
            <div className="flex items-center">
              <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 shadow-lg shadow-emerald-500/30 mr-4">
                <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Prueba de Impresora</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Imprima un ticket de prueba para verificar la configuración
                </p>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-6 mb-6">
              <div className="flex items-start">
                <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-slate-900">Información</p>
                  <ul className="text-xs text-slate-700 mt-2 space-y-1">
                    <li>• El ticket de prueba incluye la configuración del negocio actual</li>
                    <li>• Verifica que la impresora esté encendida y conectada</li>
                    <li>• El ticket incluye productos de ejemplo con IVA desglosado</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleTestPrint}
              disabled={isPrinting}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-6 font-bold text-white text-lg shadow-lg shadow-emerald-500/30 transition-all hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none"
            >
              <div className="flex items-center justify-center">
                <svg className="h-6 w-6 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                {isPrinting ? 'Imprimiendo...' : 'Imprimir Ticket de Prueba'}
              </div>
            </button>
          </div>
        </div>

        {/* Recent Sales for Reprint */}
        <div className="rounded-2xl bg-white shadow-xl border border-slate-200/60 overflow-hidden">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Historial de Reimpresión</h2>
                <p className="text-sm text-slate-600 mt-1">
                  Últimas 20 ventas - Click para reimprimir
                </p>
              </div>
              <button
                onClick={loadRecentSales}
                className="rounded-lg bg-slate-100 px-4 py-2 font-semibold text-slate-700 transition-colors hover:bg-slate-200"
              >
                <svg className="h-5 w-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Actualizar
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {isLoading ? (
              <div className="px-8 py-16 text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent mb-4"></div>
                <p className="text-slate-600">Cargando ventas...</p>
              </div>
            ) : recentSales.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="rounded-full bg-slate-100 p-6 mx-auto w-fit mb-4">
                  <svg className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-lg font-semibold text-slate-600">No hay ventas recientes</p>
              </div>
            ) : (
              recentSales.map((sale) => (
                <div
                  key={sale.id}
                  className="px-8 py-5 transition-colors hover:bg-emerald-50 cursor-pointer"
                  onClick={() => handleReprint(sale.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-slate-900">
                            Venta #{sale.id.substring(0, 8).toUpperCase()}
                          </p>
                          <p className="text-xs text-slate-600 mt-1">
                            {formatDate(sale.createdAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">
                            {formatCurrency(sale.total)}
                          </p>
                          <p className="text-xs text-slate-600">
                            {sale.paymentMethod === 'cash' && 'Efectivo'}
                            {sale.paymentMethod === 'card' && 'Tarjeta'}
                            {sale.paymentMethod === 'sinpe' && 'SINPE'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="ml-6">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReprint(sale.id);
                        }}
                        className="rounded-lg bg-emerald-100 px-4 py-2 font-semibold text-emerald-700 transition-colors hover:bg-emerald-200"
                      >
                        <svg className="h-5 w-5 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        Reimprimir
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

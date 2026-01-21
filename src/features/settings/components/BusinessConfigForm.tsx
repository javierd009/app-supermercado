'use client';

import { useState, useEffect } from 'react';
import { configService } from '../services/configService';
import { printService } from '@/features/printing/services/printService';
import type { BusinessConfig } from '../types';

export function BusinessConfigForm() {
  const [config, setConfig] = useState<BusinessConfig>({
    business_name: '',
    business_phone: '',
    business_address: '',
    receipt_footer: '',
  });
  const [inventoryControlEnabled, setInventoryControlEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    const data = await configService.getBusinessConfig();
    setConfig(data);

    // Cargar configuración de control de inventario
    const inventoryControl = await configService.getConfigValue('inventory_control_enabled');
    setInventoryControlEnabled(inventoryControl !== 'false'); // Por defecto true

    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    // Guardar configuración del negocio
    const result = await configService.updateBusinessConfig(config);

    // Guardar configuración de control de inventario
    const inventoryResult = await configService.setConfigValue(
      'inventory_control_enabled',
      inventoryControlEnabled ? 'true' : 'false'
    );

    if (result.success && inventoryResult.success) {
      setMessage({ type: 'success', text: 'Configuración actualizada correctamente' });

      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setMessage(null), 3000);
    } else {
      setMessage({ type: 'error', text: result.error || inventoryResult.error || 'Error al actualizar' });
    }

    setIsSaving(false);
  };

  const handleTestPrint = async () => {
    setMessage(null);

    // Cargar config actual antes de imprimir
    await printService.loadConfigFromDB();

    const result = await printService.printTestTicket();

    if (result.success) {
      setMessage({ type: 'success', text: 'Ticket de prueba enviado a impresora' });
    } else {
      setMessage({ type: 'error', text: result.error || 'Error al imprimir' });
    }

    setTimeout(() => setMessage(null), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-12">
            <div className="mx-auto h-12 w-12 animate-spin border-4 border-blue-500 border-t-transparent rounded-full"></div>
          </div>
          <p className="mt-4 text-slate-400 font-bold uppercase tracking-wide text-sm">
            CARGANDO CONFIGURACIÓN...
          </p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Mensaje de éxito/error */}
      {message && (
        <div
          className={`rounded-xl border p-4 ${
            message.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-500/10'
              : 'border-rose-500/30 bg-rose-500/10'
          }`}
        >
          <div className="flex items-center">
            {message.type === 'success' ? (
              <div className="bg-emerald-500 text-white p-2 rounded-lg mr-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              <div className="bg-rose-500 text-white p-2 rounded-lg mr-3">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            )}
            <span className={`font-bold text-sm ${message.type === 'success' ? 'text-emerald-300' : 'text-rose-300'}`}>
              {message.text}
            </span>
          </div>
        </div>
      )}

      {/* Formulario */}
      <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="border-b border-white/10 bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">
            Configuración del Negocio
          </h2>
          <p className="text-blue-100 text-sm mt-1">
            Estos datos aparecerán en los tickets impresos
          </p>
        </div>

        <div className="p-8 space-y-6">
          {/* Nombre del Negocio */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Nombre del Negocio *
            </label>
            <input
              type="text"
              value={config.business_name}
              onChange={(e) => setConfig({ ...config, business_name: e.target.value })}
              required
              placeholder="Ej: Pulpería Sabrosita"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-slate-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            />
          </div>

          {/* Teléfono */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Teléfono
            </label>
            <input
              type="tel"
              value={config.business_phone}
              onChange={(e) => setConfig({ ...config, business_phone: e.target.value })}
              placeholder="Ej: 2222-3333"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-slate-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            />
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Dirección
            </label>
            <textarea
              value={config.business_address}
              onChange={(e) => setConfig({ ...config, business_address: e.target.value })}
              rows={3}
              placeholder="Ej: San José, Costa Rica"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-slate-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            />
          </div>

          {/* Mensaje del Ticket */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-2">
              Mensaje del Ticket
            </label>
            <textarea
              value={config.receipt_footer}
              onChange={(e) => setConfig({ ...config, receipt_footer: e.target.value })}
              rows={2}
              placeholder="Ej: ¡Gracias por su compra!"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3.5 text-white placeholder-slate-500 transition-all focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20"
            />
            <p className="text-xs text-slate-500 mt-2">
              Este mensaje aparecerá al final de cada ticket impreso
            </p>
          </div>

          {/* Control de Inventario */}
          <div className="border-t border-white/10 pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <label className="block text-sm font-bold text-white mb-1 uppercase tracking-wide">
                  Control de Inventario
                </label>
                <p className="text-xs text-slate-400">
                  {inventoryControlEnabled
                    ? 'El sistema valida stock disponible antes de facturar'
                    : 'El sistema permite facturar sin validar stock (útil para negocios sin inventario)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInventoryControlEnabled(!inventoryControlEnabled)}
                className={`relative inline-flex h-8 w-14 flex-shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                  inventoryControlEnabled
                    ? 'bg-blue-600 border-blue-700'
                    : 'bg-white/10 border-white/20'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-7 w-7 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    inventoryControlEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex space-x-3 pt-4 border-t border-white/10">
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-6 py-4 font-bold text-white shadow-lg shadow-blue-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wide"
            >
              {isSaving ? 'GUARDANDO...' : 'Guardar Configuración'}
            </button>

            <button
              type="button"
              onClick={handleTestPrint}
              className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-4 font-bold text-white transition-all uppercase tracking-wide"
            >
              Imprimir Prueba
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

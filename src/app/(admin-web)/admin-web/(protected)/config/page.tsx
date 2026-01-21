'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  DollarSign,
  Save,
  RefreshCw,
  Settings,
  TrendingUp,
  Globe,
  Info,
  CheckCircle,
} from 'lucide-react';

interface SystemConfig {
  id: string;
  key: string;
  value: string;
  description: string;
  updated_at: string;
}

export default function AdminConfigPage() {
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(13);
  const [businessName, setBusinessName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [saveSuccess, setSaveSuccess] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadConfig();

    // Suscribirse a cambios en tiempo real
    const configChannel = supabase
      .channel('admin-config')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'system_config' }, (payload) => {
        console.log('[Admin Config] Cambio detectado:', payload);
        loadConfig();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(configChannel);
    };
  }, []);

  const loadConfig = async () => {
    try {
      setIsLoading(true);

      // Verificar si la tabla existe, si no, crearla
      const { data: existingConfig, error: selectError } = await supabase
        .from('system_config')
        .select('*');

      if (selectError) {
        // Tabla no existe, crearla
        console.log('[Admin Config] Tabla system_config no existe, creando...');
        await initializeConfigTable();
        return;
      }

      // Cargar configuraciones
      const configs = existingConfig || [];
      const exchangeConfig = configs.find((c) => c.key === 'exchange_rate');
      const taxConfig = configs.find((c) => c.key === 'tax_rate');
      const businessConfig = configs.find((c) => c.key === 'business_name');

      setExchangeRate(exchangeConfig ? parseFloat(exchangeConfig.value) : 540);
      setTaxRate(taxConfig ? parseFloat(taxConfig.value) : 13);
      setBusinessName(businessConfig?.value || 'La Sabrosita');

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const initializeConfigTable = async () => {
    try {
      // Crear tabla system_config si no existe
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS system_config (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            key TEXT UNIQUE NOT NULL,
            value TEXT NOT NULL,
            description TEXT,
            updated_at TIMESTAMP DEFAULT NOW()
          );

          -- Insertar valores por defecto
          INSERT INTO system_config (key, value, description)
          VALUES
            ('exchange_rate', '540', 'Tipo de cambio Dólar a Colones'),
            ('tax_rate', '13', 'Porcentaje de IVA'),
            ('business_name', 'La Sabrosita', 'Nombre del negocio')
          ON CONFLICT (key) DO NOTHING;
        `,
      });

      if (createError) {
        console.error('Error creando tabla:', createError);
        // Intentar método alternativo
        await createTableManually();
      }

      await loadConfig();
    } catch (error) {
      console.error('Error initializing config:', error);
    }
  };

  const createTableManually = async () => {
    // Método alternativo: insertar directamente
    const defaultConfigs = [
      { key: 'exchange_rate', value: '540', description: 'Tipo de cambio Dólar a Colones' },
      { key: 'tax_rate', value: '13', description: 'Porcentaje de IVA' },
      { key: 'business_name', value: 'La Sabrosita', description: 'Nombre del negocio' },
    ];

    for (const config of defaultConfigs) {
      await supabase.from('system_config').upsert(config, { onConflict: 'key' });
    }
  };

  const saveConfig = async () => {
    try {
      setIsSaving(true);
      setSaveSuccess(false);

      const updates = [
        { key: 'exchange_rate', value: exchangeRate.toString(), description: 'Tipo de cambio Dólar a Colones' },
        { key: 'tax_rate', value: taxRate.toString(), description: 'Porcentaje de IVA' },
        { key: 'business_name', value: businessName, description: 'Nombre del negocio' },
      ];

      for (const update of updates) {
        const { error } = await supabase
          .from('system_config')
          .upsert(
            {
              ...update,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'key' }
          );

        if (error) throw error;
      }

      console.log('[Admin Config] Configuración actualizada. Sincronizando a POS...');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      await loadConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CR', {
      style: 'currency',
      currency: 'CRC',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-CR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-[#020617] pb-20 lg:pb-6">
      {/* Header */}
      <div className="bg-[#020617]/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-10 px-4 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl lg:text-3xl font-black text-white">Configuración</h1>
            <p className="text-slate-400 text-sm font-medium mt-1">
              Ajustes del sistema y tipo de cambio
            </p>
          </div>
          <button
            onClick={loadConfig}
            disabled={isLoading}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white font-bold text-sm px-4 py-2 rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Recargar
          </button>
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
          <Info className="w-3 h-3" />
          <span>Última actualización: {formatTime(lastUpdate)}</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 lg:px-8 py-6 space-y-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
            <p className="text-slate-400 mt-4 font-medium">Cargando configuración...</p>
          </div>
        ) : (
          <>
            {/* Exchange Rate Section */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-700 rounded-2xl p-6 border border-green-500/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white/20 p-3 rounded-xl">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-white font-black text-xl">Tipo de Cambio</h2>
                  <p className="text-green-100 text-sm font-medium">Dólar estadounidense (USD) a Colones (CRC)</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <label className="text-white text-sm font-bold uppercase block mb-2">
                  ₡ Colones por cada $1 USD
                </label>
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-white/20 border-2 border-white/30 rounded-xl text-white font-black text-2xl focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50"
                  placeholder="540"
                  step="0.01"
                />
                <div className="mt-3 flex items-center justify-between text-white/80 text-sm font-medium">
                  <span>Ejemplo: $100 USD =</span>
                  <span className="font-black text-lg">{formatCurrency(100 * exchangeRate)}</span>
                </div>
              </div>
            </div>

            {/* Tax Rate Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg">IVA (Impuesto sobre el Valor Agregado)</h3>
                  <p className="text-slate-400 text-sm font-medium">Porcentaje aplicado a las ventas</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <label className="text-slate-400 text-sm font-bold uppercase block mb-2">
                  Porcentaje de IVA (%)
                </label>
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-black text-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="13"
                  step="0.01"
                  min="0"
                  max="100"
                />
                <div className="mt-3 flex items-center justify-between text-slate-400 text-sm font-medium">
                  <span>Ejemplo: {formatCurrency(1000)} + IVA =</span>
                  <span className="font-black text-white text-lg">
                    {formatCurrency(1000 * (1 + taxRate / 100))}
                  </span>
                </div>
              </div>
            </div>

            {/* Business Name Section */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 p-3 rounded-xl">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-black text-lg">Información del Negocio</h3>
                  <p className="text-slate-400 text-sm font-medium">Datos generales</p>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <label className="text-slate-400 text-sm font-bold uppercase block mb-2">
                  Nombre del Negocio
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white font-bold text-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="La Sabrosita"
                />
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={saveConfig}
              disabled={isSaving}
              className={`w-full flex items-center justify-center gap-3 font-black text-lg py-4 rounded-xl transition-all ${
                saveSuccess
                  ? 'bg-green-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
              }`}
            >
              {saveSuccess ? (
                <>
                  <CheckCircle className="w-6 h-6" />
                  Guardado Exitosamente
                </>
              ) : (
                <>
                  <Save className={`w-6 h-6 ${isSaving ? 'animate-pulse' : ''}`} />
                  {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                </>
              )}
            </button>

            {/* Info Box */}
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500 p-2 rounded-lg">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-bold text-sm mb-2">
                    Sincronización Automática
                  </h4>
                  <ul className="space-y-1 text-blue-200 text-sm font-medium">
                    <li>• Los cambios se aplican inmediatamente en todos los POS</li>
                    <li>• El tipo de cambio se usa para calcular precios en dólares</li>
                    <li>• Las ventas existentes mantienen el tipo de cambio histórico</li>
                    <li>• El IVA se aplica automáticamente en nuevas ventas</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-slate-400 text-xs font-bold uppercase mb-2">Tipo de Cambio Actual</p>
                <p className="text-white text-3xl font-black">{formatCurrency(exchangeRate)}</p>
                <p className="text-slate-500 text-sm font-medium mt-1">por cada $1 USD</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-slate-400 text-xs font-bold uppercase mb-2">IVA Configurado</p>
                <p className="text-white text-3xl font-black">{taxRate}%</p>
                <p className="text-slate-500 text-sm font-medium mt-1">aplicado a ventas</p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

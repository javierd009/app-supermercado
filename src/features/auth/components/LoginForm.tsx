'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, LogIn } from 'lucide-react';
import { useLogin } from '../hooks/useAuth';
import { configService } from '@/features/settings/services/configService';

export function LoginForm() {
  const router = useRouter();
  const { login } = useLogin();

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState('Sabrosita POS');

  useEffect(() => {
    // Cargar nombre del negocio desde configuración
    const loadBusinessName = async () => {
      const config = await configService.getBusinessConfig();
      if (config.business_name) {
        setBusinessName(config.business_name);
      }
    };
    loadBusinessName();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    console.log('═══════════════════════════════════════════════════');
    console.log('🔐 LOGIN: Intentando login con password:', password);
    console.log('═══════════════════════════════════════════════════');

    try {
      const result = await login({ password });

      console.log('🔐 LOGIN: Resultado:', result);

      if (result.success) {
        console.log('✅ LOGIN: Exitoso, redirigiendo a dashboard');
        router.push('/dashboard');
      } else {
        console.error('❌ LOGIN: Falló -', result.error);
        setError(result.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      console.error('❌ LOGIN: Error inesperado:', err);
      setError('Error inesperado al iniciar sesión');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Logo y Título */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-white rounded-2xl mb-6 shadow-xl p-2">
          <img src="/images/sabrosita-logo.png" alt={businessName} className="w-full h-full object-contain" />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-2 uppercase">
          {businessName}
        </h1>
        <p className="text-slate-500 text-sm font-medium uppercase tracking-wider">
          Sistema de Punto de Venta
        </p>
      </div>

      {/* Card de Login */}
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 shadow-2xl">
        <div className="mb-6">
          <h2 className="text-2xl font-black text-white mb-2 uppercase">
            Iniciar Sesión
          </h2>
          <p className="text-slate-500 text-sm font-medium">
            Ingrese su contraseña para continuar
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <p className="text-sm font-medium text-rose-400">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-400 uppercase tracking-wide">
              Contraseña
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <Lock className="w-5 h-5 text-slate-500" />
              </div>
              <input
                type="password"
                placeholder="Ingrese su contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                required
                disabled={isLoading}
                className="w-full bg-white/10 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-xl"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Iniciando sesión...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="mt-6 text-center text-xs text-slate-600 font-medium uppercase tracking-wide">
        © 2026 {businessName} v1.0
      </p>
    </div>
  );
}

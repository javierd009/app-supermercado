'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { LogIn, Smartphone } from 'lucide-react';

export default function AdminWebLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const supabase = createClient();

      // Buscar usuario por username
      const { data: users, error: searchError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.toUpperCase())
        .limit(1);

      if (searchError) throw searchError;

      if (!users || users.length === 0) {
        setError('Usuario o contraseña incorrectos');
        setIsLoading(false);
        return;
      }

      const user = users[0];

      // Verificar que sea admin o super_admin
      if (user.role !== 'admin' && user.role !== 'super_admin') {
        setError('Acceso denegado. Solo administradores pueden acceder al Admin Web.');
        setIsLoading(false);
        return;
      }

      // Verificar contraseña (comparación simple, en producción deberías usar bcrypt)
      if (user.password_hash !== password) {
        setError('Usuario o contraseña incorrectos');
        setIsLoading(false);
        return;
      }

      // Guardar sesión en localStorage
      const session = {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
        expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 horas
      };

      localStorage.setItem('admin-web-session', JSON.stringify(session));

      // Redirigir al dashboard
      router.push('/admin-web/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Error al iniciar sesión');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, white 2%, transparent 0%),
                            radial-gradient(circle at 75px 75px, white 2%, transparent 0%)`,
          backgroundSize: '100px 100px'
        }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo y Título */}
        <div className="text-center mb-8">
          <div className="bg-white/10 backdrop-blur-sm p-4 rounded-2xl inline-block mb-4 border border-white/20">
            <Smartphone className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-2 tracking-tight">
            SABROSITA
          </h1>
          <p className="text-blue-200 font-bold text-base uppercase tracking-wider">
            Admin Web · Gestión Remota
          </p>
        </div>

        {/* Formulario de Login */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                <p className="text-red-200 text-base font-medium text-center">{error}</p>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-white font-bold text-base mb-2 uppercase tracking-wide">
                Usuario
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ADMIN"
                required
                autoFocus
                className="w-full bg-white/20 border-2 border-white/30 rounded-xl px-5 py-4 text-white text-lg placeholder:text-white/50 focus:outline-none focus:border-white/60 font-bold transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-white font-bold text-base mb-2 uppercase tracking-wide">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-white/20 border-2 border-white/30 rounded-xl px-5 py-4 text-white text-lg placeholder:text-white/50 focus:outline-none focus:border-white/60 font-bold transition-all"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white hover:bg-blue-50 text-blue-900 font-black text-lg uppercase tracking-wide rounded-xl px-6 py-5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-3 border-blue-900/30 border-t-blue-900 rounded-full animate-spin"></div>
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

          {/* Info */}
          <div className="mt-6 pt-6 border-t border-white/20">
            <p className="text-center text-white/70 text-sm font-medium">
              Solo administradores pueden acceder
            </p>
            <p className="text-center text-white/50 text-sm mt-1">
              Contacta al super admin si necesitas acceso
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-white/50 text-sm font-bold uppercase tracking-wider">
            © 2026 Sabrosita POS v1.1.0
          </p>
        </div>
      </div>
    </div>
  );
}

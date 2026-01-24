'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useDialog } from '@/shared/components/ConfirmDialog';
import {
  Activity,
  Home,
  ArrowLeft,
  LogOut,
  RefreshCw,
  Copy,
  CheckCircle2,
  AlertTriangle,
  FileText,
  HardDrive,
  Cpu,
  Monitor,
  Database,
} from 'lucide-react';

interface DiagnosticReport {
  timestamp: string;
  system: {
    platform: string;
    arch: string;
    osRelease: string;
    osType: string;
    hostname: string;
    totalMemory: string;
    freeMemory: string;
    cpus: number;
    uptime: string;
  };
  node: {
    version: string;
    execPath: string;
    cwd: string;
  };
  electron: {
    versions: Record<string, string>;
  };
  paths: Record<string, {
    path: string;
    exists: boolean;
    isDirectory?: boolean;
    size?: number;
    contents?: string[];
    error?: string;
  }>;
  environment: Record<string, string>;
  files?: {
    debugLog?: {
      path: string;
      lines: number;
      lastLines: string;
    };
  };
  errors: string[];
}

export default function DiagnosticsPage() {
  const { user } = useAuth();
  const dialog = useDialog();

  const [isElectron, setIsElectron] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<DiagnosticReport | null>(null);
  const [formattedReport, setFormattedReport] = useState<string>('');
  const [logContent, setLogContent] = useState<string>('');
  const [logPath, setLogPath] = useState<string>('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.electronAPI?.diagnostics) {
      setIsElectron(true);
      loadLogPath();
    }
  }, []);

  // Solo super_admin puede acceder
  if (user?.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Acceso Restringido</h1>
          <p className="text-slate-400 mb-6">Solo el Super Administrador puede acceder a esta sección.</p>
          <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
            Volver al Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const loadLogPath = async () => {
    if (!window.electronAPI?.diagnostics?.getLogPath) return;
    try {
      const result = await window.electronAPI.diagnostics.getLogPath();
      if (result.success) {
        setLogPath(result.logPath);
      }
    } catch (error) {
      console.error('Error getting log path:', error);
    }
  };

  const runDiagnostics = async () => {
    if (!window.electronAPI?.diagnostics?.run) {
      await dialog.error('Diagnósticos solo disponibles en la aplicación de escritorio', 'No Disponible');
      return;
    }

    setIsLoading(true);
    try {
      const result = await window.electronAPI.diagnostics.run();
      if (result.success) {
        setReport(result.report);
        setFormattedReport(result.formatted);
        await dialog.success('Diagnóstico completado exitosamente', 'Diagnóstico Listo');
      } else {
        await dialog.error(result.error || 'Error desconocido', 'Error');
      }
    } catch (error: any) {
      await dialog.error(error.message, 'Error de Diagnóstico');
    }
    setIsLoading(false);
  };

  const loadLog = async () => {
    if (!window.electronAPI?.diagnostics?.readLog) return;

    try {
      const result = await window.electronAPI.diagnostics.readLog();
      if (result.success) {
        setLogContent(result.content);
        setLogPath(result.path);
      } else {
        await dialog.error('No se encontró el archivo de log', 'Error');
      }
    } catch (error: any) {
      await dialog.error(error.message, 'Error');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      await dialog.error('No se pudo copiar al portapapeles', 'Error');
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200">
      {/* Header */}
      <header className="h-20 px-6 md:px-8 flex items-center justify-between border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-20">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl border border-white/20 shadow-xl hover:scale-105 transition-transform">
            <Home className="h-5 w-5 text-white" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              <p className="text-xl font-black text-white tracking-tight uppercase">Diagnósticos del Sistema</p>
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Solo Super Administrador</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/settings">
            <button className="px-4 py-2 bg-white/5 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all border border-white/5 flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wide hidden sm:inline">Configuración</span>
            </button>
          </Link>
          <Link href="/logout">
            <button className="p-3 bg-white/5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all border border-white/5">
              <LogOut className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </header>

      <main className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        {/* Advertencia si no es Electron */}
        {!isElectron && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-400 mb-1">Modo Web Detectado</h3>
                <p className="text-sm text-amber-200/70">
                  Los diagnósticos completos solo están disponibles en la aplicación de escritorio (Electron).
                  Instala la aplicación para acceder a todas las funciones de diagnóstico.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={runDiagnostics}
            disabled={isLoading || !isElectron}
            className="flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-700 disabled:to-slate-700 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Activity className="w-5 h-5" />
            )}
            <span>{isLoading ? 'Ejecutando...' : 'Ejecutar Diagnóstico'}</span>
          </button>

          <button
            onClick={loadLog}
            disabled={!isElectron}
            className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50"
          >
            <FileText className="w-5 h-5" />
            <span>Ver Log de Errores</span>
          </button>

          <button
            onClick={() => copyToClipboard(formattedReport || logContent)}
            disabled={!formattedReport && !logContent}
            className="flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-50"
          >
            {copied ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
            <span>{copied ? 'Copiado!' : 'Copiar Reporte'}</span>
          </button>
        </div>

        {/* Información del sistema (si hay reporte) */}
        {report && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Monitor className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-bold text-slate-400 uppercase">Sistema</span>
              </div>
              <p className="text-lg font-bold text-white">{report.system.platform}</p>
              <p className="text-sm text-slate-400">{report.system.osType} {report.system.osRelease}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Cpu className="w-5 h-5 text-purple-400" />
                <span className="text-xs font-bold text-slate-400 uppercase">Arquitectura</span>
              </div>
              <p className="text-lg font-bold text-white">{report.system.arch}</p>
              <p className="text-sm text-slate-400">{report.system.cpus} CPUs</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <HardDrive className="w-5 h-5 text-emerald-400" />
                <span className="text-xs font-bold text-slate-400 uppercase">Memoria</span>
              </div>
              <p className="text-lg font-bold text-white">{report.system.freeMemory}</p>
              <p className="text-sm text-slate-400">de {report.system.totalMemory} total</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-3">
                <Database className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-bold text-slate-400 uppercase">Node.js</span>
              </div>
              <p className="text-lg font-bold text-white">{report.node.version}</p>
              <p className="text-sm text-slate-400">Electron {report.electron.versions.electron}</p>
            </div>
          </div>
        )}

        {/* Verificación de archivos */}
        {report && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10">
              <h3 className="font-bold text-white">Verificación de Archivos</h3>
            </div>
            <div className="divide-y divide-white/5">
              {Object.entries(report.paths).map(([name, info]) => (
                <div key={name} className="px-6 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {info.exists ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                    )}
                    <div>
                      <p className="font-medium text-white">{name}</p>
                      <p className="text-xs text-slate-500 truncate max-w-md">{info.path}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded ${
                    info.exists
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {info.exists ? 'OK' : 'FALTA'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Log de errores */}
        {logContent && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white">Log de Errores</h3>
                <p className="text-xs text-slate-500">{logPath}</p>
              </div>
              <button
                onClick={() => copyToClipboard(logContent)}
                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                Copiar
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-auto">
              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                {logContent}
              </pre>
            </div>
          </div>
        )}

        {/* Reporte formateado */}
        {formattedReport && (
          <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
              <h3 className="font-bold text-white">Reporte Completo</h3>
              <button
                onClick={() => copyToClipboard(formattedReport)}
                className="text-xs bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                Copiar Todo
              </button>
            </div>
            <div className="p-4 max-h-96 overflow-auto">
              <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap">
                {formattedReport}
              </pre>
            </div>
          </div>
        )}

        {/* Instrucciones */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
          <h3 className="font-bold text-blue-400 mb-3">Cómo usar los diagnósticos</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-200/70">
            <li>Haz clic en <strong>"Ejecutar Diagnóstico"</strong> para generar un reporte completo</li>
            <li>Si hay errores, haz clic en <strong>"Ver Log de Errores"</strong> para ver los detalles</li>
            <li>Usa <strong>"Copiar Reporte"</strong> para copiar la información y enviarla al soporte técnico</li>
            <li>El reporte también se guarda automáticamente en: <code className="bg-blue-500/20 px-2 py-0.5 rounded">{logPath?.replace('sabrosita-debug.log', 'diagnostic-report.txt') || 'diagnostic-report.txt'}</code></li>
          </ol>
        </div>
      </main>

      <footer className="py-6 px-8 bg-[#020617]/80 backdrop-blur-xl border-t border-white/5 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-lg font-black text-white uppercase tracking-wider">SABROSITA</p>
          <p className="text-[9px] text-slate-600 font-bold uppercase tracking-wide">
            Herramientas de Diagnóstico v1.0
          </p>
        </div>
      </footer>
    </div>
  );
}

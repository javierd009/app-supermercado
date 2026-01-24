/**
 * SABROSITA POS - Sistema de Diagnóstico
 *
 * Este script genera un reporte completo del estado del sistema
 * para facilitar la depuración de problemas.
 *
 * Uso: Ejecutar desde la consola de Electron DevTools
 *      o desde Node.js con: node electron/diagnostics.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

function generateDiagnosticReport() {
  const report = {
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      arch: process.arch,
      osRelease: os.release(),
      osType: os.type(),
      hostname: os.hostname(),
      totalMemory: `${Math.round(os.totalmem() / 1024 / 1024 / 1024)} GB`,
      freeMemory: `${Math.round(os.freemem() / 1024 / 1024 / 1024)} GB`,
      cpus: os.cpus().length,
      uptime: `${Math.round(os.uptime() / 3600)} hours`,
    },
    node: {
      version: process.version,
      execPath: process.execPath,
      cwd: process.cwd(),
    },
    electron: {
      versions: process.versions,
    },
    paths: {},
    files: {},
    environment: {},
    network: {},
    errors: [],
  };

  // Verificar paths importantes
  const basePath = path.join(__dirname, '..');
  const pathsToCheck = [
    { name: 'basePath', path: basePath },
    { name: 'electronDir', path: __dirname },
    { name: 'standaloneDir', path: path.join(basePath, '.next', 'standalone') },
    { name: 'serverJs', path: path.join(basePath, '.next', 'standalone', 'server.js') },
    { name: 'staticDir', path: path.join(basePath, '.next', 'static') },
    { name: 'publicDir', path: path.join(basePath, 'public') },
    { name: 'envFile', path: path.join(basePath, '.env.local') },
    { name: 'databaseDir', path: path.join(__dirname, 'database') },
    { name: 'preloadJs', path: path.join(__dirname, 'preload.js') },
  ];

  for (const item of pathsToCheck) {
    try {
      const exists = fs.existsSync(item.path);
      let details = { exists };

      if (exists) {
        const stats = fs.statSync(item.path);
        details.isDirectory = stats.isDirectory();
        details.size = stats.size;
        details.modified = stats.mtime.toISOString();

        if (stats.isDirectory()) {
          try {
            details.contents = fs.readdirSync(item.path).slice(0, 20); // Primeros 20 items
            details.totalItems = fs.readdirSync(item.path).length;
          } catch (e) {
            details.contentsError = e.message;
          }
        }
      }

      report.paths[item.name] = {
        path: item.path,
        ...details,
      };
    } catch (error) {
      report.paths[item.name] = {
        path: item.path,
        error: error.message,
      };
    }
  }

  // Verificar variables de entorno relevantes
  const envVars = [
    'NODE_ENV',
    'ELECTRON_RUN_AS_NODE',
    'PORT',
    'HOSTNAME',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'PATH',
    'APPDATA',
    'LOCALAPPDATA',
    'USERPROFILE',
  ];

  for (const varName of envVars) {
    const value = process.env[varName];
    if (value) {
      // Ocultar valores sensibles
      if (varName.includes('KEY') || varName.includes('SECRET')) {
        report.environment[varName] = value ? '[SET - HIDDEN]' : '[NOT SET]';
      } else if (varName === 'PATH') {
        report.environment[varName] = value.split(path.delimiter).slice(0, 5).join('\n') + '\n...';
      } else {
        report.environment[varName] = value;
      }
    } else {
      report.environment[varName] = '[NOT SET]';
    }
  }

  // Verificar puertos
  const net = require('net');
  const portsToCheck = [3000, 3456, 80, 443];

  report.network.portsToCheck = portsToCheck;
  report.network.note = 'Para verificar puertos, ejecutar checkPorts() después de cargar este script';

  // Leer log de errores si existe
  const logPaths = [
    path.join(os.homedir(), 'AppData', 'Roaming', 'Sabrosita POS', 'sabrosita-debug.log'),
    path.join(basePath, 'sabrosita-debug.log'),
  ];

  for (const logPath of logPaths) {
    try {
      if (fs.existsSync(logPath)) {
        const content = fs.readFileSync(logPath, 'utf8');
        const lines = content.split('\n');
        report.files.debugLog = {
          path: logPath,
          exists: true,
          lines: lines.length,
          lastLines: lines.slice(-50).join('\n'), // Últimas 50 líneas
        };
        break;
      }
    } catch (e) {
      report.errors.push(`Error leyendo log: ${e.message}`);
    }
  }

  return report;
}

function formatReport(report) {
  let output = `
================================================================================
                    SABROSITA POS - REPORTE DE DIAGNÓSTICO
================================================================================
Generado: ${report.timestamp}

--- SISTEMA ---
Plataforma: ${report.system.platform} (${report.system.arch})
OS: ${report.system.osType} ${report.system.osRelease}
Hostname: ${report.system.hostname}
Memoria: ${report.system.freeMemory} libre de ${report.system.totalMemory}
CPUs: ${report.system.cpus}
Uptime: ${report.system.uptime}

--- NODE.JS ---
Versión: ${report.node.version}
Ejecutable: ${report.node.execPath}
CWD: ${report.node.cwd}

--- ELECTRON ---
Electron: ${report.electron.versions.electron || 'N/A'}
Chrome: ${report.electron.versions.chrome || 'N/A'}
V8: ${report.electron.versions.v8 || 'N/A'}

--- RUTAS Y ARCHIVOS ---
`;

  for (const [name, info] of Object.entries(report.paths)) {
    const status = info.exists ? '✓' : '✗';
    const type = info.isDirectory ? '[DIR]' : '[FILE]';
    output += `${status} ${name} ${type}\n`;
    output += `   ${info.path}\n`;
    if (info.contents) {
      output += `   Contenido (${info.totalItems} items): ${info.contents.slice(0, 5).join(', ')}...\n`;
    }
    if (info.error) {
      output += `   ERROR: ${info.error}\n`;
    }
  }

  output += `
--- VARIABLES DE ENTORNO ---
`;
  for (const [name, value] of Object.entries(report.environment)) {
    output += `${name}: ${value}\n`;
  }

  if (report.files.debugLog) {
    output += `
--- ÚLTIMAS LÍNEAS DEL LOG ---
Archivo: ${report.files.debugLog.path}
Total líneas: ${report.files.debugLog.lines}

${report.files.debugLog.lastLines}
`;
  }

  if (report.errors.length > 0) {
    output += `
--- ERRORES DURANTE DIAGNÓSTICO ---
${report.errors.join('\n')}
`;
  }

  output += `
================================================================================
                         FIN DEL REPORTE
================================================================================
`;

  return output;
}

// Función para verificar puertos (async)
async function checkPort(port) {
  return new Promise((resolve) => {
    const net = require('net');
    const server = net.createServer();

    server.once('error', (err) => {
      resolve({ port, available: false, error: err.code });
    });

    server.once('listening', () => {
      server.close();
      resolve({ port, available: true });
    });

    server.listen(port, '127.0.0.1');
  });
}

async function checkPorts() {
  const ports = [3000, 3456, 80, 443, 8080];
  console.log('\n--- VERIFICACIÓN DE PUERTOS ---');

  for (const port of ports) {
    const result = await checkPort(port);
    const status = result.available ? '✓ Disponible' : `✗ Ocupado (${result.error})`;
    console.log(`Puerto ${port}: ${status}`);
  }
}

// Exportar para uso desde Electron
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    generateDiagnosticReport,
    formatReport,
    checkPorts,
    runDiagnostics: () => {
      const report = generateDiagnosticReport();
      const formatted = formatReport(report);
      console.log(formatted);
      return { report, formatted };
    },
  };
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const report = generateDiagnosticReport();
  console.log(formatReport(report));

  // Guardar reporte en archivo
  const reportPath = path.join(__dirname, '..', 'diagnostic-report.txt');
  fs.writeFileSync(reportPath, formatReport(report));
  console.log(`\nReporte guardado en: ${reportPath}`);
}

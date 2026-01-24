const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const http = require('http');
const net = require('net');
const { spawn } = require('child_process');
const isDev = process.env.NODE_ENV === 'development';
const { initDatabase, query, run, closeDatabase } = require('./database/init');

// Puerto para el servidor Next.js
const NEXT_PORT = isDev ? 3000 : 3456;
let nextServerProcess = null;
let mainWindow = null;

// ============================================
// Sistema de Logs Persistente
// Para diagnosticar problemas en producción
// ============================================
const LOG_DIR = app.isPackaged
  ? app.getPath('userData')
  : path.join(__dirname, '..');

const LOG_FILE = path.join(LOG_DIR, 'sabrosita-debug.log');

// Inicializar archivo de log
function initLogFile() {
  try {
    // Crear directorio si no existe
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }

    const header = [
      '================================================================================',
      'SABROSITA POS - Debug Log',
      `Iniciado: ${new Date().toISOString()}`,
      `Plataforma: ${process.platform} (${os.release()})`,
      `Arquitectura: ${process.arch}`,
      `Electron: ${process.versions.electron}`,
      `Node: ${process.versions.node}`,
      `Chrome: ${process.versions.chrome}`,
      `Empaquetado: ${app.isPackaged}`,
      `App Path: ${app.getAppPath()}`,
      `User Data: ${app.getPath('userData')}`,
      app.isPackaged ? `Resources: ${process.resourcesPath}` : '',
      `Ejecutable: ${process.execPath}`,
      '================================================================================',
      '',
    ].filter(Boolean).join('\n');

    fs.writeFileSync(LOG_FILE, header);
  } catch (err) {
    console.error('No se pudo inicializar log:', err.message);
  }
}

// Escribir log con timestamp
function writeLog(level, ...args) {
  const timestamp = new Date().toISOString();
  const message = args.map(a => {
    if (a instanceof Error) {
      return `${a.message}\n${a.stack}`;
    }
    if (typeof a === 'object') {
      try {
        return JSON.stringify(a, null, 2);
      } catch {
        return String(a);
      }
    }
    return String(a);
  }).join(' ');

  const logLine = `[${timestamp}] [${level}] ${message}\n`;

  // Escribir a consola
  try {
    if (level === 'ERROR' || level === 'WARN') {
      console.error(logLine.trim());
    } else {
      console.log(logLine.trim());
    }
  } catch (err) {
    // Ignorar errores de consola (EPIPE en macOS)
    if (err.code !== 'EPIPE') {
      process.stderr.write(`Console error: ${err.message}\n`);
    }
  }

  // Escribir a archivo
  try {
    fs.appendFileSync(LOG_FILE, logLine);
  } catch (err) {
    // Silently fail if can't write
  }
}

const log = {
  info: (...args) => writeLog('INFO', ...args),
  warn: (...args) => writeLog('WARN', ...args),
  error: (...args) => writeLog('ERROR', ...args),
  debug: (...args) => writeLog('DEBUG', ...args),
};

// Logger seguro para compatibilidad (alias)
const safeLog = (...args) => log.info(...args);
const safeError = (...args) => log.error(...args);

// ============================================
// Capturar errores no manejados
// ============================================
process.on('uncaughtException', (error) => {
  if (error.code === 'EPIPE') return;
  log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled rejection:', reason);
});

// ============================================
// Verificar si un puerto está disponible
// ============================================
function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const server = net.createServer();

    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(false);
      } else {
        resolve(true);
      }
    });

    server.once('listening', () => {
      server.close();
      resolve(true);
    });

    server.listen(port, '127.0.0.1');
  });
}

// ============================================
// Verificar archivos del standalone
// ============================================
function verifyStandaloneFiles() {
  log.info('Verificando archivos standalone...');

  const resourcesPath = app.isPackaged
    ? path.join(process.resourcesPath, 'app')
    : path.join(__dirname, '..');

  const standaloneDir = path.join(resourcesPath, '.next', 'standalone');
  const serverPath = path.join(standaloneDir, 'server.js');

  const result = {
    resourcesPath,
    standaloneDir,
    serverPath,
    exists: {
      standaloneDir: false,
      serverJs: false,
      nextFolder: false,
      nodeModules: false,
    },
    errors: [],
  };

  // Verificar directorio standalone
  if (fs.existsSync(standaloneDir)) {
    result.exists.standaloneDir = true;
    log.info(`  ✓ Directorio standalone: ${standaloneDir}`);

    // Listar contenido para debug
    try {
      const contents = fs.readdirSync(standaloneDir);
      log.debug('  Contenido:', contents.join(', '));
    } catch (err) {
      log.warn('  No se pudo listar contenido:', err.message);
    }
  } else {
    result.errors.push(`Directorio standalone no existe: ${standaloneDir}`);
    log.error(`  ✗ Directorio standalone NO EXISTE: ${standaloneDir}`);
  }

  // Verificar server.js
  if (fs.existsSync(serverPath)) {
    result.exists.serverJs = true;
    const stats = fs.statSync(serverPath);
    log.info(`  ✓ server.js: ${serverPath} (${stats.size} bytes)`);
  } else {
    result.errors.push(`server.js no existe: ${serverPath}`);
    log.error(`  ✗ server.js NO EXISTE: ${serverPath}`);
  }

  // Verificar carpeta .next dentro de standalone
  const nextInStandalone = path.join(standaloneDir, '.next');
  if (fs.existsSync(nextInStandalone)) {
    result.exists.nextFolder = true;
    log.info(`  ✓ Carpeta .next en standalone: OK`);
  } else {
    log.warn(`  ⚠ Carpeta .next no está en standalone`);
  }

  // Verificar node_modules
  const nodeModulesPath = path.join(standaloneDir, 'node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    result.exists.nodeModules = true;
    log.info(`  ✓ node_modules en standalone: OK`);
  } else {
    log.warn(`  ⚠ node_modules no está en standalone`);
  }

  return result;
}

// ============================================
// Copiar archivos estáticos si es necesario
// ============================================
function copyStaticFiles(resourcesPath, standaloneDir) {
  // Copiar .next/static
  const staticSrc = path.join(resourcesPath, '.next', 'static');
  const staticDest = path.join(standaloneDir, '.next', 'static');

  if (fs.existsSync(staticSrc) && !fs.existsSync(staticDest)) {
    log.info('Copiando archivos estáticos...');
    try {
      fs.cpSync(staticSrc, staticDest, { recursive: true });
      log.info('  ✓ .next/static copiado');
    } catch (err) {
      log.error('  ✗ Error copiando static:', err.message);
    }
  }

  // Copiar public
  const publicSrc = path.join(resourcesPath, 'public');
  const publicDest = path.join(standaloneDir, 'public');

  if (fs.existsSync(publicSrc) && !fs.existsSync(publicDest)) {
    log.info('Copiando archivos públicos...');
    try {
      fs.cpSync(publicSrc, publicDest, { recursive: true });
      log.info('  ✓ public copiado');
    } catch (err) {
      log.error('  ✗ Error copiando public:', err.message);
    }
  }
}

// ============================================
// Función para esperar a que el servidor esté listo
// ============================================
function waitForServer(port, maxAttempts = 60) {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const checkServer = () => {
      attempts++;

      if (attempts % 10 === 0) {
        log.info(`Esperando servidor (intento ${attempts}/${maxAttempts})...`);
      }

      const req = http.get(`http://127.0.0.1:${port}`, (res) => {
        log.info(`✓ Servidor respondió en puerto ${port} (HTTP ${res.statusCode})`);
        resolve(true);
      });

      req.on('error', () => {
        if (attempts >= maxAttempts) {
          reject(new Error(`Timeout: servidor no respondió después de ${maxAttempts} intentos`));
        } else {
          setTimeout(checkServer, 500);
        }
      });

      req.setTimeout(500, () => {
        req.destroy();
        if (attempts >= maxAttempts) {
          reject(new Error(`Timeout: servidor no respondió después de ${maxAttempts} intentos`));
        } else {
          setTimeout(checkServer, 500);
        }
      });
    };

    checkServer();
  });
}

// ============================================
// Iniciar servidor Next.js standalone
// ============================================
async function startNextServer() {
  if (isDev) {
    log.info('Modo desarrollo - esperando servidor externo en puerto 3000');
    await waitForServer(3000, 120);
    return 3000;
  }

  log.info('═══════════════════════════════════════════════════');
  log.info('Iniciando servidor Next.js standalone...');
  log.info('═══════════════════════════════════════════════════');

  // 1. Verificar que el puerto esté disponible
  const portAvailable = await checkPortAvailable(NEXT_PORT);
  if (!portAvailable) {
    const error = `Puerto ${NEXT_PORT} está ocupado. Cierra otras aplicaciones que puedan estar usando este puerto.`;
    log.error(error);
    throw new Error(error);
  }
  log.info(`✓ Puerto ${NEXT_PORT} disponible`);

  // 2. Verificar archivos
  const verification = verifyStandaloneFiles();

  if (verification.errors.length > 0) {
    const errorMsg = `Archivos faltantes:\n${verification.errors.join('\n')}`;
    log.error(errorMsg);
    throw new Error(errorMsg);
  }

  const { standaloneDir, serverPath, resourcesPath } = verification;

  // 3. Copiar archivos estáticos si es necesario
  copyStaticFiles(resourcesPath, standaloneDir);

  // 4. Iniciar el servidor
  return new Promise((resolve, reject) => {
    try {
      // Preparar variables de entorno
      const serverEnv = {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        NODE_ENV: 'production',
        PORT: NEXT_PORT.toString(),
        // IMPORTANTE: Usar 0.0.0.0 en lugar de localhost para mejor compatibilidad en Windows
        HOSTNAME: '0.0.0.0',
        // Variables de Supabase
        NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      };

      log.info('Configuración del servidor:');
      log.info(`  Ejecutable: ${process.execPath}`);
      log.info(`  Script: ${serverPath}`);
      log.info(`  CWD: ${standaloneDir}`);
      log.info(`  Puerto: ${NEXT_PORT}`);
      log.info(`  Plataforma: ${process.platform}`);

      // Configuración de spawn diferente para Windows vs Unix
      const spawnOptions = {
        cwd: standaloneDir,
        env: serverEnv,
        // IMPORTANTE: En Windows NO usar detached, en Unix sí
        detached: process.platform !== 'win32',
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
        shell: false,
      };

      log.info(`  Detached: ${spawnOptions.detached}`);

      nextServerProcess = spawn(process.execPath, [serverPath], spawnOptions);

      let serverStarted = false;
      let stdoutBuffer = '';
      let stderrBuffer = '';

      // Capturar stdout
      if (nextServerProcess.stdout) {
        nextServerProcess.stdout.on('data', (data) => {
          const output = data.toString();
          stdoutBuffer += output;

          // Log cada línea
          output.split('\n').filter(Boolean).forEach(line => {
            log.debug('[Next.js]', line);
          });

          // Detectar cuando el servidor está listo
          if (!serverStarted && (
            output.includes('Ready') ||
            output.includes('started server') ||
            output.includes(`localhost:${NEXT_PORT}`) ||
            output.includes(`0.0.0.0:${NEXT_PORT}`) ||
            output.includes('Listening') ||
            output.includes('✓ Ready')
          )) {
            serverStarted = true;
            log.info('═══════════════════════════════════════════════════');
            log.info('✓ Servidor Next.js iniciado correctamente');
            log.info('═══════════════════════════════════════════════════');
            resolve(NEXT_PORT);
          }
        });
      }

      // Capturar stderr
      if (nextServerProcess.stderr) {
        nextServerProcess.stderr.on('data', (data) => {
          const output = data.toString();
          stderrBuffer += output;

          // Filtrar warnings conocidos
          if (!output.includes('ExperimentalWarning') &&
              !output.includes('--experimental')) {
            output.split('\n').filter(Boolean).forEach(line => {
              log.warn('[Next.js stderr]', line);
            });
          }
        });
      }

      // Error al crear el proceso
      nextServerProcess.on('error', (error) => {
        log.error('Error al crear proceso Next.js:', error);
        if (!serverStarted) {
          reject(new Error(`No se pudo iniciar el proceso: ${error.message}`));
        }
      });

      // Proceso terminó
      nextServerProcess.on('exit', (code, signal) => {
        log.info(`Proceso Next.js terminó - código: ${code}, señal: ${signal}`);

        if (!serverStarted) {
          log.error('═══════════════════════════════════════════════════');
          log.error('SERVIDOR NEXT.JS FALLÓ AL INICIAR');
          log.error('═══════════════════════════════════════════════════');
          log.error('STDOUT completo:');
          log.error(stdoutBuffer || '(vacío)');
          log.error('───────────────────────────────────────────────────');
          log.error('STDERR completo:');
          log.error(stderrBuffer || '(vacío)');
          log.error('═══════════════════════════════════════════════════');

          const errorMsg = stderrBuffer.trim() || stdoutBuffer.trim() || `Proceso terminó con código ${code}`;
          reject(new Error(`Next.js falló (código ${code}): ${errorMsg.substring(0, 200)}`));
        }

        nextServerProcess = null;
      });

      // Timeout de seguridad - 20 segundos
      const timeout = setTimeout(async () => {
        if (!serverStarted) {
          log.info('Timeout alcanzado, verificando con HTTP...');
          try {
            await waitForServer(NEXT_PORT, 20);
            if (!serverStarted) {
              serverStarted = true;
              log.info('✓ Servidor verificado via HTTP');
              resolve(NEXT_PORT);
            }
          } catch (err) {
            log.error('Verificación HTTP falló:', err.message);

            // Guardar logs para diagnóstico
            log.error('═══════════════════════════════════════════════════');
            log.error('TIMEOUT: El servidor no respondió a tiempo');
            log.error('═══════════════════════════════════════════════════');
            log.error('STDOUT hasta ahora:');
            log.error(stdoutBuffer || '(vacío)');
            log.error('STDERR hasta ahora:');
            log.error(stderrBuffer || '(vacío)');

            reject(new Error(`Timeout: servidor no respondió. Ver log: ${LOG_FILE}`));
          }
        }
      }, 20000);

      // Limpiar timeout si el servidor inicia antes
      nextServerProcess.on('exit', () => clearTimeout(timeout));

    } catch (error) {
      log.error('Error crítico iniciando servidor:', error);
      reject(error);
    }
  });
}

// ============================================
// Crear ventana principal
// ============================================
async function createWindow() {
  const windowConfig = {
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    title: 'Sabrosita POS',
    show: false,
    ...(process.platform === 'win32' ? {
      titleBarStyle: 'hidden',
      titleBarOverlay: {
        color: '#0f172a',
        symbolColor: '#ffffff',
        height: 40,
      },
    } : {
      titleBarStyle: 'hiddenInset',
      trafficLightPosition: { x: 15, y: 12 },
    }),
  };

  mainWindow = new BrowserWindow(windowConfig);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    log.info('Ventana mostrada');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log.error(`Error cargando página: ${errorCode} - ${errorDescription}`);
  });

  // Usar 127.0.0.1 en lugar de localhost para Windows
  const url = `http://127.0.0.1:${NEXT_PORT}`;
  log.info(`Cargando URL: ${url}`);

  try {
    await mainWindow.loadURL(url);
    log.info('✓ Página cargada correctamente');
  } catch (error) {
    log.error('Error cargando URL:', error.message);

    // Mostrar página de error con información de diagnóstico
    const errorHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
              padding: 40px;
              background: #1e293b;
              color: white;
              line-height: 1.6;
            }
            h1 { color: #f87171; margin-bottom: 20px; }
            .error-box {
              background: #334155;
              padding: 20px;
              border-radius: 8px;
              margin: 20px 0;
              font-family: monospace;
              font-size: 14px;
              overflow-x: auto;
            }
            .log-path {
              background: #0f172a;
              padding: 10px 15px;
              border-radius: 4px;
              font-family: monospace;
              word-break: break-all;
            }
            button {
              background: #3b82f6;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
              margin-top: 20px;
            }
            button:hover { background: #2563eb; }
          </style>
        </head>
        <body>
          <h1>Error de Conexión</h1>
          <p>No se pudo conectar al servidor interno de la aplicación.</p>

          <div class="error-box">
            <strong>Error:</strong> ${error.message}
          </div>

          <p>Para diagnosticar el problema, revisa el archivo de log:</p>
          <div class="log-path">${LOG_FILE}</div>

          <p style="margin-top: 30px;">
            <strong>Posibles causas:</strong>
          </p>
          <ul>
            <li>El servidor Next.js no pudo iniciar</li>
            <li>El puerto ${NEXT_PORT} está bloqueado por el firewall</li>
            <li>Faltan archivos de la aplicación</li>
            <li>Problema de permisos en Windows</li>
          </ul>

          <button onclick="location.reload()">Reintentar</button>
        </body>
      </html>
    `;

    await mainWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(errorHtml)}`);
  }

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ============================================
// Funciones de inicialización
// ============================================

// Crear usuario de prueba si no existe
function createTestUserIfNeeded() {
  try {
    log.info('Verificando usuario de prueba...');
    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');

    const existingUsers = query('SELECT COUNT(*) as count FROM users');
    const userCount = existingUsers[0].count;

    if (userCount === 0) {
      log.info('Creando usuario de prueba...');
      const password = '1234';
      const passwordHash = bcrypt.hashSync(password, 10);
      const userId = uuidv4();
      const now = new Date().toISOString();

      run(`
        INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, 'ADMIN', passwordHash, 'admin', now, now]);

      log.info('✓ Usuario creado: ADMIN / 1234');
    } else {
      log.info(`Ya existen ${userCount} usuario(s)`);
    }
  } catch (error) {
    log.error('Error creando usuario:', error.message);
  }
}

// Cargar variables de entorno
function loadEnvFile() {
  try {
    const envPath = app.isPackaged
      ? path.join(process.resourcesPath, 'app', '.env.local')
      : path.join(__dirname, '..', '.env.local');

    log.info(`Buscando .env.local en: ${envPath}`);

    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const lines = envContent.split('\n');
      let loaded = 0;

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            process.env[key] = valueParts.join('=');
            loaded++;
          }
        }
      }
      log.info(`✓ ${loaded} variables de entorno cargadas`);
    } else {
      log.warn('Archivo .env.local no encontrado');
    }
  } catch (error) {
    log.error('Error cargando .env.local:', error.message);
  }
}

// ============================================
// Configuración de impresora
// ============================================
let selectedPrinter = null;

function loadSavedPrinter() {
  try {
    const configPath = app.isPackaged
      ? path.join(app.getPath('userData'), 'printer-config.json')
      : path.join(__dirname, '..', 'printer-config.json');

    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      selectedPrinter = config.printerName || null;
      log.info('Impresora cargada:', selectedPrinter || 'ninguna');
    }
  } catch (error) {
    log.error('Error cargando config impresora:', error.message);
  }
}

function savePrinterConfig(printerName) {
  try {
    const configPath = app.isPackaged
      ? path.join(app.getPath('userData'), 'printer-config.json')
      : path.join(__dirname, '..', 'printer-config.json');

    fs.writeFileSync(configPath, JSON.stringify({ printerName }, null, 2), 'utf8');
    selectedPrinter = printerName;
    log.info('Impresora guardada:', printerName);
    return true;
  } catch (error) {
    log.error('Error guardando impresora:', error.message);
    return false;
  }
}

// ============================================
// Iniciar aplicación
// ============================================
app.whenReady().then(async () => {
  // Inicializar sistema de logs primero
  initLogFile();

  log.info('═══════════════════════════════════════════════════');
  log.info('SABROSITA POS - Iniciando aplicación');
  log.info('═══════════════════════════════════════════════════');
  log.info(`Modo: ${isDev ? 'Desarrollo' : 'Producción'}`);
  log.info(`Empaquetado: ${app.isPackaged}`);
  log.info(`Plataforma: ${process.platform}`);
  log.info(`Arquitectura: ${process.arch}`);
  log.info('═══════════════════════════════════════════════════');

  // Cargar configuración
  loadEnvFile();
  loadSavedPrinter();

  // Inicializar base de datos
  try {
    initDatabase();
    log.info('✓ Base de datos SQLite inicializada');
    createTestUserIfNeeded();
  } catch (error) {
    log.error('Error inicializando base de datos:', error);
    dialog.showErrorBox(
      'Error de Base de Datos',
      `No se pudo inicializar la base de datos.\n\nError: ${error.message}\n\nLa aplicación se cerrará.`
    );
    app.quit();
    return;
  }

  // Iniciar servidor Next.js
  try {
    const port = await startNextServer();
    log.info(`✓ Servidor Next.js listo en puerto ${port}`);
  } catch (error) {
    log.error('═══════════════════════════════════════════════════');
    log.error('ERROR CRÍTICO: No se pudo iniciar el servidor');
    log.error(error.message);
    log.error('═══════════════════════════════════════════════════');

    dialog.showErrorBox(
      'Error de Inicio',
      `No se pudo iniciar el servidor de la aplicación.\n\n` +
      `Error: ${error.message}\n\n` +
      `Archivo de diagnóstico:\n${LOG_FILE}\n\n` +
      `Por favor, envía este archivo al soporte técnico si el problema persiste.`
    );
    app.quit();
    return;
  }

  // Crear ventana
  await createWindow();

  app.on('activate', async () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await createWindow();
    }
  });
});

// Cerrar app cuando todas las ventanas estén cerradas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase();
    app.quit();
  }
});

// Cerrar procesos antes de salir
app.on('before-quit', () => {
  log.info('Cerrando aplicación...');
  closeDatabase();

  if (nextServerProcess) {
    log.info('Terminando servidor Next.js...');
    try {
      if (process.platform === 'win32') {
        // En Windows, usar taskkill para matar el árbol de procesos
        spawn('taskkill', ['/pid', nextServerProcess.pid.toString(), '/f', '/t'], {
          windowsHide: true,
        });
      } else {
        // En Unix, enviar señal al grupo de procesos
        try {
          process.kill(-nextServerProcess.pid, 'SIGTERM');
        } catch (e) {
          nextServerProcess.kill('SIGTERM');
        }
      }
    } catch (error) {
      log.error('Error terminando proceso:', error.message);
    }
    nextServerProcess = null;
  }

  log.info('Aplicación cerrada correctamente');
});

// ============================================
// IPC Handlers - Controles de ventana
// ============================================
ipcMain.handle('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.handle('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
      return false;
    } else {
      mainWindow.maximize();
      return true;
    }
  }
  return false;
});

ipcMain.handle('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// ============================================
// IPC Handlers - Base de datos
// ============================================
ipcMain.handle('db:query', async (event, sql, params = []) => {
  try {
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');

    if (isSelect) {
      const results = query(sql, params);
      return { success: true, data: results };
    } else {
      const result = run(sql, params);
      return {
        success: true,
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid
      };
    }
  } catch (error) {
    log.error('Error en query DB:', error.message);
    return {
      success: false,
      error: error.message || 'Error en base de datos'
    };
  }
});

// ============================================
// IPC Handlers - Impresora
// ============================================
ipcMain.handle('printer:list', async () => {
  try {
    if (!mainWindow) {
      return { success: false, error: 'Ventana no disponible', printers: [] };
    }

    const printers = await mainWindow.webContents.getPrintersAsync();
    log.info('Impresoras encontradas:', printers.length);

    return {
      success: true,
      printers: printers.map(p => ({
        name: p.name,
        displayName: p.displayName || p.name,
        description: p.description || '',
        status: p.status,
        isDefault: p.isDefault,
      })),
      selectedPrinter: selectedPrinter,
    };
  } catch (error) {
    log.error('Error listando impresoras:', error);
    return { success: false, error: error.message, printers: [] };
  }
});

ipcMain.handle('printer:select', async (event, printerName) => {
  try {
    const success = savePrinterConfig(printerName);
    return { success, printerName };
  } catch (error) {
    log.error('Error seleccionando impresora:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('printer:getSelected', async () => {
  return { success: true, printerName: selectedPrinter };
});

ipcMain.handle('printer:print', async (event, data) => {
  try {
    log.info('Imprimiendo ticket...');
    log.info('Impresora:', selectedPrinter || 'default');

    if (isDev) {
      const tempFile = path.join(os.tmpdir(), `ticket-${Date.now()}.txt`);
      fs.writeFileSync(tempFile, data, 'utf8');
      log.info('Ticket guardado en:', tempFile);
    }

    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            @page { size: 80mm auto; margin: 0; }
            body {
              font-family: 'Courier New', 'Lucida Console', monospace;
              font-size: 12px;
              line-height: 1.2;
              white-space: pre-wrap;
              word-wrap: break-word;
              margin: 0;
              padding: 5mm;
              width: 70mm;
            }
          </style>
        </head>
        <body>${data.replace(/\n/g, '<br>')}</body>
      </html>
    `;

    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    return new Promise((resolve) => {
      printWindow.webContents.print(
        {
          silent: true,
          printBackground: false,
          deviceName: selectedPrinter || '',
          margins: { marginType: 'none' },
          pageSize: { width: 80000, height: 297000 },
        },
        (success, errorType) => {
          printWindow.close();

          if (success) {
            log.info('✓ Ticket impreso correctamente');
            resolve({ success: true });
          } else {
            log.error('Error imprimiendo:', errorType);
            resolve({ success: false, error: errorType || 'Error de impresión' });
          }
        }
      );
    });
  } catch (error) {
    log.error('Error en impresión:', error);
    return { success: false, error: error.message };
  }
});

// ============================================
// IPC Handlers - Scanner y Multi-ventana
// ============================================
ipcMain.handle('scanner:listen', async () => {
  log.info('Scanner listening...');
  return { success: true };
});

const posWindows = new Set();

ipcMain.handle('window:new', async () => {
  try {
    log.info('Creando nueva ventana POS...');

    const newWindow = new BrowserWindow({
      width: 1280,
      height: 800,
      minWidth: 1024,
      minHeight: 600,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
      },
      title: `Sabrosita POS - Ventana ${posWindows.size + 2}`,
      ...(process.platform === 'win32' ? {
        titleBarStyle: 'hidden',
        titleBarOverlay: {
          color: '#0f172a',
          symbolColor: '#ffffff',
          height: 40,
        },
      } : {
        titleBarStyle: 'hiddenInset',
      }),
    });

    const url = `http://127.0.0.1:${NEXT_PORT}/pos`;
    newWindow.loadURL(url);

    if (isDev) {
      newWindow.webContents.openDevTools();
    }

    posWindows.add(newWindow);

    newWindow.on('closed', () => {
      posWindows.delete(newWindow);
      log.info('Ventana POS cerrada. Activas:', posWindows.size + 1);
    });

    log.info('Nueva ventana POS creada. Total:', posWindows.size + 1);

    return { success: true, windowId: newWindow.id };
  } catch (error) {
    log.error('Error creando ventana:', error);
    return { success: false, error: error.message };
  }
});

// ============================================
// IPC Handler - Diagnósticos
// ============================================
ipcMain.handle('diagnostics:run', async () => {
  try {
    const diagnostics = require('./diagnostics');
    const report = diagnostics.generateDiagnosticReport();
    const formatted = diagnostics.formatReport(report);

    // Guardar en archivo
    const reportPath = path.join(LOG_DIR, 'diagnostic-report.txt');
    fs.writeFileSync(reportPath, formatted);

    log.info('Diagnóstico generado:', reportPath);

    return {
      success: true,
      report,
      formatted,
      savedTo: reportPath,
    };
  } catch (error) {
    log.error('Error en diagnósticos:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('diagnostics:getLogPath', async () => {
  return { success: true, logPath: LOG_FILE, logDir: LOG_DIR };
});

ipcMain.handle('diagnostics:readLog', async () => {
  try {
    if (fs.existsSync(LOG_FILE)) {
      const content = fs.readFileSync(LOG_FILE, 'utf8');
      const lines = content.split('\n');
      return {
        success: true,
        path: LOG_FILE,
        lines: lines.length,
        content: lines.slice(-100).join('\n'), // Últimas 100 líneas
      };
    }
    return { success: false, error: 'Log file not found' };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

log.info('Electron Main Process cargado');

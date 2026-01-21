const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const isDev = process.env.NODE_ENV === 'development';
const { initDatabase, query, run, closeDatabase } = require('./database/init');

// ============================================
// Logger seguro que no falla con EPIPE en macOS
// ============================================
const safeLog = (...args) => {
  try {
    console.log(...args);
  } catch (err) {
    // Ignorar errores EPIPE silenciosamente
    if (err.code !== 'EPIPE') {
      // Solo mostrar errores que NO sean EPIPE
      process.stderr.write(`Logger error: ${err.message}\n`);
    }
  }
};

const safeError = (...args) => {
  try {
    console.error(...args);
  } catch (err) {
    if (err.code !== 'EPIPE') {
      process.stderr.write(`Logger error: ${err.message}\n`);
    }
  }
};

// Capturar errores no manejados de forma segura
process.on('uncaughtException', (error) => {
  if (error.code === 'EPIPE') {
    // Ignorar EPIPE silenciosamente
    return;
  }
  safeError('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  safeError('Unhandled rejection at:', promise, 'reason:', reason);
});

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
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
    autoHideMenuBar: true,
    title: 'Sabrosita POS',
  });

  if (isDev) {
    // Modo desarrollo: conectar a Next.js dev server
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    // Modo producción: cargar build exportado de Next.js
    mainWindow.loadFile(path.join(__dirname, '../out/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Crear usuario de prueba si no existe
function createTestUserIfNeeded() {
  try {
    safeLog('');
    safeLog('═══════════════════════════════════════════════════');
    safeLog('🔐 Verificando usuario de prueba...');
    safeLog('═══════════════════════════════════════════════════');

    const bcrypt = require('bcryptjs');
    const { v4: uuidv4 } = require('uuid');

    // Verificar si ya existe un usuario
    safeLog('📊 Consultando usuarios existentes...');
    const existingUsers = query('SELECT COUNT(*) as count FROM users');
    const userCount = existingUsers[0].count;
    safeLog(`   Total usuarios en DB: ${userCount}`);

    if (userCount === 0) {
      safeLog('');
      safeLog('📝 No hay usuarios. Creando usuario de prueba...');

      // Hash password
      const password = '1234';
      const saltRounds = 10;
      safeLog(`   - Hasheando password "${password}" con bcrypt (${saltRounds} rounds)...`);
      const passwordHash = bcrypt.hashSync(password, saltRounds);
      safeLog(`   - Hash generado: ${passwordHash.substring(0, 29)}...`);

      // Create user
      const userId = uuidv4();
      const now = new Date().toISOString();
      safeLog(`   - ID generado: ${userId}`);
      safeLog(`   - Timestamp: ${now}`);

      safeLog('   - Insertando en tabla users...');
      const result = run(`
        INSERT INTO users (id, username, password_hash, role, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [userId, 'ADMIN', passwordHash, 'admin', now, now]);

      safeLog(`   - Rows insertados: ${result.changes}`);

      // Verificar que se creó
      const verification = query('SELECT id, username, role FROM users WHERE id = ?', [userId]);
      if (verification.length > 0) {
        safeLog('');
        safeLog('✅ Usuario de prueba creado y verificado:');
        safeLog(`   Username: ${verification[0].username}`);
        safeLog('   Password: 1234');
        safeLog(`   Role: ${verification[0].role}`);
        safeLog(`   ID: ${verification[0].id}`);
      } else {
        safeError('⚠️  Usuario insertado pero no se pudo verificar');
      }
    } else {
      safeLog('');
      safeLog(`👤 Ya existen ${userCount} usuario(s) en la base de datos`);

      // Listar usuarios existentes para debug
      const users = query('SELECT username, role FROM users');
      safeLog('   Usuarios existentes:');
      users.forEach((user, index) => {
        safeLog(`   ${index + 1}. ${user.username} (${user.role})`);
      });
    }

    safeLog('═══════════════════════════════════════════════════');
    safeLog('');
  } catch (error) {
    safeLog('');
    safeError('❌ ERROR al crear usuario de prueba:');
    safeError(`   Mensaje: ${error.message}`);
    safeError(`   Stack: ${error.stack}`);
    safeLog('═══════════════════════════════════════════════════');
    safeLog('');
  }
}

// Iniciar app cuando Electron esté listo
app.whenReady().then(() => {
  // Inicializar base de datos local
  try {
    initDatabase();
    safeLog('✅ Base de datos SQLite inicializada');

    // Crear usuario de prueba si es necesario
    createTestUserIfNeeded();
  } catch (error) {
    safeError('❌ Error al inicializar base de datos:', error);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Cerrar app cuando todas las ventanas estén cerradas (excepto en macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    closeDatabase(); // Cerrar DB antes de salir
    app.quit();
  }
});

// Cerrar base de datos antes de salir
app.on('before-quit', () => {
  closeDatabase();
});

// ============================================
// IPC Handlers (comunicación Renderer <-> Main)
// ============================================

// Handler para base de datos local (SQLite)
ipcMain.handle('db:query', async (event, sql, params = []) => {
  try {
    safeLog('[DB] ═══════════════════════════════════');
    safeLog('[DB] Query recibida:', sql.substring(0, 100));
    safeLog('[DB] Params:', params);

    // Determinar si es SELECT o INSERT/UPDATE/DELETE
    const isSelect = sql.trim().toUpperCase().startsWith('SELECT');
    safeLog('[DB] Es SELECT:', isSelect);

    if (isSelect) {
      // Query SELECT - retorna rows
      const results = query(sql, params);
      safeLog('[DB] ✅ Query ejecutada. Rows:', results.length);
      if (results.length > 0) {
        safeLog('[DB] Primer resultado:', JSON.stringify(results[0]));
      }

      const response = { success: true, data: results };
      safeLog('[DB] Retornando:', JSON.stringify(response).substring(0, 200));
      return response;
    } else {
      // Query INSERT/UPDATE/DELETE - retorna info de ejecución
      const result = run(sql, params);
      const response = {
        success: true,
        changes: result.changes,
        lastInsertRowid: result.lastInsertRowid
      };
      safeLog('[DB] Retornando:', JSON.stringify(response));
      return response;
    }
  } catch (error) {
    safeError('[DB] ❌ Error en query:', error.message);
    safeError('[DB] ❌ Error stack:', error.stack);
    const errorResponse = {
      success: false,
      error: error.message || 'Error en base de datos'
    };
    safeError('[DB] Retornando error:', JSON.stringify(errorResponse));
    return errorResponse;
  }
});

// Handler para impresora térmica
ipcMain.handle('printer:print', async (event, data) => {
  try {
    safeLog('[Printer] Printing ticket...');

    // En desarrollo: guardar en archivo temporal para debug
    if (isDev) {
      const tempFile = path.join(os.tmpdir(), `ticket-${Date.now()}.txt`);
      fs.writeFileSync(tempFile, data, 'utf8');
      safeLog('[Printer] Ticket saved to:', tempFile);

      // Mostrar contenido en consola (primeros 500 chars)
      safeLog('[Printer] Preview:', data.substring(0, 500));
    }

    // En producción: enviar a impresora
    // Opción 1: Usar BrowserWindow.webContents.print()
    // Opción 2: Escribir directamente al puerto de impresora
    // Opción 3: Usar librería externa como electron-pos-printer

    // Por ahora, para compatibilidad multiplataforma:
    // Intentar enviar a impresora predeterminada del sistema
    if (!isDev) {
      // Crear ventana oculta para imprimir
      const printWindow = new BrowserWindow({ show: false });

      // Cargar contenido como HTML pre-formateado
      const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body {
                font-family: 'Courier New', monospace;
                font-size: 12px;
                white-space: pre;
                margin: 0;
                padding: 0;
              }
            </style>
          </head>
          <body>${data}</body>
        </html>
      `;

      printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      // Imprimir silenciosamente cuando cargue
      printWindow.webContents.on('did-finish-load', () => {
        printWindow.webContents.print(
          {
            silent: true, // No mostrar diálogo
            printBackground: false,
            deviceName: '', // Impresora predeterminada
          },
          (success, errorType) => {
            if (!success) {
              safeError('[Printer] Print failed:', errorType);
            }
            printWindow.close();
          }
        );
      });
    }

    return { success: true };
  } catch (error) {
    safeError('[Printer] Error:', error);
    return {
      success: false,
      error: error.message || 'Error al imprimir'
    };
  }
});

// Handler para scanner USB
ipcMain.handle('scanner:listen', async (event) => {
  // TODO: Implementar listener de scanner
  safeLog('Scanner listening...');
  return { success: true };
});

// Gestión de ventanas adicionales
const posWindows = new Set();

// Handler para multi-ventana
ipcMain.handle('window:new', async (event) => {
  try {
    safeLog('[Window] Creating new POS window...');

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
      autoHideMenuBar: true,
      title: `Sabrosita POS - Ventana ${posWindows.size + 2}`,
    });

    if (isDev) {
      newWindow.loadURL('http://localhost:3000/pos');
      newWindow.webContents.openDevTools();
    } else {
      newWindow.loadFile(path.join(__dirname, '../out/index.html'), {
        hash: 'pos'
      });
    }

    // Agregar a set de ventanas
    posWindows.add(newWindow);

    // Remover cuando se cierre
    newWindow.on('closed', () => {
      posWindows.delete(newWindow);
      safeLog('[Window] POS window closed. Active windows:', posWindows.size + 1);
    });

    safeLog('[Window] New POS window created. Total windows:', posWindows.size + 1);

    return {
      success: true,
      windowId: newWindow.id
    };
  } catch (error) {
    safeError('[Window] Error creating window:', error);
    return {
      success: false,
      error: error.message || 'Error al crear ventana'
    };
  }
});

safeLog('Sabrosita POS - Electron Main Process Started');

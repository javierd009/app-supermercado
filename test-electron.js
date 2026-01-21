/**
 * Script de test para Electron
 * Carga el archivo test-electron-api.html para verificar window.electronAPI
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'electron', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
    title: 'Test Electron API',
  });

  // Cargar HTML de test
  mainWindow.loadFile(path.join(__dirname, 'test-electron-api.html'));

  // Abrir DevTools automáticamente
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Inicializar base de datos
  const { initDatabase } = require('./electron/database/init');
  initDatabase();

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handler para queries (copiar del main.js original)
const { ipcMain } = require('electron');
const { query, run } = require('./electron/database/init');

ipcMain.handle('db:query', async (event, sql, params = []) => {
  try {
    console.log('[TEST] Query:', sql.substring(0, 100), params);

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
    console.error('[TEST] Error:', error);
    return {
      success: false,
      error: error.message || 'Error en base de datos'
    };
  }
});

console.log('Test Electron iniciado');

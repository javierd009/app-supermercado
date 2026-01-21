const { contextBridge, ipcRenderer } = require('electron');

console.log('═══════════════════════════════════════════════════');
console.log('🔌 PRELOAD: Script iniciando...');
console.log('═══════════════════════════════════════════════════');

// Exponer APIs seguras al renderer process (Next.js)
try {
  contextBridge.exposeInMainWorld('electronAPI', {
    // Base de datos local (SQLite)
    db: {
      query: (query, params) => {
        console.log('[Preload] db.query llamado:', query.substring(0, 50));
        return ipcRenderer.invoke('db:query', query, params);
      },
    },

    // Impresora térmica
    printer: {
      print: (data) => ipcRenderer.invoke('printer:print', data),
    },

    // Scanner de código de barras
    scanner: {
      listen: () => ipcRenderer.invoke('scanner:listen'),
      onScan: (callback) => {
        ipcRenderer.on('scanner:data', (event, data) => callback(data));
      },
    },

    // Multi-ventana
    window: {
      createNew: () => ipcRenderer.invoke('window:new'),
    },

    // Información del sistema
    platform: process.platform,
    isElectron: true,
  });

  console.log('✅ PRELOAD: electronAPI expuesto exitosamente');
  console.log('   - platform:', process.platform);
  console.log('   - isElectron: true');
  console.log('   - db.query: function');
  console.log('═══════════════════════════════════════════════════');

  // Enviar confirmación al main process
  ipcRenderer.send('preload-ready', {
    platform: process.platform,
    isElectron: true,
    timestamp: Date.now()
  });
} catch (error) {
  console.error('❌ PRELOAD: Error exponiendo electronAPI:', error);
  ipcRenderer.send('preload-error', error.message);
}

// Verificar que window.electronAPI esté disponible después de DOMContentLoaded
window.addEventListener('DOMContentLoaded', () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🌐 PRELOAD: DOMContentLoaded');
  console.log('   window.electronAPI existe:', typeof window.electronAPI !== 'undefined');
  if (window.electronAPI) {
    console.log('   window.electronAPI.isElectron:', window.electronAPI.isElectron);
    console.log('   window.electronAPI.db:', typeof window.electronAPI.db);
  }
  console.log('═══════════════════════════════════════════════════');
});

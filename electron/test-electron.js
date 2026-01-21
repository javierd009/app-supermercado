// Test mínimo de Electron
console.log('=== TEST ELECTRON ===');

const electron = require('electron');
console.log('1. electron type:', typeof electron);

if (typeof electron === 'string') {
  console.log('2. electron es string (path):', electron);
  console.log('ERROR: Electron no se está ejecutando correctamente');
  process.exit(1);
}

console.log('3. electron object keys:', Object.keys(electron).slice(0, 10));

const { app } = electron;
console.log('4. app:', app);
console.log('5. app type:', typeof app);

if (app) {
  console.log('✅ SUCCESS: app está disponible');
  app.whenReady().then(() => {
    console.log('✅ App ready!');
    app.quit();
  });
} else {
  console.log('❌ ERROR: app es undefined');
  process.exit(1);
}

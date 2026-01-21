/**
 * Test Login Flow in Electron
 * Simula el flujo completo de login usando Electron + SQLite
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');

// Esperar a que Electron esté listo
app.whenReady().then(async () => {
  console.log('═══════════════════════════════════════════════════');
  console.log('🧪 TEST: Login Flow en Electron');
  console.log('═══════════════════════════════════════════════════');

  try {
    // 1. Conectar a la base de datos
    const dbPath = path.join(__dirname, '..', 'sabrosita.db');
    console.log('📁 Ruta DB:', dbPath);

    const db = new Database(dbPath);
    console.log('✅ Conectado a SQLite');

    // 2. Obtener todos los usuarios (simula authService.login línea 36)
    console.log('');
    console.log('👥 Obteniendo usuarios...');
    const users = db.prepare('SELECT * FROM users').all();
    console.log(`✅ Usuarios encontrados: ${users.length}`);

    if (users.length === 0) {
      console.error('❌ No hay usuarios en la base de datos');
      app.quit();
      return;
    }

    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.username} (${user.role})`);
    });

    // 3. Verificar contraseña "1234" (simula authService.login línea 69-76)
    console.log('');
    console.log('🔐 Verificando contraseña "1234"...');

    let matchedUser = null;
    for (const user of users) {
      console.log(`   Probando con usuario: ${user.username}`);

      // Verificar si el hash es bcrypt
      if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
        const isPasswordValid = await bcrypt.compare('1234', user.password_hash);
        console.log(`   - bcrypt.compare('1234', hash): ${isPasswordValid}`);

        if (isPasswordValid) {
          matchedUser = user;
          console.log(`   ✅ Password válida para ${user.username}`);
          break;
        } else {
          console.log(`   ❌ Password inválida para ${user.username}`);
        }
      } else {
        console.log(`   ⚠️ Password no hasheada (legacy)`);
      }
    }

    console.log('');
    if (matchedUser) {
      console.log('═══════════════════════════════════════════════════');
      console.log('✅ LOGIN EXITOSO');
      console.log('═══════════════════════════════════════════════════');
      console.log('Usuario:', matchedUser.username);
      console.log('Role:', matchedUser.role);
      console.log('ID:', matchedUser.id);
      console.log('═══════════════════════════════════════════════════');
      console.log('');
      console.log('🎉 El login funcionará correctamente en Electron');
      console.log('');
    } else {
      console.log('═══════════════════════════════════════════════════');
      console.log('❌ LOGIN FALLIDO');
      console.log('═══════════════════════════════════════════════════');
      console.log('Contraseña "1234" no coincide con ningún usuario');
      console.log('');
    }

    db.close();
    app.quit();
  } catch (error) {
    console.error('');
    console.error('═══════════════════════════════════════════════════');
    console.error('❌ ERROR EN TEST');
    console.error('═══════════════════════════════════════════════════');
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    app.quit();
  }
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  app.quit();
});

#!/usr/bin/env node
/**
 * Test del flujo completo de login
 * Simula exactamente lo que hace authService
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'sabrosita.db');

console.log('🧪 TEST: Flujo de Login Completo\n');
console.log('═══════════════════════════════════════════════════');
console.log('PASO 1: Simular databaseAdapter.query()');
console.log('═══════════════════════════════════════════════════\n');

try {
  const db = new Database(dbPath, { readonly: true });

  // PASO 1: Query igual que authService línea 36
  console.log('[Test] Ejecutando: SELECT * FROM users');
  const users = db.prepare('SELECT * FROM users').all();
  console.log(`[Test] ✅ Query exitosa. Usuarios encontrados: ${users.length}\n`);

  if (users.length === 0) {
    console.error('❌ ERROR: No hay usuarios (igual que el error reportado)\n');
    db.close();
    process.exit(1);
  }

  console.log('[Test] Usuarios:');
  users.forEach((user, index) => {
    console.log(`   ${index + 1}. Username: ${user.username}, Role: ${user.role}`);
  });

  console.log('\n═══════════════════════════════════════════════════');
  console.log('PASO 2: Verificar contraseñas (igual que authService)');
  console.log('═══════════════════════════════════════════════════\n');

  const password = '1234';
  console.log(`[Test] Verificando contraseña "${password}" para ${users.length} usuarios...\n`);

  let matchedUser = null;
  for (const user of users) {
    console.log(`[Test] Probando usuario: ${user.username}`);
    console.log(`   Hash: ${user.password_hash.substring(0, 29)}...`);

    const isPasswordValid = bcrypt.compareSync(password, user.password_hash);
    console.log(`   Resultado: ${isPasswordValid ? '✅ MATCH' : '❌ No match'}\n`);

    if (isPasswordValid) {
      matchedUser = user;
      break;
    }
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('RESULTADO FINAL');
  console.log('═══════════════════════════════════════════════════\n');

  if (matchedUser) {
    console.log('✅ LOGIN EXITOSO');
    console.log(`   Usuario: ${matchedUser.username}`);
    console.log(`   Role: ${matchedUser.role}`);
    console.log(`   ID: ${matchedUser.id}`);
    console.log('\n🎉 El flujo de login debería funcionar correctamente\n');
  } else {
    console.log('❌ LOGIN FALLIDO');
    console.log('   Ninguna contraseña coincidió\n');
  }

  db.close();
} catch (error) {
  console.error('❌ ERROR EN EL FLUJO:', error.message);
  console.error(error.stack);
  process.exit(1);
}

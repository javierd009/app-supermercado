#!/usr/bin/env node
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Ruta de la base de datos (misma que usa Electron en desarrollo)
const dbPath = path.join(__dirname, '..', 'sabrosita.db');

console.log('🔍 Diagnóstico de Base de Datos SQLite\n');
console.log('📂 Ruta:', dbPath);

// Verificar si el archivo existe
if (!fs.existsSync(dbPath)) {
  console.error('❌ ERROR: El archivo de base de datos NO existe');
  console.log('\n💡 Solución: Ejecuta la app Electron al menos una vez para crear la DB');
  process.exit(1);
}

console.log('✅ Archivo de base de datos existe\n');

try {
  // Abrir base de datos
  const db = new Database(dbPath, { readonly: true });
  console.log('✅ Base de datos abierta correctamente\n');

  // Verificar tabla users
  const tableInfo = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();

  if (!tableInfo) {
    console.error('❌ ERROR: La tabla "users" NO existe');
    db.close();
    process.exit(1);
  }

  console.log('✅ Tabla "users" existe\n');

  // Contar usuarios
  const countResult = db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log(`📊 Total de usuarios en la base de datos: ${countResult.count}\n`);

  if (countResult.count === 0) {
    console.error('❌ ERROR: No hay usuarios en la base de datos');
    console.log('\n💡 Esto significa que createTestUserIfNeeded() no se ejecutó');
    console.log('   Posibles causas:');
    console.log('   1. Electron no se inició correctamente');
    console.log('   2. Hubo un error al crear el usuario');
    console.log('   3. El código de createTestUserIfNeeded() tiene un bug\n');
    db.close();
    process.exit(1);
  }

  // Listar usuarios
  console.log('👥 Usuarios en la base de datos:\n');
  const users = db.prepare('SELECT id, username, role, created_at, password_hash FROM users').all();

  users.forEach((user, index) => {
    console.log(`[${index + 1}] Usuario:`);
    console.log(`    ID: ${user.id}`);
    console.log(`    Username: ${user.username}`);
    console.log(`    Role: ${user.role}`);
    console.log(`    Created: ${user.created_at}`);
    console.log(`    Password Hash: ${user.password_hash.substring(0, 20)}...`);

    // Verificar si el hash es válido (formato bcrypt)
    const isBcrypt = user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$');
    console.log(`    Hash válido: ${isBcrypt ? '✅' : '❌'}`);

    // Intentar verificar la contraseña "1234"
    if (isBcrypt) {
      const isValid = bcrypt.compareSync('1234', user.password_hash);
      console.log(`    Contraseña "1234" coincide: ${isValid ? '✅' : '❌'}`);
    }

    console.log('');
  });

  db.close();
  console.log('✅ Diagnóstico completado exitosamente');

} catch (error) {
  console.error('❌ ERROR al leer la base de datos:', error.message);
  process.exit(1);
}

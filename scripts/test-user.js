#!/usr/bin/env node
/**
 * Script para probar la contraseña del usuario ADMIN
 * Este script se ejecuta con Electron para tener acceso a better-sqlite3
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'sabrosita.db');
console.log('📂 Base de datos:', dbPath);

try {
  const db = new Database(dbPath, { readonly: true });

  // Obtener usuario ADMIN
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get('ADMIN');

  if (!user) {
    console.error('❌ Usuario ADMIN no encontrado');
    process.exit(1);
  }

  console.log('\n✅ Usuario ADMIN encontrado:');
  console.log('   ID:', user.id);
  console.log('   Username:', user.username);
  console.log('   Role:', user.role);
  console.log('   Password Hash:', user.password_hash.substring(0, 29) + '...');

  // Verificar contraseña
  const password = '1234';
  console.log('\n🔐 Probando contraseña "1234"...');

  const isValid = bcrypt.compareSync(password, user.password_hash);

  if (isValid) {
    console.log('✅ ¡Contraseña correcta!');
  } else {
    console.log('❌ Contraseña incorrecta');
  }

  db.close();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

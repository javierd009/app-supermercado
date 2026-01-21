const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'sabrosita.db');
console.log('📦 Abriendo base de datos:', dbPath);

const db = new Database(dbPath);

// Hash password
const password = '1234';
const saltRounds = 10;
const passwordHash = bcrypt.hashSync(password, saltRounds);

// Create user
const userId = uuidv4();
const now = new Date().toISOString();

const stmt = db.prepare(`
  INSERT OR REPLACE INTO users (id, username, password_hash, role, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

stmt.run(userId, 'ADMIN', passwordHash, 'admin', now, now);

console.log('✅ Usuario creado:');
console.log('   Username: ADMIN');
console.log('   Password: 1234');
console.log('   Role: admin');
console.log('   ID:', userId);

// Verificar
const users = db.prepare('SELECT id, username, role, created_at FROM users').all();
console.log('\n📋 Usuarios en SQLite:');
console.table(users);

db.close();

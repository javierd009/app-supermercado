const { app } = require('electron');
const Database = require('better-sqlite3');
const path = require('path');

app.whenReady().then(() => {
  const dbPath = path.join(__dirname, '..', 'sabrosita.db');
  const db = new Database(dbPath, { readonly: true });

  console.log('═══════════════════════════════════════════════════');
  console.log('📊 DIAGNÓSTICO: Base de Datos Local SQLite');
  console.log('═══════════════════════════════════════════════════');
  console.log('Archivo:', dbPath);
  console.log('');

  // Verificar usuarios
  console.log('=== USUARIOS EN SQLITE LOCAL ===');
  const users = db.prepare('SELECT id, username, role FROM users').all();
  console.log(`Total usuarios: ${users.length}`);
  users.forEach((u, i) => {
    console.log(`  ${i+1}. ${u.username} (role: ${u.role})`);
  });

  // Verificar todas las tablas
  console.log('');
  console.log('=== TODAS LAS TABLAS ===');
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type='table' AND name NOT LIKE 'sqlite_%'
    ORDER BY name
  `).all();

  tables.forEach((t, i) => {
    const count = db.prepare(`SELECT COUNT(*) as count FROM ${t.name}`).get();
    console.log(`  ${i+1}. ${t.name}: ${count.count} registros`);
  });

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('📋 RESUMEN');
  console.log('═══════════════════════════════════════════════════');

  if (users.length === 1 && users[0].username === 'ADMIN') {
    console.log('⚠️  Solo existe el usuario de prueba ADMIN');
    console.log('⚠️  Falta sincronizar usuarios de Supabase');
  }

  const productsTable = tables.find(t => t.name === 'products');
  if (productsTable) {
    const productsCount = db.prepare('SELECT COUNT(*) as count FROM products').get();
    if (productsCount.count === 0) {
      console.log('⚠️  Tabla products existe pero está vacía');
      console.log('⚠️  Falta sincronizar inventario de Supabase');
    } else {
      console.log(`✅ Tabla products tiene ${productsCount.count} productos`);
    }
  } else {
    console.log('❌ Tabla products NO EXISTE en SQLite local');
  }

  console.log('');
  console.log('💡 RECOMENDACIÓN:');
  console.log('   Necesitas un script de sincronización inicial que:');
  console.log('   1. Descargue todos los usuarios de Supabase');
  console.log('   2. Descargue todo el inventario (products)');
  console.log('   3. Descargue todos los demás datos');
  console.log('   4. Los inserte en SQLite local');
  console.log('');

  db.close();
  app.quit();
});

app.on('window-all-closed', () => {
  app.quit();
});

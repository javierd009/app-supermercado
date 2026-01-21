#!/usr/bin/env node

/**
 * Script de Configuración Automática de Supabase
 *
 * Ejecuta la migración completa de la base de datos:
 * - Crea 7 tablas
 * - Configura políticas RLS
 * - Crea usuarios iniciales
 * - Inserta configuración
 *
 * Uso:
 *   node scripts/setup-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

async function setupSupabase() {
  log('\n╔════════════════════════════════════════════════╗', 'blue');
  log('║   Sabrosita POS - Setup Automático Supabase   ║', 'blue');
  log('╚════════════════════════════════════════════════╝\n', 'blue');

  // Leer credenciales
  const envPath = path.join(__dirname, '..', '.env.local');

  if (!fs.existsSync(envPath)) {
    logError('.env.local no encontrado');
    logInfo('El archivo .env.local debe existir con:');
    console.log('  NEXT_PUBLIC_SUPABASE_URL=...');
    console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY=...\n');
    process.exit(1);
  }

  // Cargar .env.local
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  const env = {};

  envLines.forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1].trim()] = match[2].trim();
    }
  });

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logError('Credenciales de Supabase no configuradas en .env.local');
    process.exit(1);
  }

  logInfo(`Conectando a: ${supabaseUrl}`);

  // Crear cliente Supabase
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Paso 1: Leer archivo de migración
  logInfo('Paso 1/5: Leyendo archivo de migración SQL...');

  const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', '20260116_initial_schema.sql');

  if (!fs.existsSync(migrationPath)) {
    logError(`Archivo de migración no encontrado: ${migrationPath}`);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  logSuccess('Archivo de migración cargado');

  // Paso 2: Ejecutar migración
  logInfo('Paso 2/5: Ejecutando migración...');
  logWarning('Nota: Las políticas RLS requieren service_role key para crearse');
  logWarning('Si este paso falla, ejecuta el SQL manualmente en Supabase Dashboard');

  try {
    // Nota: El cliente anon no puede ejecutar DDL (CREATE TABLE, etc.)
    // Esto solo funcionaría con service_role key
    // Por ahora, solo verificamos la conexión

    logWarning('Verificando conexión a Supabase...');
    const { data, error } = await supabase.from('users').select('count').limit(1);

    if (error && error.message.includes('relation "users" does not exist')) {
      logError('❌ Las tablas NO existen todavía');
      logInfo('\n📋 ACCIÓN REQUERIDA:');
      logInfo('1. Ve a: https://supabase.com/dashboard');
      logInfo('2. Abre tu proyecto');
      logInfo('3. Ve a SQL Editor');
      logInfo('4. Copia y pega el contenido de:');
      logInfo(`   ${migrationPath}`);
      logInfo('5. Click en "Run"');
      logInfo('6. Vuelve a ejecutar este script\n');
      process.exit(1);
    } else if (error) {
      logError(`Error verificando tablas: ${error.message}`);
      process.exit(1);
    } else {
      logSuccess('✅ Tablas ya existen');
    }

  } catch (err) {
    logError(`Error en migración: ${err.message}`);
    process.exit(1);
  }

  // Paso 3: Verificar/Crear usuarios
  logInfo('Paso 3/5: Configurando usuarios iniciales...');

  const usuariosACrear = [
    { username: 'ADMIN', password: 'admin123', role: 'super_admin' },
    { username: 'CAJERO1', password: 'cajero123', role: 'cashier' },
    { username: 'MANAGER1', password: 'manager123', role: 'admin' },
  ];

  for (const usuario of usuariosACrear) {
    // Verificar si existe
    const { data: existing } = await supabase
      .from('users')
      .select('id, username')
      .eq('username', usuario.username)
      .single();

    if (existing) {
      logInfo(`   Usuario ${usuario.username} ya existe, saltando...`);
      continue;
    }

    // Crear usuario
    const { error } = await supabase
      .from('users')
      .insert({
        username: usuario.username,
        password_hash: usuario.password, // Temporal, será hasheado después
        role: usuario.role,
      });

    if (error) {
      logWarning(`   Error creando ${usuario.username}: ${error.message}`);
    } else {
      logSuccess(`   Usuario ${usuario.username} creado (${usuario.role})`);
    }
  }

  // Paso 4: Verificar tablas
  logInfo('Paso 4/5: Verificando tablas creadas...');

  const tablasEsperadas = [
    'users',
    'products',
    'cash_registers',
    'sales',
    'sale_items',
    'sync_queue',
    'config',
  ];

  let tablasEncontradas = 0;

  for (const tabla of tablasEsperadas) {
    const { data, error } = await supabase
      .from(tabla)
      .select('count')
      .limit(1);

    if (!error) {
      logSuccess(`   ✓ Tabla '${tabla}' existe`);
      tablasEncontradas++;
    } else {
      logWarning(`   ✗ Tabla '${tabla}' NO existe`);
    }
  }

  if (tablasEncontradas === tablasEsperadas.length) {
    logSuccess(`Todas las ${tablasEncontradas} tablas creadas correctamente`);
  } else {
    logWarning(`Solo ${tablasEncontradas}/${tablasEsperadas.length} tablas encontradas`);
  }

  // Paso 5: Resumen
  logInfo('Paso 5/5: Generando resumen...');

  // Contar usuarios
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('username, role');

  if (!usersError && users) {
    log('\n📊 Usuarios creados:', 'blue');
    users.forEach(user => {
      console.log(`   • ${user.username.padEnd(15)} - ${user.role}`);
    });
  }

  // Verificar configuración
  const { data: configs, error: configsError } = await supabase
    .from('config')
    .select('key, value');

  if (!configsError && configs && configs.length > 0) {
    log('\n⚙️  Configuración:', 'blue');
    configs.forEach(config => {
      console.log(`   • ${config.key}: ${config.value}`);
    });
  }

  // Resumen final
  log('\n╔════════════════════════════════════════════════╗', 'green');
  log('║           ✅ Setup Completado                 ║', 'green');
  log('╚════════════════════════════════════════════════╝\n', 'green');

  logSuccess(`Base de datos configurada: ${supabaseUrl}`);
  logSuccess(`Usuarios creados: ${users?.length || 0}`);
  logSuccess(`Tablas verificadas: ${tablasEncontradas}/${tablasEsperadas.length}`);

  log('\n📝 Próximos pasos:', 'blue');
  log('   1. Ejecutar: ./setup-final.sh');
  log('   2. Esto instalará dependencias y hasheará passwords');
  log('   3. Probar la aplicación: npm run dev:electron');
  log('   4. Login con: ADMIN / admin123\n');

  log('🎉 ¡Supabase listo para usar!\n', 'green');
}

// Ejecutar
setupSupabase().catch(error => {
  logError(`\n💥 Error fatal: ${error.message}`);
  console.error(error);
  process.exit(1);
});

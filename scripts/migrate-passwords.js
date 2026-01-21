/**
 * Script de Migración de Passwords a Bcrypt
 *
 * Ejecutar UNA VEZ después de instalar bcrypt
 * para hashear todos los passwords existentes en la base de datos.
 *
 * Uso:
 *   node scripts/migrate-passwords.js
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

// Leer credenciales de .env.local
const envPath = path.join(__dirname, '..', '.env.local');

if (!fs.existsSync(envPath)) {
  console.error('❌ Error: .env.local no encontrado');
  process.exit(1);
}

// Parsear .env.local
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
  console.error('❌ Error: Variables de entorno no configuradas en .env.local');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migratePasswords() {
  console.log('🔄 Iniciando migración de passwords...\n');

  // Obtener todos los usuarios
  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, password_hash');

  if (error) {
    console.error('❌ Error obteniendo usuarios:', error.message);
    process.exit(1);
  }

  if (!users || users.length === 0) {
    console.log('⚠️  No se encontraron usuarios en la base de datos');
    process.exit(0);
  }

  console.log(`📊 Encontrados ${users.length} usuarios:\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const user of users) {
    // Solo hashear si NO está hasheado ya
    // Bcrypt hashes empiezan con "$2b$" o "$2a$"
    if (user.password_hash.startsWith('$2b$') || user.password_hash.startsWith('$2a$')) {
      console.log(`   ✅ ${user.username.padEnd(20)} - Ya hasheado, skip`);
      skipped++;
      continue;
    }

    try {
      // Hashear password actual (que está en texto plano)
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(user.password_hash, saltRounds);

      // Actualizar en DB
      const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      console.log(`   🔒 ${user.username.padEnd(20)} - Password hasheado`);
      migrated++;
    } catch (err) {
      console.error(`   ❌ ${user.username.padEnd(20)} - Error:`, err.message);
      errors++;
    }
  }

  // Resumen
  console.log('\n' + '='.repeat(60));
  console.log('📊 Resumen de Migración:');
  console.log('='.repeat(60));
  console.log(`   Total usuarios:    ${users.length}`);
  console.log(`   ✅ Migrados:       ${migrated}`);
  console.log(`   ⏭️  Ya hasheados:   ${skipped}`);
  console.log(`   ❌ Errores:        ${errors}`);
  console.log('='.repeat(60));

  if (errors > 0) {
    console.log('\n⚠️  Advertencia: Algunos usuarios no se migraron correctamente');
    console.log('   Revisar errores arriba y volver a ejecutar si es necesario\n');
    process.exit(1);
  } else if (migrated > 0) {
    console.log('\n🎉 ¡Migración completada exitosamente!');
    console.log('   Todos los passwords están ahora hasheados con bcrypt\n');
  } else {
    console.log('\n✅ No fue necesario migrar ningún usuario');
    console.log('   Todos los passwords ya estaban hasheados\n');
  }
}

// Ejecutar
migratePasswords().catch((error) => {
  console.error('\n💥 Error fatal:', error);
  process.exit(1);
});

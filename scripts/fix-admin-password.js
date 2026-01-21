const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

(async () => {
  console.log('🔄 Generando hash válido para ADMIN...\n');

  // Generar hash válido para "admin123"
  const newHash = await bcrypt.hash('admin123', 10);

  console.log('Nuevo hash generado:', newHash.substring(0, 30) + '...');

  // Actualizar en DB
  const { error } = await supabase
    .from('users')
    .update({ password_hash: newHash })
    .eq('username', 'ADMIN');

  if (error) {
    console.error('❌ Error actualizando:', error.message);
  } else {
    console.log('✅ Hash de ADMIN actualizado correctamente');

    // Verificar
    const { data } = await supabase.from('users').select('password_hash').eq('username', 'ADMIN').single();
    const isValid = await bcrypt.compare('admin123', data.password_hash);
    console.log('✅ Verificación: bcrypt.compare("admin123", hash) =', isValid);
  }
})();

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
  const { data } = await supabase.from('users').select('username, password_hash').eq('username', 'ADMIN').single();

  console.log('\n=== Verificación de Hash ADMIN ===');
  console.log('Usuario:', data.username);
  console.log('Hash (primeros 30 chars):', data.password_hash.substring(0, 30) + '...');
  console.log('Empieza con $2b$:', data.password_hash.startsWith('$2b$'));
  console.log('Longitud del hash:', data.password_hash.length);

  // Probar comparación
  console.log('\n=== Prueba de Comparación ===');
  const isValid = await bcrypt.compare('admin123', data.password_hash);
  console.log('bcrypt.compare("admin123", hash):', isValid);

  // Generar nuevo hash para comparar
  console.log('\n=== Generando Nuevo Hash ===');
  const newHash = await bcrypt.hash('admin123', 10);
  console.log('Nuevo hash:', newHash.substring(0, 30) + '...');
  const isNewValid = await bcrypt.compare('admin123', newHash);
  console.log('bcrypt.compare("admin123", newHash):', isNewValid);
})();

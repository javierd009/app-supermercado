# 🔒 Implementar Bcrypt - Instrucciones

**✅ CÓDIGO IMPLEMENTADO** - Solo falta ejecutar migración de passwords existentes

**Estado actual:** Código listo, bcrypt configurado, falta migrar passwords legacy
**Estado objetivo:** Todos los passwords hasheados con bcrypt en producción

---

## Paso 1: Instalar Dependencias ✅ HECHO

```bash
npm install bcrypt
npm install --save-dev @types/bcrypt
```

**Status:** ✅ Agregado a package.json

---

## Paso 2: Actualizar authService.ts ✅ HECHO

### Archivo: `src/features/auth/services/authService.ts`

**Status:** ✅ Ya implementado

**Cambios realizados:**

```typescript
// AGREGAR al inicio del archivo:
import bcrypt from 'bcrypt';

// MODIFICAR método login():
async login(username: string, password: string): Promise<LoginResult> {
  try {
    const { data: user, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('username', username.toUpperCase())
      .single();

    if (error || !user) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // CAMBIAR DE:
    // if (password !== user.password_hash) {

    // A:
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return { success: false, error: 'Contraseña incorrecta' };
    }

    // ... resto del código igual
  }
}

// AGREGAR nuevo método para crear usuarios:
async createUser(
  username: string,
  password: string,
  role: 'super_admin' | 'admin' | 'cashier'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Hashear password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const { error } = await this.supabase
      .from('users')
      .insert({
        username: username.toUpperCase(),
        password_hash: passwordHash,
        role,
      });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Error al crear usuario',
    };
  }
}
```

---

## Paso 3: Migrar Passwords Existentes ⚠️ PENDIENTE

### Script: `scripts/migrate-passwords.js`

**Status:** ✅ Script creado, listo para ejecutar

Ejecutar UNA VEZ para hashear passwords existentes:

```javascript
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');

// Configurar Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function migratePasswords() {
  console.log('🔄 Iniciando migración de passwords...');

  // Obtener todos los usuarios
  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, password_hash');

  if (error) {
    console.error('❌ Error obteniendo usuarios:', error);
    return;
  }

  console.log(`📊 Encontrados ${users.length} usuarios`);

  for (const user of users) {
    // Solo hashear si NO está hasheado ya
    // Bcrypt hashes empiezan con "$2b$"
    if (user.password_hash.startsWith('$2b$')) {
      console.log(`✅ ${user.username} - Ya hasheado, skip`);
      continue;
    }

    // Hashear password actual
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(user.password_hash, saltRounds);

    // Actualizar en DB
    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', user.id);

    if (updateError) {
      console.error(`❌ Error actualizando ${user.username}:`, updateError);
    } else {
      console.log(`✅ ${user.username} - Password hasheado`);
    }
  }

  console.log('🎉 Migración completada');
}

migratePasswords();
```

**Ejecutar:**
```bash
# Cargar variables de entorno
export $(cat .env.local | xargs)

# Ejecutar migración
node scripts/migrate-passwords.js
```

---

## Paso 4: Crear UI para Gestión de Usuarios (Opcional)

### Componente: `src/features/users/components/CreateUserForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { authService } from '@/features/auth/services/authService';
import { Button } from '@/shared/components/Button';
import { Input } from '@/shared/components/Input';

export function CreateUserForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'cashier' | 'admin' | 'super_admin'>('cashier');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await authService.createUser(username, password, role);

    if (result.success) {
      alert('Usuario creado exitosamente');
      setUsername('');
      setPassword('');
    } else {
      alert(result.error || 'Error al crear usuario');
    }

    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Usuario"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="MARIA_01"
        required
      />

      <Input
        label="Contraseña"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Rol
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
        >
          <option value="cashier">Cajero</option>
          <option value="admin">Administrador</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      <Button type="submit" isLoading={isLoading}>
        Crear Usuario
      </Button>
    </form>
  );
}
```

---

## Paso 5: Verificación

### Test Manual:

1. **Ejecutar migración:**
   ```bash
   node scripts/migrate-passwords.js
   ```

2. **Verificar en Supabase:**
   - Ir a Table Editor → users
   - Columna `password_hash` debe mostrar: `$2b$10$...`

3. **Test login:**
   - Login como ADMIN/admin123
   - Debe funcionar igual que antes

4. **Test crear usuario:**
   - Crear nuevo usuario desde UI
   - Verificar que se guarda hasheado
   - Login con nuevo usuario

---

## Paso 6: Cleanup

### Eliminar código temporal:

1. **Remover comentarios TODO:**
   ```typescript
   // Buscar y eliminar:
   // TODO: Implementar bcrypt
   ```

2. **Actualizar NOTAS_IMPORTANTES.md:**
   Marcar como completado:
   ```markdown
   ### 2. Seguridad de Passwords
   ✅ **Implementado** - Bcrypt con salt rounds = 10
   ```

---

## Seguridad: Bcrypt Best Practices

### ✅ Hacer:
- Usar salt rounds = 10 (balance seguridad/performance)
- Hashear SIEMPRE antes de guardar
- NUNCA comparar passwords manualmente
- Usar `bcrypt.compare()` para validar

### ❌ NO Hacer:
- NO reducir salt rounds < 10
- NO guardar salt separadamente (bcrypt lo incluye)
- NO usar MD5 o SHA1
- NO loggear passwords hasheados

---

## Troubleshooting

### Error: "Cannot find module 'bcrypt'"

**Solución:**
```bash
npm install bcrypt
```

### Error: "bcrypt.compare is not a function"

**Causa:** Import incorrecto

**Solución:**
```typescript
// ❌ Incorrecto
import { compare } from 'bcrypt';

// ✅ Correcto
import bcrypt from 'bcrypt';
```

### Error en Windows: "node-gyp rebuild failed"

**Solución:**
```bash
# Instalar Windows Build Tools
npm install --global windows-build-tools

# Reinstalar bcrypt
npm uninstall bcrypt
npm install bcrypt
```

---

## Checklist de Implementación

Progreso actual:

- [x] bcrypt instalado (agregado a package.json)
- [x] @types/bcrypt instalado (agregado a package.json)
- [x] authService.ts actualizado con bcrypt.compare()
- [x] Método createUser() implementado con bcrypt.hash()
- [x] Script de migración creado (scripts/migrate-passwords.js)
- [x] NOTAS_IMPORTANTES.md actualizado

**Pendiente antes de producción:**

- [ ] Ejecutar `npm install` para instalar bcrypt
- [ ] Ejecutar script de migración (passwords hasheados)
- [ ] Verificado en Supabase (formato $2b$10$...)
- [ ] Test login OK con password hasheado
- [ ] Test crear usuario OK

---

## Próximos Pasos (Solo requiere ejecución)

### 1. Instalar dependencias:
```bash
npm install
```

### 2. Ejecutar migración:
```bash
export $(cat .env.local | xargs)
node scripts/migrate-passwords.js
```

### 3. Verificar en Supabase:
- Dashboard → Table Editor → users
- Columna `password_hash` debe empezar con `$2b$10$`

### 4. Test:
```bash
npm run dev:electron
# Login con usuario existente - debe funcionar igual
```

---

## Tiempo Restante

- Instalación: 2 minutos (solo `npm install`)
- Migración: 1 minuto (ejecutar script)
- Testing: 5 minutos

**Total:** ~8 minutos

---

**Status:** 🟡 CÓDIGO COMPLETO - Falta ejecución
**Prioridad:** CRÍTICA (ejecutar antes de producción)
**Progreso:** 80% (código listo, solo falta npm install + migration)

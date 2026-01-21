# 🔍 Diagnóstico: Login Offline No Funciona

## Problema
El login no funciona cuando no hay internet en la app Electron.

## Pasos de Diagnóstico

### 1. Cerrar COMPLETAMENTE la aplicación Electron
**IMPORTANTE**: Hot Reload NO siempre funciona para cambios en el proceso principal de Electron.

- Cerrar todas las ventanas de Electron
- Verificar que no queden procesos: `ps aux | grep electron`
- Si quedan procesos, matarlos: `killall electron` o `killall Electron`

### 2. Verificar que la base de datos existe

```bash
cd /Users/mac/Documents/mis-proyectos/sabrosita-v3
ls -lh sabrosita.db
```

**Si NO existe el archivo**:
- La app nunca se ha ejecutado correctamente
- Continuar al paso 3 para crear la DB

**Si SÍ existe**:
- Continuar al paso 3 para verificar su contenido

### 3. Ejecutar script de diagnóstico

```bash
node scripts/diagnose-db.js
```

Este script verificará:
- ✅ Si el archivo de DB existe
- ✅ Si la tabla `users` existe
- ✅ Cuántos usuarios hay en la DB
- ✅ Si el hash de la contraseña es válido
- ✅ Si la contraseña "1234" funciona

**Resultados posibles**:

#### ✅ TODO BIEN: "Usuario encontrado y contraseña válida"
```
✅ Base de datos abierta correctamente
✅ Tabla "users" existe
📊 Total de usuarios en la base de datos: 1

👥 Usuarios en la base de datos:

[1] Usuario:
    Username: ADMIN
    Role: admin
    Hash válido: ✅
    Contraseña "1234" coincide: ✅
```

**Acción**: El problema está en el código de login. Continuar al paso 5.

#### ❌ ERROR: "Archivo de DB no existe"
```
❌ ERROR: El archivo de base de datos NO existe
```

**Acción**: Ejecutar la app al menos una vez para crear la DB. Ir al paso 4.

#### ❌ ERROR: "No hay usuarios"
```
✅ Tabla "users" existe
📊 Total de usuarios en la base de datos: 0
❌ ERROR: No hay usuarios en la base de datos
```

**Acción**: La función `createTestUserIfNeeded()` no se ejecutó. Continuar al paso 4.

### 4. Iniciar Electron y verificar logs

Abrir **DOS TERMINALES**:

**Terminal 1** - Next.js Dev Server:
```bash
cd /Users/mac/Documents/mis-proyectos/sabrosita-v3
npm run dev
```

Esperar hasta ver:
```
✓ Ready in 2.5s
○ Local:        http://localhost:3000
```

**Terminal 2** - Electron:
```bash
cd /Users/mac/Documents/mis-proyectos/sabrosita-v3
ELECTRON_RUN_AS_NODE= npx electron .
```

**BUSCAR EN LOS LOGS** (Terminal 2):

```
═══════════════════════════════════════════════════
🔐 Verificando usuario de prueba...
═══════════════════════════════════════════════════
📊 Consultando usuarios existentes...
   Total usuarios en DB: 0

📝 No hay usuarios. Creando usuario de prueba...
   - Hasheando password "1234" con bcrypt...
   - Hash generado: $2b$10$...
   - Insertando en tabla users...
   - Rows insertados: 1

✅ Usuario de prueba creado y verificado:
   Username: ADMIN
   Password: 1234
   Role: admin
═══════════════════════════════════════════════════
```

**Si ves este mensaje**: El usuario se creó correctamente. Continuar al paso 5.

**Si NO ves este mensaje o hay un error**:
- Copiar el error completo
- Revisar si hay problemas con bcryptjs o better-sqlite3

### 5. Intentar login y revisar console del navegador

1. En la ventana de Electron, abrir **DevTools**: `View → Developer → Toggle Developer Tools`
2. Ir a la pestaña **Console**
3. Intentar hacer login con password `1234`
4. **Leer los logs en la consola** (no solo errores rojos, TODOS los logs)

**Buscar estos mensajes en orden**:

```
[AuthService] Iniciando login...
[DatabaseAdapter] getCurrentDatabase() - SQLite disponible: true Online: false
[DatabaseAdapter] ✅ Eligiendo SQLite (Electron disponible)
[DatabaseAdapter] query() usando: sqlite
[SQLiteClient] query() llamado
[SQLiteClient] isAvailable: true
[SQLiteClient] ✅ Ejecutando query via IPC: SELECT * FROM users
[SQLiteClient] Resultado IPC: { success: true, data: [...] }
[SQLiteClient] ✅ Query exitosa. Rows: 1
[AuthService] ✅ SQLite query exitosa. Usuarios encontrados: 1
[AuthService] Verificando contraseña para 1 usuarios...
```

**Si los logs se detienen antes de "Query exitosa"**:
- Hay un problema con IPC o SQLite
- Verificar que `window.electronAPI` existe: `console.log(window.electronAPI)`

**Si llega hasta "Verificando contraseña" pero falla**:
- El hash de bcrypt no coincide
- Ejecutar `node scripts/diagnose-db.js` para verificar el hash

### 6. Verificar que SQLite está disponible

En la consola de DevTools (Chrome DevTools dentro de Electron):

```javascript
console.log('window.electronAPI:', window.electronAPI)
console.log('isElectron:', window.electronAPI?.isElectron)
```

**Resultado esperado**:
```
window.electronAPI: {
  db: { query: f },
  printer: { print: f },
  scanner: { listen: f, onScan: f },
  window: { createNew: f },
  platform: "darwin",
  isElectron: true
}
isElectron: true
```

**Si `window.electronAPI` es `undefined`**:
- El preload script no se ejecutó correctamente
- Verificar electron/preload.js

**Si `isElectron` es `false` o `undefined`**:
- El preload no expuso el flag correctamente
- Verificar electron/preload.js línea 30

### 7. Test manual de query SQLite

En la consola de DevTools:

```javascript
await window.electronAPI.db.query('SELECT * FROM users')
```

**Resultado esperado**:
```javascript
{
  success: true,
  data: [
    {
      id: "uuid...",
      username: "ADMIN",
      password_hash: "$2b$10...",
      role: "admin",
      created_at: "2025-01-18T...",
      updated_at: "2025-01-18T..."
    }
  ]
}
```

**Si retorna error**:
- Copiar el mensaje de error completo
- Revisar electron/main.js IPC handler (línea 156)

## Checklist Rápido

- [ ] Cerré COMPLETAMENTE Electron (sin procesos corriendo)
- [ ] Ejecuté `node scripts/diagnose-db.js` y el usuario existe
- [ ] Inicié Next.js dev server (`npm run dev`)
- [ ] Inicié Electron (`ELECTRON_RUN_AS_NODE= npx electron .`)
- [ ] Vi los logs de creación de usuario en Terminal 2
- [ ] Abrí DevTools en Electron (View → Developer → Toggle Developer Tools)
- [ ] Verifiqué que `window.electronAPI.isElectron === true`
- [ ] Probé query manual: `await window.electronAPI.db.query('SELECT * FROM users')`
- [ ] Leí TODOS los logs en la consola al intentar login

## Información para Reportar

Si después de todos estos pasos sigue sin funcionar, **reportar**:

1. **Resultado de**: `node scripts/diagnose-db.js`
2. **Logs completos** de Terminal 2 (Electron) al iniciar
3. **Logs completos** de DevTools Console al hacer login
4. **Resultado de**: `console.log(window.electronAPI)` en DevTools
5. **Resultado de**: `await window.electronAPI.db.query('SELECT * FROM users')` en DevTools

---

**Última actualización**: 2025-01-18

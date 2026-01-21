# 🔄 Sincronización Inicial: Supabase → SQLite

**Problema**: La base de datos local SQLite está vacía (solo tiene usuario de prueba)
**Solución**: Script de sincronización inicial que descarga todos los datos de Supabase

---

## 📊 Estado Actual

### SQLite Local
```
✅ users: 1 registro (ADMIN - password: 1234)
❌ products: 0 registros o tabla no existe
❌ customers: 0 registros o tabla no existe
❌ config: 0 registros o tabla no existe
```

### Supabase (Producción)
```
✅ users: N registros (incluye "administrador")
✅ products: N registros (inventario completo)
✅ customers: N registros
✅ config: N registros
```

---

## 🎯 Objetivo

Al ejecutar la sincronización inicial:

1. **Descargar de Supabase**:
   - Todos los usuarios (incluido "administrador")
   - Todo el inventario (products)
   - Todos los clientes (customers)
   - Toda la configuración (config)

2. **Insertar en SQLite local**:
   - Sin duplicar (usar UPSERT / INSERT OR REPLACE)
   - Preservar IDs para consistencia
   - Manejar errores gracefully

3. **Resultado**:
   - Login con "administrador" funciona ✅
   - Inventario disponible offline ✅
   - Datos sincronizados ✅

---

## 🔧 Implementación

### Opción 1: Script Manual (Recomendado para Primera Vez)

Crear un script que:
- Se ejecuta manualmente cuando necesitas sincronizar
- Descarga todos los datos de Supabase
- Los inserta en SQLite

**Ventajas**:
- Control total sobre cuándo sincronizar
- Útil para debugging
- Fácil de ejecutar

**Archivo**: `scripts/sync-initial.js`

```javascript
const { app } = require('electron');
const Database = require('better-sqlite3');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

app.whenReady().then(async () => {
  const db = new Database('sabrosita.db');
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  console.log('🔄 Iniciando sincronización...');

  // 1. Sincronizar usuarios
  console.log('📥 Descargando usuarios...');
  const { data: users } = await supabase.from('users').select('*');

  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (id, username, password_hash, role, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  users.forEach(user => {
    insertUser.run(
      user.id,
      user.username,
      user.password_hash,
      user.role,
      user.created_at,
      user.updated_at
    );
  });
  console.log(`✅ ${users.length} usuarios sincronizados`);

  // 2. Sincronizar productos
  console.log('📥 Descargando productos...');
  const { data: products } = await supabase.from('products').select('*');

  const insertProduct = db.prepare(`
    INSERT OR REPLACE INTO products (
      id, name, description, price, cost, stock, barcode,
      category, image_url, active, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  products.forEach(product => {
    insertProduct.run(
      product.id,
      product.name,
      product.description,
      product.price,
      product.cost,
      product.stock,
      product.barcode,
      product.category,
      product.image_url,
      product.active,
      product.created_at,
      product.updated_at
    );
  });
  console.log(`✅ ${products.length} productos sincronizados`);

  // 3. Sincronizar clientes
  console.log('📥 Descargando clientes...');
  const { data: customers } = await supabase.from('customers').select('*');

  const insertCustomer = db.prepare(`
    INSERT OR REPLACE INTO customers (
      id, name, email, phone, address, created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  customers.forEach(customer => {
    insertCustomer.run(
      customer.id,
      customer.name,
      customer.email,
      customer.phone,
      customer.address,
      customer.created_at,
      customer.updated_at
    );
  });
  console.log(`✅ ${customers.length} clientes sincronizados`);

  console.log('');
  console.log('✅ Sincronización inicial completada');

  db.close();
  app.quit();
});
```

**Ejecutar**:
```bash
npm exec electron scripts/sync-initial.js
```

### Opción 2: Sincronización Automática al Inicio

Modificar `electron/main.js` para ejecutar sincronización automática si:
- La app detecta que SQLite tiene pocos/ningún dato
- O si han pasado X horas desde la última sincronización

**Ventajas**:
- Automático, no requiere intervención
- Los usuarios siempre tienen datos actualizados

**Desventajas**:
- Puede tardar en el primer inicio
- Requiere conexión a internet

### Opción 3: Botón en la UI

Agregar un botón "Sincronizar con Nube" en la configuración que:
- El usuario puede presionar cuando quiera
- Descarga todos los datos de Supabase
- Muestra progreso

**Ventajas**:
- Control del usuario
- Transparencia sobre qué está pasando

---

## 🚀 Recomendación Inmediata

Para resolver tu problema AHORA:

1. **Crear el script de sincronización inicial** (como en Opción 1)
2. **Ejecutarlo UNA VEZ** para poblar SQLite con todos los datos de Supabase
3. **Verificar** que ahora puedes hacer login con "administrador"
4. **Verificar** que el inventario está disponible

Después podemos implementar:
- Sincronización automática periódica
- Sincronización bidireccional en tiempo real
- UI para controlar la sincronización

---

## 📋 Checklist

Para implementar la sincronización inicial, necesitamos:

- [ ] Confirmar las tablas que existen en Supabase
- [ ] Confirmar el esquema de cada tabla (columnas)
- [ ] Crear el script de sincronización
- [ ] Ejecutar el script
- [ ] Verificar que los datos se sincronizaron
- [ ] Probar login con usuario de producción
- [ ] Verificar que el inventario está disponible

---

## 🔍 Siguiente Paso

¿Quieres que:

**A)** Cree el script de sincronización inicial ahora mismo para que lo ejecutes?
**B)** Primero verifiquemos qué tablas y datos tienes en Supabase?
**C)** Implementemos sincronización automática desde el inicio?

Dime qué prefieres y procedo.

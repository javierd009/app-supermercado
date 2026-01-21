# 🚀 Pre-Launch Checklist - Sabrosita POS Offline Mode

**Antes de ejecutar el sistema, verificar:**

---

## 1️⃣ Instalación de Dependencias

```bash
# Ejecutar en la raíz del proyecto
npm install
```

**Verificar que se instalen**:
- ✅ `better-sqlite3@^9.2.2` - Base de datos SQLite
- ✅ `uuid@^9.0.1` - Generación de IDs
- ✅ `@types/better-sqlite3@^7.6.9` - Tipos TypeScript

**Posibles errores**:
- Si falla `better-sqlite3`: Requiere Python y build tools
  - Windows: `npm install --global windows-build-tools`
  - Mac: Xcode Command Line Tools ya instalado
  - Linux: `sudo apt-get install build-essential`

---

## 2️⃣ Compilación

```bash
# Verificar que TypeScript compile sin errores
npm run typecheck

# Verificar que Next.js compile
npm run build
```

**Errores esperados**: Ninguno

**Si hay errores**:
- Verificar que `uuid` esté instalado
- Verificar imports en archivos modificados

---

## 3️⃣ Configuración de Supabase

### **Verificar Supabase Realtime**

1. Ir a Supabase Dashboard
2. Settings → Database → Replication
3. Verificar que estén habilitadas:
   - `products` - Enabled
   - `config` - Enabled
   - `customers` - Enabled

### **Verificar RLS (Row Level Security)**

```sql
-- En Supabase SQL Editor
-- Verificar que tablas tengan políticas RLS
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('products', 'config', 'sales', 'customers');
```

**Resultado esperado**: `rowsecurity = true` para todas

---

## 4️⃣ Datos Iniciales en Supabase

### **Config Table**

Verificar que exista:
```sql
SELECT * FROM config WHERE key = 'exchange_rate';
```

Si no existe, insertar:
```sql
INSERT INTO config (key, value, description)
VALUES ('exchange_rate', '540', 'Tipo de cambio del dólar (₡ por $1)')
ON CONFLICT (key) DO NOTHING;
```

### **Productos de Prueba**

Tener al menos 5 productos para testing:
```sql
SELECT COUNT(*) FROM products;
```

Si no hay, puedes usar estos:
```sql
INSERT INTO products (code, name, price, cost, stock, category, tax_rate)
VALUES
  ('001', 'Coca Cola 2L', 1500, 1000, 50, 'Bebidas', 13),
  ('002', 'Pan Bimbo', 1200, 800, 30, 'Panadería', 4),
  ('003', 'Arroz 1kg', 900, 600, 100, 'Granos', 1),
  ('004', 'Frijoles 1kg', 1100, 700, 80, 'Granos', 1),
  ('005', 'Leche 1L', 1300, 900, 40, 'Lácteos', 1)
ON CONFLICT (code) DO NOTHING;
```

---

## 5️⃣ Environment Variables

Verificar que existan en `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://sjtiqfdwgdepdhzejqlz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

**Ubicación**: Raíz del proyecto

---

## 6️⃣ Estructura de Archivos

Verificar que existan estos archivos críticos:

### **Database Layer**
```
src/lib/database/
  ├── adapter.ts ✅
  ├── connection-monitor.ts ✅
  ├── sqlite-client.ts ✅
  ├── realtime-sync.ts ✅
  ├── useDatabase.ts ✅
  ├── useRealtimeSync.ts ✅
  ├── RealtimeSyncProvider.tsx ✅
  └── index.ts ✅
```

### **Electron**
```
electron/
  ├── main.js ✅
  ├── preload.js ✅
  └── database/
      ├── init.js ✅
      └── schema.sql ✅
```

### **Services**
```
src/
  ├── shared/services/
  │   └── configService.ts ✅
  └── features/
      ├── products/services/productsService.ts ✅
      └── sales/services/salesService.ts ✅
```

### **UI**
```
src/
  ├── shared/components/
  │   └── ConnectionStatus.tsx ✅
  └── app/
      └── layout.tsx ✅ (debe incluir RealtimeSyncProvider)
```

---

## 7️⃣ Primera Ejecución

```bash
npm run dev:electron
```

### **Verificar en consola de Electron (Terminal)**:
```
Esperado:
📦 Inicializando base de datos en: /path/to/sabrosita.db
✅ Base de datos SQLite inicializada correctamente
📝 Aplicando esquema inicial...
✅ Esquema aplicado correctamente
✅ Base de datos SQLite inicializada
Sabrosita POS - Electron Main Process Started
```

### **Verificar en consola del navegador (F12)**:
```
Esperado:
Sabrosita POS - Preload script loaded
✅ [RealtimeSync] Inicializado - escuchando cambios en tiempo real
✅ Sincronizados X productos a SQLite local
```

### **Verificar en UI**:
- ✅ Indicador de conexión en esquina inferior derecha
- ✅ Color verde "Online"
- ✅ App carga sin errores

---

## 8️⃣ Verificación de SQLite Local

### **Ubicación del archivo**:
- **Desarrollo**: `./sabrosita.db` (raíz del proyecto)
- **Producción**: `%AppData%/sabrosita-pos/sabrosita.db` (Windows)

### **Herramienta**: DB Browser for SQLite
- Download: https://sqlitebrowser.org/

### **Verificar tablas**:
```sql
-- Debe retornar 8 tablas
SELECT name FROM sqlite_master WHERE type='table';

-- Resultado esperado:
-- users
-- customers
-- products
-- cash_registers
-- sales
-- sale_items
-- config
-- sync_queue
```

### **Verificar datos iniciales**:
```sql
-- Config debe tener exchange_rate
SELECT * FROM config;

-- Cliente genérico debe existir
SELECT * FROM customers WHERE id = '00000000-0000-0000-0000-000000000000';

-- Productos deben estar sincronizados
SELECT COUNT(*) FROM products;
```

---

## 9️⃣ Test Rápido (5 minutos)

### **Test 1: Offline Mode**
1. ✅ Desconectar WiFi
2. ✅ Indicador cambia a amarillo "Offline"
3. ✅ Agregar producto al carrito
4. ✅ Crear venta
5. ✅ Verificar "Pendientes: 1"
6. ✅ Reconectar WiFi
7. ✅ Verificar "Pendientes: 0"

### **Test 2: Realtime Sync**
1. ✅ Abrir Supabase
2. ✅ Cambiar precio de producto
3. ✅ Verificar actualización en POS (< 1 segundo)

---

## 🔟 Solución de Problemas Comunes

### **Problema: "Cannot find module 'better-sqlite3'"**
**Solución**:
```bash
npm install better-sqlite3 --save
```

### **Problema: "SQLite no disponible"**
**Causa**: No estás en Electron
**Solución**: Usar `npm run dev:electron` (no `npm run dev`)

### **Problema: "Database file is locked"**
**Solución**:
```bash
# Cerrar todas las instancias de la app
# Eliminar archivo de lock
rm sabrosita.db-shm
rm sabrosita.db-wal
```

### **Problema: Productos no actualizan en tiempo real**
**Verificar**:
1. Supabase Realtime habilitado
2. Consola muestra: "✅ [RealtimeSync] Inicializado"
3. No hay errores de autenticación

### **Problema: "Invalid hook call"**
**Causa**: RealtimeSyncProvider no está en layout.tsx
**Solución**: Verificar que `layout.tsx` incluya `<RealtimeSyncProvider>`

---

## ✅ Checklist Final

Antes de considerar listo para producción:

- [ ] Dependencias instaladas sin errores
- [ ] TypeScript compila sin errores
- [ ] Next.js compila sin errores
- [ ] SQLite se crea automáticamente
- [ ] Esquema se aplica correctamente
- [ ] Productos se sincronizan desde Supabase
- [ ] Indicador de conexión funciona
- [ ] Modo offline funciona 100%
- [ ] Ventas offline se sincronizan
- [ ] Realtime sync funciona (< 1 segundo)
- [ ] No hay errores en consola
- [ ] No hay memory leaks
- [ ] Cola de sincronización funciona
- [ ] Stock valida correctamente

---

## 🚀 ¡Listo para Ejecutar!

Si todos los puntos anteriores están ✅, ejecutar:

```bash
npm run dev:electron
```

Y seguir [TESTING-GUIDE.md](TESTING-GUIDE.md) para pruebas completas.

---

**Última Actualización**: 2026-01-18
**Versión**: 1.0.0
**Estado**: ✅ Implementación completa

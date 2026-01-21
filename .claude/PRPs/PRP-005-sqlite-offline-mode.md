# PRP-005: Sistema Offline con SQLite + Sincronización

## 📋 Resumen

Implementar base de datos local SQLite para que el POS funcione **100% sin internet**, con sincronización automática a Supabase cuando hay conectividad.

---

## 🎯 Objetivo

**Problema:** El sistema actual requiere internet constante porque toda la data está en Supabase (nube).

**Solución:** Base de datos local SQLite que se sincroniza con Supabase automáticamente.

**Resultado:** POS funciona 24/7 sin depender de internet.

---

## 📐 Arquitectura Propuesta

```
┌─────────────────────────────────────────────────────────────┐
│                    APLICACIÓN ELECTRON                      │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │              FRONTEND (Next.js + React)            │   │
│  │  - Componentes POS                                 │   │
│  │  - UI de gestión                                   │   │
│  └────────────────┬───────────────────────────────────┘   │
│                   │                                         │
│  ┌────────────────▼───────────────────────────────────┐   │
│  │           DATABASE ADAPTER (Abstracción)           │   │
│  │  - Interfaz unificada                              │   │
│  │  - Decide SQLite o Supabase según disponibilidad   │   │
│  └────────────────┬───────────────────────────────────┘   │
│                   │                                         │
│         ┌─────────┴─────────┐                              │
│         │                   │                              │
│  ┌──────▼──────┐    ┌──────▼──────┐                       │
│  │   SQLite    │    │  Supabase   │                       │
│  │   (Local)   │    │  Client     │                       │
│  └──────┬──────┘    └──────┬──────┘                       │
│         │                   │                              │
└─────────┼───────────────────┼──────────────────────────────┘
          │                   │
          │            ┌──────▼──────┐
          │            │  Supabase   │
          │            │   (Nube)    │
          │            └─────────────┘
          │                   ▲
          │                   │
          └───────────────────┘
           Servicio de Sincronización
           (cada 5 min o detecta conexión)
```

---

## 🔧 Implementación por Fases

### Fase 1: Configurar SQLite en Electron

**Archivos a crear/modificar:**
- `electron/database/init.js` - Inicializar SQLite
- `electron/preload.js` - Exponer API de base de datos
- `package.json` - Agregar `better-sqlite3`

**Resultado:** Electron puede crear y acceder a base de datos SQLite local.

---

### Fase 2: Crear Esquema de Base de Datos Local

**Archivos a crear:**
- `electron/database/schema.sql` - Estructura de tablas (igual a Supabase)
- `electron/database/migrations/` - Sistema de migraciones

**Tablas a crear:**
```sql
- products (id, code, name, category, price, cost, stock, min_stock, tax_rate)
- customers (id, name, phone, email, address)
- sales (id, cash_register_id, user_id, customer_id, total, payment_method, ...)
- sale_items (id, sale_id, product_id, quantity, unit_price, subtotal, ...)
- cash_registers (id, name, opening_balance, closing_balance, status, ...)
- users (id, username, role)
- config (key, value)
- sync_queue (id, operation, table, data, synced, created_at)
```

**Resultado:** Base de datos local con esquema completo.

---

### Fase 3: Implementar DatabaseAdapter

**Archivos a crear:**
- `src/lib/database/adapter.ts` - Abstracción SQLite/Supabase
- `src/lib/database/sqlite-client.ts` - Cliente SQLite
- `src/lib/database/connection-monitor.ts` - Detecta internet

**Funcionalidad:**
```typescript
interface DatabaseAdapter {
  // Métodos genéricos que funcionan con ambas DBs
  query(sql: string, params?: any[]): Promise<any[]>;
  insert(table: string, data: any): Promise<any>;
  update(table: string, id: string, data: any): Promise<any>;
  delete(table: string, id: string): Promise<any>;

  // Información de estado
  isOnline(): boolean;
  getConnectionStatus(): 'online' | 'offline';
}
```

**Lógica:**
- **Siempre intenta usar SQLite primero** (más rápido)
- Si hay operaciones críticas y hay internet, también escribe en Supabase
- Si no hay internet, guarda en `sync_queue` para sincronizar después

**Resultado:** Capa de abstracción lista para usar.

---

### Fase 4: Migrar Services a DatabaseAdapter

**Archivos a modificar:**
- `src/features/products/services/productsService.ts`
- `src/features/sales/services/salesService.ts`
- `src/features/customers/services/customersService.ts`
- `src/features/cash-register/services/cashRegisterService.ts`
- `src/features/auth/services/authService.ts`

**Cambios:**
```typescript
// ANTES:
import { createClient } from '@/lib/supabase/client';
const supabase = createClient();
const { data, error } = await supabase.from('products').select('*');

// DESPUÉS:
import { db } from '@/lib/database/adapter';
const products = await db.query('SELECT * FROM products');
```

**Resultado:** Todos los services usan DatabaseAdapter.

---

### Fase 5: Implementar Servicio de Sincronización

**Archivos a crear:**
- `electron/sync/sync-manager.js` - Orquestador de sincronización
- `electron/sync/realtime-listener.js` - **Escucha cambios en tiempo real**
- `electron/sync/sync-products.js` - Sincronizar productos
- `electron/sync/sync-sales.js` - Sincronizar ventas
- `electron/sync/sync-customers.js` - Sincronizar clientes
- `electron/sync/conflict-resolver.js` - Resolver conflictos
- `src/hooks/useRealtimeSync.ts` - Hook React para escuchar cambios

**Funcionamiento:**

**1. Sincronización en TIEMPO REAL (Desde Nube → Local):**
- **Supabase Realtime** escucha cambios en:
  - `products` (precios, nombres, stock)
  - `config` (tipo de cambio del dólar)
  - `categories` (categorías de productos)
- Cuando administrador cambia algo → **actualiza SQLite inmediatamente**
- Notifica a UI → **refresca pantalla automáticamente**
- **Latencia: <1 segundo**

**2. Sincronización de Ventas (Desde Local → Nube):**
- **Inmediatamente** al procesar venta (si hay internet)
- Si no hay internet: guarda en cola local
- Reintenta cada 30 segundos hasta que suba
- Marca como sincronizadas

**3. Sincronización Inicial (Al abrir app):**
- Descarga catálogo completo de productos
- Descarga configuración actual
- Descarga clientes (si aplica)
- Sube ventas pendientes (si hay)

**4. Manejo de Conflictos:**
- **Ventas:** Siempre gana la venta local (nunca se pierde)
- **Productos:** Gana el precio/stock de Supabase (fuente de verdad)
- **Config:** Gana el valor de Supabase (admin es fuente de verdad)
- **Clientes:** Última modificación gana

**5. Indicador Visual en Tiempo Real:**
- 🟢 **Online** - Conectado y sincronizando
- 🟡 **Sincronizando** - Subiendo ventas pendientes
- 🔴 **Offline** - Sin internet (modo local)
- 📊 Contador de ventas pendientes de sincronizar

**Ejemplo de Código (Tiempo Real):**

```typescript
// electron/sync/realtime-listener.js
const { createClient } = require('@supabase/supabase-js');

function startRealtimeSync() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  // Escuchar cambios en productos
  supabase
    .channel('products-changes')
    .on('postgres_changes', {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'products'
    }, (payload) => {
      console.log('Producto cambió en la nube:', payload);

      // Actualizar SQLite local inmediatamente
      updateLocalProduct(payload.new);

      // Notificar a la UI para refrescar
      sendToRenderer('product-updated', payload.new);
    })
    .subscribe();

  // Escuchar cambios en configuración (tipo de cambio)
  supabase
    .channel('config-changes')
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'config',
      filter: 'key=eq.exchange_rate'
    }, (payload) => {
      console.log('Tipo de cambio actualizado:', payload.new.value);

      updateLocalConfig('exchange_rate', payload.new.value);
      sendToRenderer('exchange-rate-updated', payload.new.value);
    })
    .subscribe();
}
```

**Resultado:** Sincronización en tiempo real funcionando.

---

### Fase 6: Probar y Validar

**Tests a realizar:**

1. **Modo Offline:**
   - ✅ Abrir caja sin internet
   - ✅ Realizar ventas sin internet
   - ✅ Imprimir tickets sin internet
   - ✅ Consultar productos sin internet

2. **Sincronización:**
   - ✅ Conectar internet → ventas suben automáticamente
   - ✅ Actualizar precios en Supabase → bajan a SQLite
   - ✅ Venta en local + precio cambió en nube → no hay conflicto

3. **Recuperación:**
   - ✅ Cerrar app con ventas pendientes → al abrir sincroniza
   - ✅ Perder conexión durante venta → venta se guarda local

**Resultado:** Sistema probado y validado.

---

## 📦 Dependencias Nuevas

```json
{
  "dependencies": {
    "better-sqlite3": "^9.2.2",  // SQLite para Electron (Node.js)
    "uuid": "^9.0.1"              // IDs únicos para sincronización
  }
}
```

---

## ⚠️ Consideraciones

### Ventajas
- ✅ **100% funcional sin internet**
- ✅ Respaldo automático en la nube
- ✅ Muy rápido (base de datos local)
- ✅ No pierde ventas nunca
- ✅ Múltiples cajas sincronizando a misma nube

### Desventajas
- ⚠️ Cambio arquitectónico grande (~2-3 días)
- ⚠️ Mayor complejidad en sincronización
- ⚠️ Requiere manejo de conflictos
- ⚠️ Archivo .exe será más grande (+20MB por SQLite)

### Riesgos
- 🔴 **Conflictos de sincronización** - Mitigado con reglas claras (venta local gana)
- 🟡 **Corrupción de DB local** - Mitigado con backups automáticos
- 🟡 **Sincronización lenta** - Mitigado con cola inteligente

---

## 🎯 Criterios de Éxito

- [ ] POS funciona completamente sin internet
- [ ] Ventas se sincronizan automáticamente al detectar conexión
- [ ] Precios/stock se actualizan desde la nube
- [ ] No se pierden ventas nunca
- [ ] Indicador visual de estado online/offline
- [ ] Performance igual o mejor que versión actual

---

## 📅 Estimación

- **Fase 1:** 2-3 horas (configurar SQLite)
- **Fase 2:** 2-3 horas (esquema de base de datos)
- **Fase 3:** 3-4 horas (DatabaseAdapter)
- **Fase 4:** 4-5 horas (migrar todos los services)
- **Fase 5:** 6-8 horas (sincronización + Realtime)
- **Fase 6:** 2-3 horas (testing exhaustivo)

**Total: 19-26 horas de trabajo (~2-3 días)**

### Escenario de Uso:

**Día 1 (Fases 1-3):**
- Configurar infraestructura SQLite
- Crear esquema de base de datos
- Implementar DatabaseAdapter
- **Resultado:** Base técnica lista

**Día 2 (Fase 4):**
- Migrar todos los services
- **Resultado:** App funcionando con SQLite

**Día 3 (Fases 5-6):**
- Implementar sincronización + Realtime
- Testing completo
- **Resultado:** Sistema offline completo

---

## ✅ Aprobación

¿Proceder con la implementación?

- [ ] Sí, implementar por fases
- [ ] Necesito más información
- [ ] Prefiero otra solución

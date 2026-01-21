# 🧪 Guía de Pruebas - Modo Offline

## ✅ Checklist Antes de Empezar

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Verificar que compile**:
   ```bash
   npm run build
   ```

3. **Ejecutar en modo desarrollo**:
   ```bash
   npm run dev:electron
   ```

---

## 🎯 Test 1: Funcionamiento Básico Offline

### **Objetivo**: Verificar que el POS funciona sin internet

### **Pasos**:
1. Ejecutar `npm run dev:electron`
2. Esperar a que cargue la app
3. **Desconectar WiFi/Ethernet**
4. Verificar indicador de conexión (esquina inferior derecha):
   - Debe cambiar de verde "Online" a amarillo "Offline"
5. Ir a POS y escanear/agregar productos
6. Crear una venta
7. Verificar en consola (F12):
   ```
   ✅ Venta guardada offline, se sincronizará al reconectar
   ```
8. Click en indicador de conexión
9. Verificar que aparece "Pendientes: 1" (o más)
10. **Reconectar WiFi/Ethernet**
11. Verificar que "Pendientes" baja a 0
12. Verificar en Supabase que la venta está guardada

### **Resultado Esperado**:
- ✅ POS funciona completamente sin internet
- ✅ Ventas se guardan en SQLite local
- ✅ Al reconectar, se sincronizan automáticamente

---

## 🔄 Test 2: Sincronización en Tiempo Real

### **Objetivo**: Verificar que cambios del admin aparecen inmediatamente en cajeros

### **Preparación**:
1. Abrir 2 ventanas del POS (o 2 computadoras)
2. Asegurarse de que ambas estén online (verde)

### **Caso A: Cambio de Precio**

**Pasos**:
1. En Supabase web, ir a tabla `products`
2. Cambiar precio de "Coca Cola 2L" de ₡1500 a ₡1600
3. Guardar
4. **Verificar en AMBAS ventanas del POS**:
   - Precio debe actualizarse automáticamente a ₡1600
   - Sin necesidad de refrescar (F5)
5. Verificar en consola:
   ```
   ✅ [RealtimeSync] Producto actualizado: Coca Cola 2L
   ```

**Resultado Esperado**:
- ✅ Cambio aparece en < 1 segundo
- ✅ Ambas ventanas se actualizan
- ✅ No requiere refresh manual

### **Caso B: Cambio de Tipo de Cambio**

**Pasos**:
1. En Supabase web, ir a tabla `config`
2. Cambiar `exchange_rate` de 540 a 550
3. Guardar
4. **Verificar en ambas ventanas del POS**:
   - Tipo de cambio debe actualizarse a ₡550
5. Crear una venta en dólares
6. Verificar que usa el nuevo tipo de cambio (₡550)

**Resultado Esperado**:
- ✅ Tipo de cambio se actualiza inmediatamente
- ✅ Próximas ventas usan nuevo tipo

### **Caso C: Nuevo Producto**

**Pasos**:
1. En Supabase web, insertar nuevo producto:
   ```sql
   INSERT INTO products (code, name, price, cost, stock)
   VALUES ('999', 'Producto Nuevo', 1000, 500, 100);
   ```
2. **Verificar en ambas ventanas del POS**:
   - Nuevo producto debe aparecer en lista
   - Debe poder escanearse código "999"

**Resultado Esperado**:
- ✅ Producto aparece sin refresh
- ✅ Se puede vender inmediatamente

---

## 📋 Test 3: Cola de Sincronización

### **Objetivo**: Verificar que operaciones offline se sincronizan correctamente

### **Pasos**:
1. Ejecutar `npm run dev:electron`
2. **Desconectar internet**
3. Crear 3 ventas diferentes
4. Click en indicador de conexión (esquina inferior derecha)
5. Expandir panel
6. Verificar "Pendientes: 3"
7. **Reconectar internet**
8. Esperar 5-10 segundos
9. Verificar que "Pendientes" baja a 0
10. Verificar que "Sincronizados" aumenta a 3
11. Ir a Supabase web, tabla `sales`
12. Verificar que las 3 ventas están guardadas

### **Resultado Esperado**:
- ✅ Cola muestra items pendientes
- ✅ Al reconectar, sincroniza automáticamente
- ✅ No hay duplicados en Supabase
- ✅ Todas las ventas tienen sus items (sale_items)

---

## 🛡️ Test 4: Manejo de Errores

### **Caso A: Error de Red Intermitente**

**Pasos**:
1. Estar online
2. Durante una venta, desconectar WiFi JUSTO antes de pagar
3. Completar pago
4. Verificar que venta se guarda en SQLite
5. Reconectar WiFi
6. Verificar que se sincroniza

**Resultado Esperado**:
- ✅ Venta NO se pierde
- ✅ Se guarda offline automáticamente
- ✅ Se sincroniza al reconectar

### **Caso B: Conflicto de Versiones**

**Pasos**:
1. Offline: Cambiar stock de producto manualmente en SQLite
2. Online (Supabase): Cambiar mismo stock del mismo producto
3. Reconectar
4. Verificar que NO hay conflictos graves
5. Verificar logs de errores

**Resultado Esperado**:
- ✅ No crashea la app
- ✅ Supabase gana (last write wins)
- ✅ Log muestra warning si hay conflicto

---

## 🔍 Test 5: Validaciones

### **Caso A: Stock Insuficiente (Online)**

**Pasos**:
1. Estar online
2. Producto con stock = 5
3. Intentar vender 10 unidades
4. Verificar error: "Stock insuficiente"

**Resultado Esperado**:
- ✅ No permite venta
- ✅ Muestra mensaje claro

### **Caso B: Stock Insuficiente (Offline)**

**Pasos**:
1. Desconectar internet
2. Producto con stock = 5
3. Intentar vender 10 unidades
4. Verificar error: "Stock insuficiente"

**Resultado Esperado**:
- ✅ Valida contra SQLite local
- ✅ No permite venta

---

## 📊 Test 6: Verificación de Datos

### **Esquema de Verificación**:

**SQLite Local** (debe tener):
- ✅ Productos sincronizados desde Supabase
- ✅ Config (exchange_rate, inventory_control_enabled)
- ✅ Ventas offline en `sales` table
- ✅ Items de ventas en `sale_items` table
- ✅ Cola de sincronización en `sync_queue`

**Supabase Cloud** (debe tener):
- ✅ Todas las ventas (online + sincronizadas)
- ✅ Todos los productos
- ✅ Config actualizada

### **Cómo Verificar SQLite**:

1. Buscar archivo `sabrosita.db`:
   - **Desarrollo**: Raíz del proyecto
   - **Producción**: `%AppData%/sabrosita-pos/sabrosita.db`

2. Abrir con DB Browser for SQLite

3. Ejecutar queries:
   ```sql
   -- Ver productos
   SELECT * FROM products;

   -- Ver ventas offline
   SELECT * FROM sales;

   -- Ver cola de sincronización
   SELECT * FROM sync_queue WHERE synced = 0;
   ```

---

## 🚨 Errores Comunes y Soluciones

### **Error: "SQLite no disponible"**
- **Causa**: No estás en Electron
- **Solución**: Ejecutar `npm run dev:electron` (no `npm run dev`)

### **Error: "Module not found: uuid"**
- **Causa**: Dependencias no instaladas
- **Solución**: `npm install`

### **Error: Productos no actualizan en tiempo real**
- **Causa**: Realtime no inicializado
- **Solución**: Verificar consola, debe decir:
  ```
  ✅ [RealtimeSync] Inicializado - escuchando cambios en tiempo real
  ```

### **Error: "Cannot read property 'query' of undefined"**
- **Causa**: SQLite no inicializado en Electron
- **Solución**: Verificar que `initDatabase()` se ejecuta en `main.js`

---

## 📝 Checklist Final

Antes de considerar completo:

- [ ] POS funciona 100% offline
- [ ] Ventas offline se sincronizan
- [ ] Productos actualizan en tiempo real
- [ ] Tipo de cambio actualiza en tiempo real
- [ ] Stock valida correctamente (online y offline)
- [ ] Cola de sincronización funciona
- [ ] No hay duplicados en Supabase
- [ ] Indicador de conexión es preciso
- [ ] No hay errores en consola
- [ ] SQLite contiene todos los datos necesarios

---

## 🎉 Criterios de Éxito

El sistema está **listo para producción** si:

1. ✅ **Resiliencia**: Puede trabajar 24/7 sin internet
2. ✅ **Tiempo Real**: Cambios del admin aparecen en < 1 segundo
3. ✅ **Consistencia**: No hay pérdida de datos
4. ✅ **UX**: Usuario sabe cuándo está offline
5. ✅ **Recovery**: Se recupera automáticamente al reconectar

---

**Estado Actual**: 🟡 Pendiente de testing
**Última Actualización**: 2026-01-18

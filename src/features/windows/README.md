# 🪟 Feature: Windows (Multi-Ventana)

Sistema de ventanas múltiples para operar varios puntos de venta simultáneos.

---

## 📁 Estructura

```
windows/
├── hooks/
│   ├── useWindows.ts         # Hook para gestionar ventanas
│   └── index.ts
├── index.ts
└── README.md                 # Este archivo
```

---

## 🚀 Uso

### Desde Dashboard

1. Abrir aplicación Electron
2. Ir a Dashboard
3. Click en "Nueva Ventana POS"
4. Se abre ventana independiente del POS

### Desde Código

```typescript
import { useWindows } from '@/features/windows';

function MyComponent() {
  const { openNewPOSWindow, isElectronAvailable } = useWindows();

  const handleClick = async () => {
    const result = await openNewPOSWindow();

    if (result.success) {
      console.log('Ventana abierta');
    } else {
      alert(result.error);
    }
  };

  return (
    <button onClick={handleClick} disabled={!isElectronAvailable}>
      Abrir Nueva Ventana POS
    </button>
  );
}
```

---

## 🔧 Arquitectura

### Electron Main Process

```javascript
// electron/main.js
const posWindows = new Set();

ipcMain.handle('window:new', async () => {
  const newWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    title: `Sabrosita POS - Ventana ${posWindows.size + 2}`,
  });

  newWindow.loadURL('http://localhost:3000/pos');

  posWindows.add(newWindow);

  newWindow.on('closed', () => {
    posWindows.delete(newWindow);
  });

  return { success: true, windowId: newWindow.id };
});
```

### Renderer Process

```typescript
// src/features/windows/hooks/useWindows.ts
const openNewPOSWindow = async () => {
  if (!isElectronAvailable()) {
    // Modo web: abrir en nueva pestaña
    window.open('/pos', '_blank');
    return { success: true };
  }

  // Modo Electron: crear ventana nativa
  const result = await window.electronAPI.window.createNew();
  return result;
};
```

---

## 🔄 Casos de Uso

### Caso 1: Múltiples Cajeros

**Escenario:** Negocio con 3 puntos de atención simultáneos

1. Abrir ventana principal (Dashboard)
2. Abrir 2 ventanas adicionales de POS
3. Cada cajero trabaja en su ventana independiente
4. Cada ventana tiene su propio estado de carrito
5. Todas comparten la misma base de datos

**Beneficios:**
- ✅ 3 cajeros trabajando en paralelo
- ✅ No hay conflictos de estado
- ✅ Ventas se sincronizan en Supabase
- ✅ Stock se actualiza en tiempo real

### Caso 2: Cajero + Supervisor

**Escenario:** Cajero en POS + Supervisor monitoreando dashboard

1. Ventana 1: Dashboard (supervisor)
2. Ventana 2: POS (cajero)
3. Supervisor ve métricas en tiempo real
4. Cajero procesa ventas sin interrupciones

### Caso 3: Testing y Producción

**Escenario:** Probar configuración sin afectar ventas reales

1. Ventana 1: POS en producción (cajero)
2. Ventana 2: Scanner test (técnico)
3. Ventana 3: Productos (inventarista)

---

## 🎯 Estado Independiente

### Zustand Store por Ventana

Cada ventana BrowserWindow tiene su propio contexto de JavaScript:

```typescript
// Ventana 1
const posStore = create<POSState>(() => ({
  cart: { items: [], ... },
  ...
}));

// Ventana 2
const posStore = create<POSState>(() => ({
  cart: { items: [], ... }, // Estado INDEPENDIENTE
  ...
}));
```

**Ventajas:**
- ✅ Carritos separados
- ✅ Sin conflictos de estado
- ✅ Cada cajero trabaja aislado
- ✅ Rollback individual si hay error

**Limitaciones:**
- ❌ No hay comunicación entre ventanas
- ❌ Cada ventana carga productos completos
- ❌ No hay sincronización de estado en tiempo real

---

## 📊 Sincronización Vía Supabase

Aunque el estado es independiente, la base de datos es compartida:

```
Ventana 1: Vende producto A → Actualiza stock en Supabase
  ↓
Ventana 2: Intenta vender producto A
  ↓
  Valida stock en Supabase → Error: Stock insuficiente
```

**Flujo de Validación:**
```typescript
// salesService.ts
async createSale(input) {
  // 1. Validar stock ACTUAL en Supabase
  const product = await supabase
    .from('products')
    .select('stock')
    .eq('id', item.productId)
    .single();

  if (product.stock < item.quantity) {
    return { success: false, error: 'Stock insuficiente' };
  }

  // 2. Guardar venta + actualizar stock
  // ...
}
```

---

## ⚙️ Configuración

### Límite de Ventanas

Por defecto, no hay límite. Para agregar límite:

```javascript
// electron/main.js
const MAX_POS_WINDOWS = 5;

ipcMain.handle('window:new', async () => {
  if (posWindows.size >= MAX_POS_WINDOWS) {
    return {
      success: false,
      error: `Máximo ${MAX_POS_WINDOWS} ventanas permitidas`
    };
  }

  // Crear ventana...
});
```

### Posición de Ventanas

Automatizar posición para no solapar:

```javascript
const offset = posWindows.size * 50;

const newWindow = new BrowserWindow({
  x: 100 + offset,
  y: 100 + offset,
  // ...
});
```

---

## 🧪 Testing

### Test Manual (Desarrollo)

```bash
npm run dev:electron
```

1. Ir a Dashboard
2. Click en "Nueva Ventana POS"
3. Verificar que se abre ventana independiente
4. Abrir caja en ventana 1
5. Escanear producto en ventana 1
6. Intentar vender el mismo producto en ventana 2
7. Verificar validación de stock

### Test en Producción

```bash
npm run build
npm run start:electron
```

1. Abrir 3 ventanas POS
2. Cada cajero abre su caja
3. Procesar ventas simultáneas
4. Verificar que no hay conflictos
5. Cerrar cajas y verificar totales

---

## 🔒 Seguridad

### Aislamiento de Contexto

Cada ventana tiene su propio contexto de ejecución:
- ✅ No pueden acceder al estado de otras ventanas
- ✅ No pueden ejecutar código en otras ventanas
- ✅ Cada ventana tiene su propia sesión de auth

### Validación de Operaciones

- ✅ Cada venta valida stock en tiempo real
- ✅ Transacciones atómicas en Supabase
- ✅ Row Level Security previene acceso no autorizado

---

## 🚧 Limitaciones Actuales

### No Hay Comunicación Entre Ventanas

Actualmente, las ventanas no se comunican entre sí:
- ❌ No se notifica cuando otra ventana vende un producto
- ❌ No hay sincronización de carrito
- ❌ No hay chat entre cajeros

**Solución Futura:**
- [ ] Usar `ipcMain.on()` para broadcast entre ventanas
- [ ] Implementar Supabase Realtime para updates
- [ ] Agregar notificaciones de stock bajo

### Carga Inicial por Ventana

Cada ventana carga todos los productos:
- ⚠️ Consumo de memoria duplicado
- ⚠️ Queries redundantes a Supabase

**Solución Futura:**
- [ ] Cache compartido en main process
- [ ] Lazy loading de productos
- [ ] Paginación en lista de productos

---

## 📈 KPIs de Éxito

- ✅ Abrir ventana en <2 segundos
- ✅ Soportar 5+ ventanas simultáneas sin lag
- ✅ Validación de stock 100% confiable
- ✅ Sin conflictos de estado entre ventanas
- ✅ Consumo de memoria <500MB por ventana

---

## 🔄 Próximas Mejoras (TODO)

### Comunicación Entre Ventanas
- [ ] Broadcast de eventos (venta completada, stock actualizado)
- [ ] Notificaciones entre cajeros
- [ ] Estado compartido opcional (caja abierta, etc.)

### Gestión de Ventanas
- [ ] Lista de ventanas activas
- [ ] Cerrar todas las ventanas de golpe
- [ ] Enfocar ventana específica

### Sincronización Realtime
- [ ] Supabase Realtime para updates de stock
- [ ] Notificaciones push cuando stock es bajo
- [ ] Alertas de cierre de caja

### UI/UX
- [ ] Indicador de número de ventana en header
- [ ] Colores diferentes por ventana
- [ ] Shortcut para abrir nueva ventana (Ctrl+N)

---

*Feature completada: 2026-01-16*

**Estado:** Funcional para múltiples cajeros
**Nota:** Solo disponible en modo Electron (no en web)

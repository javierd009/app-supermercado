# 📋 BUSINESS_LOGIC.md - Sabrosita POS

> Generado por SaaS Factory | Fecha: 2026-01-16

## 1. Problema de Negocio

**Dolor:**
Las pulperías en Costa Rica que usan Mónica 8.5 (software legacy muy popular por su simplicidad) enfrentan un problema crítico: Windows 11 bloquea y cierra el programa constantemente debido a incompatibilidades. Esto obliga a los cajeros a anotar ventas a mano, perdiendo tiempo valioso en un negocio de alto flujo (sector turístico) y generando riesgo de errores en cobro, cambio e inventario.

**Costo actual:**
- **Tiempo:** Segundos adicionales por cada venta anotada a mano x cientos de clientes diarios
- **Operacional:** Negocio 24/7 que no puede depender de un sistema que se cae constantemente
- **Riesgo:** Errores manuales en cobro, pérdida de control de inventario, imposibilidad de reportes precisos
- **Urgencia:** ALTA - Cliente necesita solución inmediata

---

## 2. Solución

**Propuesta de valor:**
"Un sistema POS (punto de venta) moderno compatible con Windows 11, que replica la simplicidad de Mónica 8.5, con soporte offline para pulperías en Costa Rica"

**Diferenciadores clave vs Mónica 8.5:**
1. ✅ Funciona en Windows 11 sin crashes
2. ✅ Multi-ventana de facturación (atender varios clientes simultáneamente)
3. ✅ Sincronización híbrida offline-first + cloud backup
4. ✅ Dashboard PWA para administrador (móvil)
5. ✅ Control de caja por operador/turno
6. ✅ Sistema de roles (Super Admin, Admin, Cajero)
7. ✅ Importación directa desde CSV de Mónica 8.5

---

## 3. Flujo Principal (Happy Path)

### 🎯 Venta Típica (Operador Cajero)
1. **Cajero inicia sesión** con código alfanumérico → Sistema asocia venta a operador y caja abierta
2. **Cliente llega con productos** → Cajero enfoca cursor en línea de productos (auto-focus)
3. **Escanea código de barras** → Sistema busca producto en BD local, agrega a lista, cursor pasa automáticamente a siguiente línea
4. **Repite escaneo** → Cada producto se suma, total se actualiza en tiempo real
5. **Si producto sin código** → Busca por nombre o código manual, selecciona, agrega
6. **Presiona F10** → Modal emergente muestra total, solicita monto recibido
7. **Ingresa monto** → Sistema calcula cambio automáticamente
8. **Selecciona método de pago** → Efectivo / Tarjeta / Sinpe
9. **Presiona ENTER** → Ticket se imprime en impresora térmica, venta se guarda localmente
10. **Sistema actualiza inventario** → Stock se reduce automáticamente, sincroniza a cloud si hay internet

---

### 🔄 Flujos Secundarios

#### A) Multi-Ventana de Facturación
- **Escenario:** Cajero está atendiendo cliente A, este se va a buscar algo más
- **Acción:** Cajero abre nueva ventana (shortcut o botón), atiende cliente B sin perder venta de A
- **Resultado:** Puede alternar entre ventanas, finalizar cualquiera en orden no secuencial

#### B) Producto sin Código de Barras
- **Búsqueda por nombre:** Dropdown con autocompletado (comienza a escribir)
- **Búsqueda por código manual:** Campo para ingresar código único asignado internamente
- **Resultado:** Producto se agrega igual que con escaneo

#### C) Apertura de Caja (Inicio de Turno)
1. Operador ingresa código alfanumérico
2. Sistema valida usuario y rol
3. Operador ingresa monto inicial de caja
4. Sistema registra: `{usuario, fecha/hora inicio, monto_inicial}`
5. Habilita interfaz de facturación

#### D) Cierre de Caja (Fin de Turno)
1. Operador (o Admin con contraseña) presiona "Cerrar Caja"
2. Sistema muestra:
   - Monto inicial
   - Total ventas efectivo
   - Total ventas tarjeta
   - Total esperado
   - Campo para ingresar monto real contado
3. Sistema calcula diferencia (faltante/sobrante)
4. Genera reporte imprimible de cierre
5. Cierra sesión del operador

#### E) Modo Offline (Sin Internet)
- **Ventas se guardan 100% localmente** (base de datos local SQLite/IndexedDB)
- **Cuando vuelve internet:** Proceso de sincronización automático en background
- **Prevención de duplicados:** UUID por venta + timestamp + validación server-side
- **Conflictos:** Sistema prioriza dato local (venta ya realizada no se puede deshacer)

#### F) Gestión de Productos (Administrador)
- **Crear producto:** Desde interfaz desktop o PWA móvil
- **Actualizar precio:** Cambio se refleja en tiempo real en todas las cajas activas
- **Importar CSV:** Desde exportación de Mónica 8.5, mapeo automático de columnas
- **Control de stock:** Alertas cuando producto baja de X unidades

---

## 4. Usuario Objetivo

### 👤 Perfil 1: Cajero/Operador
**Rol:** Personal de atención al cliente en punto de venta
**Contexto:**
- Edad: Jóvenes (incluso estudiantes de bachillerato)
- Nivel técnico: Bajo-medio, pero familiarizados con tecnología moderna
- Preferencia: **Keyboard-first** (atajos de teclado), velocidad sobre features complejas
- Frustraciones: Sistemas con muchos botones, procesos lentos, crashes
- Necesidades:
  - Interfaz ultra-simple (como Mónica 8.5)
  - Flujo de venta en <10 segundos
  - No tener que pensar, solo escanear y cobrar

**Permisos:**
- ✅ Registrar ventas
- ✅ Buscar productos
- ✅ Abrir ventanas de facturación
- ❌ Cerrar caja (necesita admin)
- ❌ Modificar productos
- ❌ Ver reportes completos

---

### 👤 Perfil 2: Administrador
**Rol:** Encargado/Supervisor con acceso a funciones avanzadas
**Contexto:**
- Puede ser el dueño o un empleado de confianza
- Necesita hacer cierres de caja, resolver problemas, ajustar precios
- Usa la misma interfaz que cajero, pero con funciones desbloqueadas

**Permisos:**
- ✅ Todo lo del cajero
- ✅ Cerrar caja (con su contraseña)
- ✅ Ver reportes de operadores
- ✅ Modificar productos/precios
- ✅ Gestionar inventario
- ✅ Configurar impresora/datos de ticket
- ❌ Crear usuarios (solo Super Admin)

---

### 👤 Perfil 3: Super Administrador (Dueño)
**Rol:** Propietario del negocio, acceso total
**Contexto:**
- Revisa el negocio desde el celular (PWA)
- Quiere ver ventas en tiempo real sin estar presente
- Define quién puede ser admin y quién cajero

**Permisos:**
- ✅ Todo lo del admin
- ✅ Crear/editar usuarios y roles
- ✅ Dashboard PWA móvil
- ✅ Exportar reportes a PDF/Excel/Email
- ✅ Configuración global del sistema

**Dashboard PWA (exclusivo Super Admin):**
- Ventas del día (en tiempo real)
- Ventas por operador
- Top 10 productos más vendidos
- Alertas de stock bajo
- Gráficos de tendencia semanal/mensual
- Acceso desde cualquier dispositivo móvil

---

## 5. Arquitectura de Datos

### 📥 INPUT

#### 1. Importación Inicial (Migración desde Mónica 8.5)
**Formato:** CSV exportado desde Mónica 8.5
**Campos esperados:**
- Código (código de barras o código interno)
- Nombre del producto
- Cantidad (stock actual)
- Costo (precio de compra)
- Precio (precio de venta)
- *(Categoría - si existe)*

**Proceso:**
1. Usuario carga archivo CSV
2. Sistema mapea columnas automáticamente
3. Preview de datos a importar
4. Confirmación → inserción en BD local + sincronización cloud
5. Productos antiguos/no usados pueden limpiarse manualmente después

---

#### 2. Durante Operación Diaria
- **Productos escaneados:** Código de barras leído por scanner USB
- **Productos sin código:** Búsqueda por nombre (autocompletado) o código manual
- **Monto recibido:** Input numérico del cajero
- **Método de pago:** Selección: Efectivo / Tarjeta / Sinpe
- **Monto inicial de caja:** Al abrir turno
- **Monto real en cierre:** Al cerrar turno

---

#### 3. Gestión (Administrador)
- **Nuevos productos:** Formulario con campos obligatorios
- **Actualización de precios:** Edición inline o masiva
- **Ajustes de stock:** Manual (conteo físico) o automático (por ventas)
- **Configuración de ticket:** Logo (upload), nombre negocio, teléfonos, dirección

---

### 📤 OUTPUT

#### 1. Ticket Impreso (Impresoras Térmicas Genéricas)
**Formato:** Texto plano compatible con ESC/POS (estándar impresoras térmicas)
**Compatibilidad:** Epson TM-T20, TM-T88, Star Micronics, Bixolon, etc.

**Contenido del ticket:**
```
[LOGO o NOMBRE NEGOCIO]
Pulpería Sabrosita
Tel: 2222-3333 / 8888-9999
Dirección: Av. Central, San José

================================
TICKET #00542
================================
Fecha: 16/01/2026 14:32:15
Cajero: MARIA_01

Coca Cola 500ml      ₡800.00
Galletas Pozuelo     ₡1,200.00
Agua Cristal 1L      ₡600.00
Pan Bimbo Blanco     ₡1,500.00
--------------------------------
SUBTOTAL:           ₡4,100.00
--------------------------------
Método: EFECTIVO
Recibido:           ₡5,000.00
CAMBIO:               ₡900.00

¡Gracias por su compra!
================================
```

**Configuración:**
- Datos del negocio configurables desde panel admin
- Logo opcional (imagen convertida a ASCII o bitmap ESC/POS)
- Tamaño de papel: 80mm o 58mm (auto-detectado por driver)

---

#### 2. Reporte de Cierre de Caja
**Formatos:** Impreso (ticket) + Pantalla + Exportable (PDF)

**Contenido:**
```
================================
   CIERRE DE CAJA
================================
Turno: MAÑANA
Operador: MARIA_01
Fecha: 16/01/2026
Hora inicio: 08:00:00
Hora cierre: 16:00:15
--------------------------------
Monto inicial:      ₡20,000.00
--------------------------------
VENTAS:
  Efectivo (45):     ₡85,300.00
  Tarjeta (12):      ₡32,400.00
  Sinpe (3):         ₡8,500.00
--------------------------------
TOTAL VENTAS:      ₡126,200.00
ESPERADO EN CAJA:  ₡105,300.00
  (inicial + efectivo)
--------------------------------
Conteo real:       ₡105,500.00
DIFERENCIA:           ₡+200.00
--------------------------------
Firma operador: _______________
Firma supervisor: _____________
================================
```

---

#### 3. Reportes para Administrador
**Accesibles desde:** Desktop (interfaz admin) + PWA (móvil)

**A) Reporte Diario de Ventas:**
- Total vendido (por método de pago)
- Cantidad de transacciones
- Ticket promedio
- Ventas por operador
- Ventas por hora (gráfico de barras)

**B) Reporte de Productos Más Vendidos:**
- Top 20 productos del día/semana/mes
- Unidades vendidas
- Ingresos generados por producto

**C) Reporte de Inventario:**
- Productos con stock bajo (<10 unidades, configurable)
- Valor total del inventario
- Productos sin movimiento en X días

**D) Reporte por Operador:**
- Ventas totales por cajero
- Cantidad de transacciones
- Diferencias en cierres de caja (faltantes/sobrantes históricos)

**Opciones de exportación:**
- Ver en pantalla
- Descargar PDF
- Descargar Excel
- Enviar por email (configurar SMTP)

---

#### 4. Dashboard PWA (Super Admin - Móvil)
**Métricas en tiempo real:**
- **Ventas del día:** Gráfico con meta diaria
- **Ventas por operador:** Tabla comparativa
- **Top 5 productos del día:** Lista con cantidades
- **Alertas:** Stock bajo, cajas sin cerrar, diferencias significativas
- **Última sincronización:** Timestamp de sync offline→cloud

**Tecnología:** Progressive Web App (instalable en celular, funciona sin internet)

---

### 🗄️ Storage (Supabase Tables Sugeridas)

#### Tabla: `products`
```sql
id            UUID PRIMARY KEY
code          TEXT UNIQUE NOT NULL  -- código de barras o código interno
name          TEXT NOT NULL
category      TEXT
cost          DECIMAL(10,2)
price         DECIMAL(10,2) NOT NULL
stock         INTEGER DEFAULT 0
min_stock     INTEGER DEFAULT 10    -- para alertas
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

#### Tabla: `users`
```sql
id            UUID PRIMARY KEY
username      TEXT UNIQUE NOT NULL  -- código alfanumérico (ej: MARIA_01)
password_hash TEXT NOT NULL
role          TEXT NOT NULL         -- 'super_admin' | 'admin' | 'cashier'
created_at    TIMESTAMP
```

#### Tabla: `cash_registers` (Cajas/Turnos)
```sql
id              UUID PRIMARY KEY
user_id         UUID REFERENCES users(id)
opened_at       TIMESTAMP NOT NULL
closed_at       TIMESTAMP
initial_amount  DECIMAL(10,2) NOT NULL
final_amount    DECIMAL(10,2)
expected_amount DECIMAL(10,2)
difference      DECIMAL(10,2)
notes           TEXT
status          TEXT              -- 'open' | 'closed'
```

#### Tabla: `sales`
```sql
id                UUID PRIMARY KEY
cash_register_id  UUID REFERENCES cash_registers(id)
user_id           UUID REFERENCES users(id)
total             DECIMAL(10,2) NOT NULL
payment_method    TEXT NOT NULL  -- 'cash' | 'card' | 'sinpe'
amount_received   DECIMAL(10,2)
change_given      DECIMAL(10,2)
created_at        TIMESTAMP
synced_at         TIMESTAMP      -- NULL si solo está en local
```

#### Tabla: `sale_items`
```sql
id          UUID PRIMARY KEY
sale_id     UUID REFERENCES sales(id) ON DELETE CASCADE
product_id  UUID REFERENCES products(id)
quantity    INTEGER NOT NULL
unit_price  DECIMAL(10,2) NOT NULL
subtotal    DECIMAL(10,2) NOT NULL
```

#### Tabla: `sync_queue` (Para modo offline)
```sql
id          UUID PRIMARY KEY
entity_type TEXT NOT NULL      -- 'sale' | 'product' | 'stock_adjustment'
entity_id   UUID NOT NULL
action      TEXT NOT NULL      -- 'insert' | 'update' | 'delete'
data        JSONB NOT NULL     -- payload completo
created_at  TIMESTAMP
synced_at   TIMESTAMP
status      TEXT               -- 'pending' | 'synced' | 'error'
```

#### Tabla: `config`
```sql
id     UUID PRIMARY KEY
key    TEXT UNIQUE NOT NULL  -- ej: 'business_name', 'logo_url', 'receipt_footer'
value  TEXT
```

---

## 6. KPI de Éxito (Primera Versión)

### ✅ Funcionalidad Crítica
- [ ] **Importar 1,500+ productos desde CSV de Mónica 8.5 en <2 minutos**
- [ ] **Procesar venta completa (escanear 10 productos + cobrar + imprimir) en <15 segundos**
- [ ] **Imprimir tickets correctamente en impresoras térmicas genéricas** (Epson TM-T20 como prueba inicial)
- [ ] **Multi-ventana de facturación funcional** (mínimo 3 ventanas simultáneas sin lag)

### ✅ Estabilidad
- [ ] **Funcionar 24/7 durante 7 días seguidos en Windows 11 sin crashes**
- [ ] **Soportar modo offline durante 24 horas sin pérdida de datos**
- [ ] **Sincronizar ventas offline cuando vuelve internet sin duplicados ni errores**

### ✅ Velocidad
- [ ] **Búsqueda de producto por nombre: resultados en <200ms**
- [ ] **Apertura/cierre de caja: <5 segundos**
- [ ] **Carga inicial del sistema: <3 segundos en hardware básico**

### ✅ Volumen
- [ ] **Manejar base de datos de 2,000 productos sin lentitud**
- [ ] **Procesar 500 ventas en un día sin degradación de performance**

### ✅ Adopción
- [ ] **Cajero actual puede usarlo sin entrenamiento previo** (interfaz intuitiva como Mónica)
- [ ] **Flujo keyboard-first funcional** (F10, ENTER, atajos de teclado críticos)
- [ ] **Dashboard PWA instalable en celular Android/iOS**

---

## 7. Especificación Técnica (Para el Agente)

### 🏗️ Features a Implementar (Feature-First)

```
src/features/
├── auth/
│   ├── components/       # LoginForm (código alfanumérico)
│   ├── hooks/            # useAuth, useRole
│   ├── services/         # authService.ts (Supabase Auth)
│   ├── types/            # User, Role
│   └── store/            # authStore.ts (Zustand)
│
├── products/
│   ├── components/       # ProductList, ProductForm, ImportCSV, SearchBar
│   ├── hooks/            # useProducts, useProductSearch
│   ├── services/         # productService.ts, csvImporter.ts
│   ├── types/            # Product, Category
│   └── store/            # productsStore.ts
│
├── pos/ (Point of Sale)
│   ├── components/       # POSWindow, ProductLine, PaymentModal, MultiWindowManager
│   ├── hooks/            # usePOS, useScanner, useKeyboardShortcuts
│   ├── services/         # scannerService.ts, posService.ts
│   ├── types/            # SaleItem, Cart
│   └── store/            # posStore.ts (multi-ventana)
│
├── cash-register/
│   ├── components/       # OpenRegister, CloseRegister, RegisterStatus
│   ├── hooks/            # useCashRegister
│   ├── services/         # registerService.ts
│   ├── types/            # CashRegister, RegisterTransaction
│   └── store/            # registerStore.ts
│
├── sales/
│   ├── components/       # PaymentSelector, ChangeCalculator
│   ├── hooks/            # useSales
│   ├── services/         # salesService.ts
│   └── types/            # Sale, PaymentMethod
│
├── printing/
│   ├── services/         # thermalPrinter.ts (ESC/POS protocol)
│   ├── templates/        # receiptTemplate.ts, closureTemplate.ts
│   └── types/            # PrinterConfig, ReceiptData
│
├── reports/
│   ├── components/       # DailySalesReport, InventoryReport, OperatorReport
│   ├── hooks/            # useReports
│   ├── services/         # reportService.ts, exportService.ts
│   └── types/            # Report, ReportFilter
│
├── dashboard/
│   ├── components/       # DashboardPWA, SalesChart, TopProductsWidget, AlertsPanel
│   ├── hooks/            # useDashboard, useRealTimeSync
│   ├── services/         # dashboardService.ts
│   └── types/            # DashboardMetrics
│
└── sync/
    ├── services/         # syncService.ts, offlineQueue.ts
    ├── hooks/            # useSync, useOnlineStatus
    └── types/            # SyncStatus, QueueItem
```

---

### 🎨 Stack Confirmado (Golden Path)

| Capa | Tecnología | Justificación |
|------|------------|---------------|
| **Framework** | Next.js 16 + React 19 + TypeScript | App Router, Server Actions, Turbopack, type-safety |
| **Estilos** | Tailwind CSS 3.4 + shadcn/ui | Utility-first, componentes pre-built, accesibles |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime) | Auth simple, RLS, subscriptions en tiempo real para dashboard |
| **Validación** | Zod | Schemas type-safe, validación de CSV import |
| **Estado Global** | Zustand | Ligero, perfect para POS multi-ventana |
| **Offline Storage** | IndexedDB (Dexie.js) | Persistencia local robusta, sync con Supabase |
| **Printing** | node-thermal-printer (Electron) o Web USB API | Comunicación con impresoras térmicas ESC/POS |
| **PWA** | Next.js PWA plugin | Dashboard instalable en móvil |
| **Deployment** | Electron (desktop) + Vercel (PWA dashboard) | App local para POS, web para admin móvil |

---

### 🔌 MCPs a Utilizar

#### 1. Supabase MCP
```bash
# Configuración inicial de tablas
apply_migration → Crear tablas products, users, sales, etc.
execute_sql → Queries para reportes, búsquedas
get_advisors → Validar RLS en tablas críticas
```

#### 2. Next.js DevTools MCP
```bash
init → Contexto del proyecto
nextjs_call → Monitorear errores build/runtime
```

#### 3. Playwright MCP (Testing)
```bash
playwright_navigate → Probar flujo de venta E2E
playwright_screenshot → Validar UI de tickets
playwright_click/fill → Simular escaneo y cobro
```

---

### 🧪 Estrategia de Testing

#### Unit Tests (Vitest)
- Lógica de cálculo de cambio
- Validaciones de Zod (import CSV)
- Funciones de sincronización offline

#### Integration Tests
- Flujo completo de venta (mock de scanner)
- Apertura/cierre de caja
- Sincronización offline→online

#### E2E Tests (Playwright MCP)
- Venta multi-producto con impresión
- Multi-ventana de facturación
- Dashboard PWA en móvil (responsive)

---

### 🔐 Consideraciones de Seguridad

1. **Auth:**
   - Contraseñas hasheadas (bcrypt)
   - Códigos alfanuméricos únicos por usuario
   - Sesiones con timeout (auto-logout después de X horas sin actividad)

2. **RLS (Row Level Security) en Supabase:**
   - Cajeros solo ven sus propias ventas
   - Admins ven todas las ventas
   - Super Admin tiene acceso total

3. **Sincronización:**
   - UUID por venta para prevenir duplicados
   - Validación server-side de integridad de datos
   - Logs de auditoría (quién modificó qué y cuándo)

4. **Offline Security:**
   - Datos locales encriptados (SQLCipher si usa SQLite)
   - Limpieza de caché al cerrar sesión

---

### 📦 Deployment Strategy

#### Fase 1: Desktop App (Electron)
- Empaquetado con Electron para Windows 11
- Instalador .exe
- Auto-update integrado
- Base de datos local: SQLite con sincronización a Supabase

#### Fase 2: PWA Dashboard (Vercel)
- Deploy en Vercel
- URL: dashboard.sabrosita.app (ejemplo)
- Installable en iOS/Android
- Autenticación SSO con desktop app

---

### 🚀 Roadmap de Implementación

#### Sprint 1: Fundación (Semana 1)
- [ ] Setup proyecto Next.js 16 + TypeScript + Tailwind
- [ ] Configurar Supabase (crear proyecto, tablas base)
- [ ] Auth: Login con código alfanumérico
- [ ] Feature: products (CRUD básico)

#### Sprint 2: POS Core (Semana 2)
- [ ] Feature: pos (ventana de venta simple, sin multi-ventana aún)
- [ ] Integración con scanner USB (pruebas con keyboard wedge)
- [ ] Feature: sales (proceso de pago)
- [ ] Cálculo de cambio automático

#### Sprint 3: Cash Register (Semana 3)
- [ ] Feature: cash-register (apertura/cierre)
- [ ] Control por operador
- [ ] Reporte de cierre de caja

#### Sprint 4: Printing (Semana 4)
- [ ] Feature: printing (integración ESC/POS)
- [ ] Template de ticket configurable
- [ ] Pruebas con Epson TM-T20

#### Sprint 5: Multi-Ventana + Offline (Semana 5)
- [ ] Multi-ventana de facturación
- [ ] Feature: sync (IndexedDB + Supabase)
- [ ] Modo offline funcional
- [ ] Sincronización automática

#### Sprint 6: Import CSV + Búsqueda (Semana 6)
- [ ] Importador CSV desde Mónica 8.5
- [ ] Búsqueda por nombre con autocompletado
- [ ] Optimización de queries (índices en BD)

#### Sprint 7: Reports (Semana 7)
- [ ] Feature: reports (cierre diario, ventas por operador)
- [ ] Exportación a PDF/Excel
- [ ] Envío por email (SMTP)

#### Sprint 8: Dashboard PWA (Semana 8)
- [ ] Feature: dashboard (métricas en tiempo real)
- [ ] PWA installable
- [ ] Gráficos con Chart.js o Recharts
- [ ] Realtime subscriptions (Supabase)

#### Sprint 9: Roles + Admin Panel (Semana 9)
- [ ] Sistema de roles (Super Admin, Admin, Cajero)
- [ ] Panel de configuración (datos negocio, impresora)
- [ ] Gestión de usuarios

#### Sprint 10: Testing + Deploy (Semana 10)
- [ ] Testing E2E completo
- [ ] Empaquetado Electron
- [ ] Instalador Windows
- [ ] Deploy PWA a Vercel
- [ ] Documentación de usuario

---

### 🔧 Configuración de Desarrollo

```bash
# Instalación
git clone [repo]
cd sabrosita-v3
npm install

# Development
npm run dev              # Next.js (puerto auto-detect 3000-3006)
npm run dev:electron     # Electron app

# Build
npm run build            # Next.js build
npm run build:electron   # Empaquetado .exe

# Testing
npm run test             # Vitest
npm run test:e2e         # Playwright

# Supabase
npm run db:push          # Aplicar migraciones
npm run db:seed          # Datos de prueba
```

---

## 8. Fases Futuras (Post-MVP)

### Fase 2: Integraciones
- [ ] Factura electrónica Costa Rica (Hacienda)
- [ ] Integración con POS físicos (terminales de tarjeta)
- [ ] API REST para integraciones externas

### Fase 3: Features Avanzadas
- [ ] Sistema de fiado/crédito a clientes
- [ ] Programa de fidelización (puntos)
- [ ] Múltiples sucursales con sincronización central
- [ ] Análisis predictivo de inventario (ML)

---

## 9. Notas Críticas

### ⚠️ Diferencias vs SaaS Multi-Tenant
Este NO es un SaaS multi-tenant. Cada cliente:
1. Clona el repositorio
2. Configura su propia instancia de Supabase
3. Despliega su propia versión (self-hosted o managed)

**Ventajas:**
- Control total de datos (importante para Costa Rica)
- Sin dependencia de servidor central
- Personalización por cliente
- Sin costos recurrentes de SaaS

**Desventajas:**
- Cada cliente necesita configuración inicial
- Updates manuales (o auto-update con Electron)

---

### 🎯 Success Metrics (3 meses post-deploy)

- [ ] **Cliente inicial usando sistema 100% (Mónica 8.5 retirado)**
- [ ] **Cero crashes en Windows 11 durante 90 días**
- [ ] **Tiempo promedio de venta: <10 segundos**
- [ ] **5+ pulperías adicionales migrando al sistema**
- [ ] **Feedback positivo de cajeros: "Es más fácil que Mónica"**

---

*Documento vivo. Actualizar con aprendizajes durante implementación (Auto-Blindaje).*

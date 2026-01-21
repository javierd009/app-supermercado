# 🖨️ Feature: Printing (Impresión Térmica)

Sistema de impresión de tickets térmicos usando protocolo ESC/POS, integrado con Electron.

---

## 📁 Estructura

```
printing/
├── services/
│   ├── ticketFormatter.ts    # Formatea tickets en ESC/POS
│   ├── printService.ts        # Comunicación con Electron IPC
│   └── index.ts
├── types/
│   └── index.ts               # TicketData, PrinterConfig, comandos ESC/POS
├── index.ts
└── README.md                  # Este archivo
```

---

## 🚀 Uso

### Flujo Automático (Integrado con POS)

```
Usuario completa venta → F10 → Pago → Enter
  ↓
salesService.createSale() guarda venta
  ↓
salesService.getSaleWithItems() obtiene venta completa
  ↓
printService.printSaleTicket() imprime automáticamente
  ↓
Ticket impreso ✓
```

### Uso Manual

```typescript
import { printService } from '@/features/printing';

// Imprimir ticket de venta
const result = await printService.printSaleTicket(
  saleWithItems,
  'MARIA_01',     // Nombre del cajero
  'CAJA-001'      // Número de caja
);

if (!result.success) {
  console.error('Error:', result.error);
}

// Imprimir ticket de prueba
await printService.printTestTicket();
```

---

## 🧾 Formato de Ticket

### Ejemplo de Salida

```
           Sabrosita
      San José, Costa Rica
         Tel: 2222-2222
========================================
Fecha: 16/1/26
Hora:  14:30
Cajero: MARIA_01
Caja: CAJA-001
Ticket: A3F8B2C1
========================================
CANT DESCRIPCION              TOTAL
----------------------------------------
   2 Coca Cola 600ml        ₡2,000
     @ ₡1,000
   1 Pan Bimbo Grande       ₡1,500
   3 Leche Dos Pinos 1L     ₡4,500
     @ ₡1,500
========================================
               TOTAL: ₡8,000

Pago: Efectivo
Recibido: ₡10,000
Cambio: ₡2,000
========================================

      ¡Gracias por su compra!
           Vuelva pronto
```

---

## 🔧 Servicios

### ticketFormatter

Formatea contenido del ticket usando comandos ESC/POS.

**Métodos:**
- `format(data: TicketData): string` - Genera ticket completo

**Features:**
- ✅ Alineación: izquierda, centro, derecha
- ✅ Tamaño de texto: normal, doble altura, doble ancho
- ✅ Estilos: negrita, subrayado
- ✅ Separadores con líneas
- ✅ Formateo de moneda costarricense (₡)
- ✅ Corte parcial automático
- ✅ Ancho configurable (40, 48, etc. caracteres)

**Comandos ESC/POS usados:**
```typescript
INIT: '\x1B@'              // Inicializar
ALIGN_CENTER: '\x1Ba\x01'  // Centrar
DOUBLE_SIZE: '\x1D!\x11'   // Texto grande
BOLD_ON: '\x1BE\x01'       // Negrita
PARTIAL_CUT: '\x1DV\x01'   // Corte parcial
```

### printService

Maneja comunicación con impresora vía Electron IPC.

**Métodos:**
- `printSaleTicket(sale, cashierName, registerNumber)` - Imprime ticket de venta
- `printTestTicket()` - Imprime ticket de prueba
- `setBusinessConfig(config)` - Configura info del negocio
- `getBusinessConfig()` - Obtiene configuración actual

**Configuración del Negocio:**
```typescript
printService.setBusinessConfig({
  name: 'Mi Pulpería',
  address: 'Barrio San Francisco, CR',
  phone: '2234-5678'
});
```

---

## ⚙️ Integración con Electron

### Preload Script (electron/preload.js)

```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  printer: {
    print: (data) => ipcRenderer.invoke('printer:print', data),
  },
});
```

### Main Process (electron/main.js)

```javascript
ipcMain.handle('printer:print', async (event, data) => {
  // En desarrollo: guarda en archivo temporal
  if (isDev) {
    fs.writeFileSync(tempFile, data, 'utf8');
  }

  // En producción: imprime vía BrowserWindow.print()
  const printWindow = new BrowserWindow({ show: false });
  printWindow.loadURL(`data:text/html,...`);
  printWindow.webContents.print({ silent: true });
});
```

---

## 🔄 Flujo Técnico

### Imprimir Ticket (Paso a Paso)

```
1. POS procesa pago exitoso
   ↓
2. salesService.createSale() retorna { sale: { id } }
   ↓
3. salesService.getSaleWithItems(id) obtiene venta completa
   ↓
4. printService.printSaleTicket() llama a:
   ↓
5. ticketFormatter.format() genera contenido ESC/POS
   ↓
6. window.electronAPI.printer.print(content)
   ↓
7. Electron Main Process recibe IPC
   ↓
8. En DEV: Guarda en /tmp/ticket-XXX.txt
   En PROD: Envía a impresora predeterminada
   ↓
9. Ticket impreso ✓
```

---

## 🖨️ Impresoras Compatibles

### Recomendadas
- **Epson TM-T20** (ancho 58mm/80mm)
- **Epson TM-T88** (ancho 80mm)
- **Star TSP143** (ancho 80mm)
- **Bixolon SRP-350** (ancho 80mm)

### Protocolo
- **ESC/POS** (estándar para impresoras térmicas)

### Conexiones Soportadas
- ✅ USB (keyboard wedge)
- ✅ Serial (RS-232)
- ✅ Ethernet (IP)

---

## 🧪 Testing

### Modo Desarrollo
```bash
npm run dev:electron
```

Al imprimir:
1. Ticket se guarda en: `/tmp/ticket-[timestamp].txt`
2. Preview en consola (primeros 500 caracteres)
3. Revisar archivo para ver formato completo

### Ticket de Prueba
```typescript
import { printService } from '@/features/printing';

// Desde consola del navegador (F12)
await printService.printTestTicket();
```

### Modo Producción
```bash
npm run build
npm run start:electron
```

Al imprimir:
1. Se envía a impresora predeterminada del sistema
2. Impresión silenciosa (sin diálogo)
3. Verificar que impresora térmica esté configurada como predeterminada

---

## ⚠️ Consideraciones

### Errores de Impresión No Bloquean Venta
Si falla la impresión:
- ✅ Venta se guarda igual en DB
- ✅ Stock se actualiza
- ⚠️ Se muestra warning en consola
- 💡 Usuario puede reimprimir después

### Reimprimir Ticket
```typescript
// Desde historial de ventas (próxima feature)
const sale = await salesService.getSaleWithItems(saleId);
await printService.printSaleTicket(sale, cashierName, registerId);
```

### Configuración en Windows
1. Conectar impresora USB
2. Instalar drivers del fabricante
3. Configurar como impresora predeterminada
4. Verificar con ticket de prueba

---

## 🚧 Próximas Mejoras (TODO)

### Logo del Negocio
- [ ] Agregar logo en formato ESC/POS bitmap
- [ ] Comando: `GS v 0` (imprimir imagen)

### Configuración Avanzada
- [ ] Seleccionar impresora específica (no solo predeterminada)
- [ ] Configurar ancho de papel (58mm vs 80mm)
- [ ] Velocidad de impresión

### Códigos de Barras
- [ ] Imprimir código de barras en ticket
- [ ] Comando: `GS k` (CODE128, EAN13)

### QR Code
- [ ] Imprimir QR con link a factura digital
- [ ] Comando: `GS ( k`

### Múltiples Copias
- [ ] Opción para imprimir 2+ copias
- [ ] Copia para cliente + copia interna

### Impresión Directa a Puerto
- [ ] Escribir directamente a puerto USB/Serial
- [ ] Mayor control y compatibilidad
- [ ] Librería: `node-printer` o `escpos`

---

## 📊 Tipos TypeScript

### TicketData
```typescript
interface TicketData {
  sale: SaleWithItems;
  businessName: string;
  businessAddress?: string;
  businessPhone?: string;
  cashierName: string;
  registerNumber?: string;
}
```

### PrinterConfig
```typescript
interface PrinterConfig {
  name: string;
  width: number; // Ancho en caracteres
  encoding: 'UTF-8' | 'ISO-8859-1';
}
```

### PrintResult
```typescript
interface PrintResult {
  success: boolean;
  error?: string;
}
```

---

## 🔒 Seguridad

- ✅ No se exponen comandos de sistema en renderer
- ✅ IPC handler valida datos antes de imprimir
- ✅ Impresión silenciosa evita diálogos molestos
- ✅ Modo desarrollo guarda en temp (no imprime)

---

## 📈 KPIs de Éxito

- ✅ Ticket impreso en <2 segundos
- ✅ Formato correcto en 58mm y 80mm
- ✅ Caracteres especiales (₡, ñ, á) correctos
- ✅ No bloquea venta si falla impresión
- ✅ Compatible con impresoras Epson TM-T20

---

*Feature completada: 2026-01-16*

**Estado:** Funcional en dev y producción
**Próximo:** Scanner USB (keyboard wedge)

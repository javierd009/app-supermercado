# 🚀 Instrucciones de Deployment - Sabrosita POS

Guía paso a paso para desplegar el sistema en producción.

---

## 📋 Prerequisitos

### Software Necesario

1. **Node.js 18+**
   - Descargar: https://nodejs.org/
   - Verificar: `node --version`

2. **Git** (opcional, para clonación)
   - Descargar: https://git-scm.com/

3. **Cuenta Supabase**
   - Crear en: https://supabase.com/dashboard
   - Plan Free es suficiente para iniciar

---

## 🗄️ Paso 1: Configurar Supabase

### 1.1 Crear Proyecto

1. Ir a https://supabase.com/dashboard
2. Click en "New Project"
3. Nombre: `sabrosita-pos`
4. Database Password: Guardar en lugar seguro
5. Region: Seleccionar más cercana (São Paulo para CR)
6. Click "Create new project"

### 1.2 Ejecutar Migraciones

1. Una vez creado, ir a "SQL Editor"
2. Abrir archivo: `supabase/migrations/20260116_initial_schema.sql`
3. Copiar todo el contenido
4. Pegar en SQL Editor
5. Click "Run" (ejecutar)
6. Verificar mensaje de éxito

### 1.3 Obtener Credenciales

1. Ir a "Settings" → "API"
2. Copiar:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Public Key**: `eyJhbGc...`
3. Guardar en lugar seguro

---

## 💻 Paso 2: Configurar Aplicación

### 2.1 Clonar/Copiar Proyecto

```bash
# Si tienes git
git clone [url-del-repo]
cd sabrosita-v3

# O copiar carpeta manualmente
```

### 2.2 Instalar Dependencias

```bash
npm install
```

Esperar 2-5 minutos dependiendo de conexión.

### 2.3 Configurar Variables de Entorno

Crear archivo `.env.local` en la raíz del proyecto:

```bash
# Windows
notepad .env.local

# Mac/Linux
nano .env.local
```

Contenido del archivo:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

Reemplazar con tus valores del Paso 1.3.

---

## 🛠️ Paso 3: Build para Producción

### 3.1 Build de Next.js

```bash
npm run build
```

Esperar 1-3 minutos. Debe completar sin errores.

### 3.2 Build de Electron (Windows .exe)

```bash
npm run build:electron
```

Esperar 2-5 minutos. Genera archivo en `dist/`:

```
dist/
└── Sabrosita-POS-Setup-1.0.0.exe  (~80-100 MB)
```

---

## 📦 Paso 4: Distribuir Aplicación

### 4.1 Método 1: Instalador USB

1. Copiar `Sabrosita-POS-Setup-1.0.0.exe` a USB
2. Llevar USB a computadora del negocio
3. Ejecutar instalador
4. Seguir wizard de instalación
5. Desktop shortcut se crea automáticamente

### 4.2 Método 2: Compartir en Red Local

1. Subir `.exe` a carpeta compartida
2. Desde otras PCs, descargar e instalar

### 4.3 Método 3: Cloud (OneDrive/Google Drive)

1. Subir `.exe` a nube
2. Compartir link con clientes
3. Descargar e instalar

---

## 🖥️ Paso 5: Configurar Hardware

### 5.1 Scanner de Código de Barras

**Conexión:**
1. Conectar scanner USB a computadora
2. Windows instalará drivers automáticamente
3. LED del scanner debe encender

**Verificación:**
1. Abrir Sabrosita POS
2. Ir a menú → "Scanner Test" (o `/scanner-test`)
3. Escanear un código de barras
4. Debe aparecer como "📷 Scanner"

**Si detecta como "⌨️ Teclado":**
- Scanner está en modo lento
- Consultar manual para aumentar velocidad
- O configurar para enviar "Enter" al final

**Modelos Recomendados:**
- Honeywell 1900/1902 (USB) - $100-150
- Zebra DS2208 (USB) - $120-180
- Symbol LS2208 (USB) - $80-120

### 5.2 Impresora Térmica

**Conexión:**
1. Conectar impresora USB a computadora
2. Instalar drivers del fabricante:
   - Epson TM-T20: https://epson.com/support
   - Epson TM-T88: https://epson.com/support

**Configuración Windows:**
1. Panel de Control → Dispositivos e Impresoras
2. Click derecho en impresora térmica
3. "Establecer como impresora predeterminada"
4. Verificar que está "Lista"

**Verificación:**
1. Abrir Sabrosita POS
2. Hacer venta de prueba
3. Al finalizar, debe imprimir ticket automáticamente

**Modelos Recomendados:**
- Epson TM-T20II (USB) - $200-250
- Epson TM-T88V (USB) - $300-400
- Star TSP143 (USB) - $150-200

**Papel Térmico:**
- Ancho: 58mm o 80mm
- Rollo: 50-80mm diámetro
- Calidad: 55-60 g/m²

---

## 👥 Paso 6: Crear Usuarios

### 6.1 Login Inicial

```
Usuario: ADMIN
Contraseña: admin123
```

### 6.2 Crear Cajeros

1. Login como ADMIN
2. Ir a "Usuarios" (si existe) o usar Supabase dashboard
3. En Supabase:
   - Ir a "Table Editor" → "users"
   - Click "Insert row"
   - Completar:
     ```
     username: MARIA_01
     password_hash: [usar bcrypt en futuro, por ahora texto plano MVP]
     role: cashier
     ```

**Roles Disponibles:**
- `super_admin` - Acceso total
- `admin` - Gestión sin config sistema
- `cashier` - Solo POS y caja

---

## 📦 Paso 7: Importar Datos desde Mónica 8.5

### 7.1 Exportar de Mónica 8.5

1. Abrir Mónica 8.5
2. Ir a módulo "Productos"
3. Menu → Exportar → CSV
4. Guardar como `productos.csv`

### 7.2 Importar a Sabrosita

1. Abrir Sabrosita POS
2. Ir a "Productos"
3. Click botón "Importar CSV"
4. Arrastrar `productos.csv` al área
5. Revisar preview de columnas detectadas
6. Click "Confirmar Importación"
7. Esperar progreso (1,500 productos ≈ 30 segundos)

**Columnas Detectadas Automáticamente:**
- Código, Code, Cod, Código, Barcode, SKU
- Nombre, Name, Producto, Product
- Cantidad, Quantity, Stock
- Costo, Cost
- Precio, Price, PVP

---

## 🧪 Paso 8: Testing de Producción

### 8.1 Test de Venta Simple

1. **Abrir Caja**
   - Login como cajero
   - Ir a "Gestionar Caja"
   - Abrir con ₡50,000

2. **Venta de Prueba**
   - Ir a "Punto de Venta"
   - Escanear producto (o buscar manualmente)
   - F10 para cobrar
   - Seleccionar "Efectivo"
   - Ingresar monto (ej: ₡2,000)
   - Enter para confirmar
   - Verificar ticket impreso

3. **Verificar Stock**
   - Ir a "Productos"
   - Buscar producto vendido
   - Verificar que stock disminuyó

4. **Cerrar Caja**
   - Ir a "Gestionar Caja"
   - Cerrar caja
   - Ingresar monto contado
   - Verificar diferencia (debe ser ₡0)

### 8.2 Test Multi-Ventana (Opcional)

1. Desde Dashboard, click "Nueva Ventana POS"
2. Procesar venta en Ventana 1
3. Intentar vender mismo producto en Ventana 2
4. Debe validar stock actualizado

### 8.3 Test de Scanner

1. Ir a `/scanner-test`
2. Escanear 5 códigos diferentes
3. Verificar que todos se detecten como "📷 Scanner"

---

## 📊 Paso 9: Configuración del Negocio

### 9.1 Información en Tickets

Por defecto:
```
Nombre: Sabrosita
Dirección: San José, Costa Rica
Teléfono: 2222-2222
```

**Cambiar información:**

Editar archivo: `src/features/printing/services/printService.ts`

Buscar línea ~12:
```typescript
private businessConfig = {
  name: 'Tu Pulpería',
  address: 'Tu Dirección, Ciudad',
  phone: '2234-5678',
};
```

Guardar y hacer rebuild:
```bash
npm run build
npm run build:electron
```

---

## 🔧 Paso 10: Mantenimiento

### 10.1 Backup de Base de Datos

**Automático:**
- Supabase hace backup diario automático
- Retención: 7 días en plan Free

**Manual:**
1. Ir a Supabase Dashboard
2. Database → Backups
3. Click "Create backup"

### 10.2 Actualizar Aplicación

```bash
# 1. Descargar nueva versión
# 2. Instalar dependencias
npm install

# 3. Build nuevo ejecutable
npm run build
npm run build:electron

# 4. Distribuir nuevo .exe
```

### 10.3 Logs de Errores

**Ubicación:**
- Windows: `%APPDATA%/sabrosita-pos/logs/`
- Electron Console: F12 en modo desarrollo

---

## ⚠️ Troubleshooting

### Problema: "No conecta a Supabase"

**Solución:**
1. Verificar internet funciona
2. Revisar `.env.local` tiene valores correctos
3. Verificar Supabase project no está pausado

### Problema: "Impresora no imprime"

**Solución:**
1. Verificar impresora encendida
2. Panel Control → ver si está como "predeterminada"
3. Imprimir página de prueba desde Windows
4. Verificar papel térmico instalado correctamente

### Problema: "Scanner no detecta"

**Solución:**
1. Verificar LED scanner encendido
2. Probar scanner en Notepad (debe escribir)
3. Ir a `/scanner-test` para diagnosticar
4. Verificar velocidad scanner (debe ser rápida)

### Problema: "Stock no se actualiza"

**Solución:**
1. Verificar venta se guardó (revisar en Supabase)
2. Revisar consola de errores (F12)
3. Verificar permisos RLS en Supabase

---

## 📞 Soporte

### Documentación

- README.md - Overview
- PROYECTO_COMPLETADO.md - Documentación completa
- src/features/*/README.md - Docs por feature

### Contacto

Documentar issues y contactar al desarrollador.

---

## ✅ Checklist Final

Antes de ir a producción:

- [ ] Supabase configurado y migraciones ejecutadas
- [ ] `.env.local` con credenciales correctas
- [ ] Build completado sin errores
- [ ] Instalador `.exe` generado
- [ ] Scanner USB conectado y testeado
- [ ] Impresora térmica configurada y testeada
- [ ] Usuario ADMIN funciona
- [ ] Usuarios cajeros creados
- [ ] Productos importados desde Mónica 8.5
- [ ] Venta de prueba completa exitosa
- [ ] Ticket impreso correctamente
- [ ] Stock se actualiza correctamente
- [ ] Apertura/cierre de caja funciona
- [ ] Multi-ventana testeda (si aplica)
- [ ] Información del negocio actualizada en tickets

---

**¡Sistema listo para producción!** 🎉

Fecha de deployment: ___________
Responsable: ___________

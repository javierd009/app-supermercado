# Facturación Electrónica Costa Rica - Investigación y Propuesta

## Índice
1. [Resumen Ejecutivo](#resumen-ejecutivo)
2. [Marco Legal](#marco-legal)
3. [Tasas de IVA](#tasas-de-iva)
4. [Requisitos Técnicos](#requisitos-técnicos)
5. [Estado Actual del Proyecto](#estado-actual-del-proyecto)
6. [Propuesta de Implementación](#propuesta-de-implementación)
7. [Opciones de Integración](#opciones-de-integración)
8. [Cronograma y Costos](#cronograma-y-costos)

---

## Resumen Ejecutivo

### ¿Qué es la Factura Electrónica en Costa Rica?

La factura electrónica es un documento digital con validez fiscal que se envía al Ministerio de Hacienda para su validación. Es **obligatoria** para todos los contribuyentes desde 2018.

### Versión Actual

- **Versión 4.4** - Obligatoria desde **1 de septiembre de 2025**
- Más de 140 cambios técnicos respecto a la versión 4.3
- Nuevo sistema **TRIBU-CR** y **TicoFactura** desde octubre 2025

### Lo que Ya Tiene el Proyecto

✅ Sistema de tasas de IVA (0%, 4%, 13%)
✅ Cálculos de desglose de IVA por tasa
✅ Campos de IVA en productos, items y ventas
✅ Formato de ticket con desglose fiscal

### Lo que Falta para Factura Electrónica

❌ Código CABYS por producto (obligatorio)
❌ Firma digital del contribuyente
❌ Generación de XML versión 4.4
❌ Conexión con API de Hacienda
❌ Gestión de claves numéricas (50 dígitos)
❌ Almacenamiento de respuestas de Hacienda

---

## Marco Legal

### Leyes y Decretos

| Normativa | Descripción |
|-----------|-------------|
| **Ley N° 9416 (2016)** | Establece obligatoriedad de facturación electrónica |
| **Decreto 44739-H (2024)** | Regula versión 4.4 y nuevos requisitos |
| **Resolución MH-DGT-RES-0027-2024** | Especificaciones técnicas versión 4.4 |
| **Ley N° 6826** | Impuesto sobre las Ventas (IVA) |

### Plazos Importantes

| Fecha | Evento |
|-------|--------|
| 1 Sep 2025 | Versión 4.4 obligatoria |
| 5 Oct 2025 | CIIU 4 obligatorio (códigos de actividad) |
| 6 Oct 2025 | Lanzamiento TicoFactura y TRIBU-CR |

### Tipos de Comprobantes Electrónicos

| Código | Tipo | Uso |
|--------|------|-----|
| **01** | Factura Electrónica | Clientes con cédula (deducible) |
| **04** | Tiquete Electrónico | Consumidor final (no deducible) |
| **02** | Nota de Débito | Aumentar monto de factura |
| **03** | Nota de Crédito | Devoluciones/descuentos |
| **09** | Recibo Electrónico de Pago | Nuevo en v4.4 |

### ¿Cuándo usar Tiquete vs Factura?

| Situación | Documento | Razón |
|-----------|-----------|-------|
| Cliente no pide factura | **Tiquete** | Consumidor final |
| Cliente pide factura | **Factura** | Necesita deducir gasto |
| Venta a empresa | **Factura** | Requiere crédito fiscal |
| Venta al Estado | **Factura** | Obligatorio + Recibo de Pago |

---

## Tasas de IVA

### Tasas Vigentes en Costa Rica

| Tasa | Nombre | Productos |
|------|--------|-----------|
| **0%** | Exento | Educación, salud, exportaciones |
| **1%** | Canasta Básica Tributaria | Arroz, frijoles, aceite, azúcar, sal, huevos, leche, pan, maíz |
| **2%** | Reducido especial | Algunos insumos agrícolas |
| **4%** | Reducido | Medicamentos con receta, boletos aéreos |
| **13%** | General | Mayoría de productos y servicios |

### Canasta Básica Tributaria (1% IVA)

Productos incluidos según Decreto 43790-H:

**Alimentos:**
- Arroz, frijoles, maíz
- Aceite vegetal
- Azúcar
- Sal
- Huevos
- Leche fluida
- Pan (ciertos tipos)
- Café molido
- Pollo entero
- Carne de res (ciertos cortes)
- Atún enlatado

**Artículos de Higiene:**
- Jabón de baño
- Pasta dental
- Papel higiénico
- Desodorante

**Artículos Escolares:**
- Cuadernos
- Lápices
- Bolígrafos

### Código CABYS

El **Catálogo de Bienes y Servicios (CABYS)** es obligatorio en cada línea de la factura.

- Código de **13 dígitos**
- Identifica el producto y su tasa de IVA
- Más de **20,000 productos** clasificados
- Buscador oficial: https://www.bccr.fi.cr/indicadores-economicos/catálogo-de-bienes-y-servicios

**Ejemplo de códigos CABYS para supermercado:**

| Producto | Código CABYS | IVA |
|----------|--------------|-----|
| Arroz en grano | 2311100000101 | 1% |
| Frijoles | 2311200000101 | 1% |
| Aceite vegetal | 2151100000101 | 1% |
| Leche fluida | 2221100000101 | 1% |
| Gaseosas | 2181100000101 | 13% |
| Snacks | 2319400000101 | 13% |

---

## Requisitos Técnicos

### 1. Firma Digital

**Obligatoria** para firmar los documentos XML.

| Tipo | Descripción | Costo aproximado |
|------|-------------|------------------|
| Persona Física | Tarjeta inteligente + certificado | ₡15,000 - ₡25,000 |
| Persona Jurídica | Certificado empresarial | ₡50,000 - ₡100,000 |

**Dónde obtenerla:**
- Bancos: BCR, Nacional, Popular, BAC
- Cooperativas autorizadas
- Portal: https://www.mifirmadigital.go.cr/

### 2. Estructura XML

El documento electrónico tiene esta estructura básica:

```xml
<?xml version="1.0" encoding="utf-8"?>
<FacturaElectronica xmlns="...">
  <Clave>50628012600310123456780010000010100000000011</Clave>
  <CodigoActividad>472111</CodigoActividad>
  <NumeroConsecutivo>00100001010000000001</NumeroConsecutivo>
  <FechaEmision>2025-01-21T10:30:00-06:00</FechaEmision>

  <Emisor>
    <Nombre>Supermercado Sabrosita</Nombre>
    <Identificacion>
      <Tipo>01</Tipo>
      <Numero>123456789</Numero>
    </Identificacion>
    <!-- ... más datos del emisor -->
  </Emisor>

  <Receptor>
    <Nombre>Juan Pérez</Nombre>
    <Identificacion>
      <Tipo>01</Tipo>
      <Numero>987654321</Numero>
    </Identificacion>
  </Receptor>

  <DetalleServicio>
    <LineaDetalle>
      <NumeroLinea>1</NumeroLinea>
      <Codigo>2311100000101</Codigo> <!-- CABYS -->
      <CodigoComercial>
        <Tipo>04</Tipo>
        <Codigo>ARR001</Codigo> <!-- SKU interno -->
      </CodigoComercial>
      <Cantidad>2</Cantidad>
      <UnidadMedida>Kg</UnidadMedida>
      <Detalle>Arroz grano largo 1kg</Detalle>
      <PrecioUnitario>1500.00</PrecioUnitario>
      <MontoTotal>3000.00</MontoTotal>
      <Impuesto>
        <Codigo>01</Codigo>
        <CodigoTarifa>08</CodigoTarifa> <!-- 1% CBT -->
        <Tarifa>1.00</Tarifa>
        <Monto>30.00</Monto>
      </Impuesto>
      <MontoTotalLinea>3030.00</MontoTotalLinea>
    </LineaDetalle>
  </DetalleServicio>

  <ResumenFactura>
    <TotalServGravados>0.00</TotalServGravados>
    <TotalMercanciasGravadas>3000.00</TotalMercanciasGravadas>
    <TotalGravado>3000.00</TotalGravado>
    <TotalImpuesto>30.00</TotalImpuesto>
    <TotalComprobante>3030.00</TotalComprobante>
  </ResumenFactura>
</FacturaElectronica>
```

### 3. Clave Numérica (50 dígitos)

Estructura de la clave:
```
506 28 01 26 003101234567 8 00100001 01 00000001 1
│   │  │  │  │            │ │        │  │        │
│   │  │  │  │            │ │        │  │        └─ Dígito verificador
│   │  │  │  │            │ │        │  └─ Consecutivo (8 dígitos)
│   │  │  │  │            │ │        └─ Tipo documento (01=Factura, 04=Tiquete)
│   │  │  │  │            │ └─ Código seguridad (8 dígitos aleatorios)
│   │  │  │  │            └─ Situación (8=Normal)
│   │  │  │  └─ Cédula emisor (12 dígitos)
│   │  │  └─ Año (2 dígitos)
│   │  └─ Mes (2 dígitos)
│   └─ Día (2 dígitos)
└─ Código país (506 = Costa Rica)
```

### 4. API del Ministerio de Hacienda

**Endpoints:**

| Ambiente | URL Base |
|----------|----------|
| Pruebas (Staging) | `https://api-sandbox.comprobanteselectronicos.go.cr/` |
| Producción | `https://api.comprobanteselectronicos.go.cr/` |

**Flujo de envío:**

1. **Obtener Token** - OAuth 2.0 con credenciales ATV
2. **Enviar XML** - POST firmado digitalmente
3. **Recibir Acuse** - Hacienda responde en máximo 3 horas
4. **Procesar Respuesta** - Aceptado o Rechazado

---

## Estado Actual del Proyecto

### ✅ Ya Implementado

**1. Sistema de IVA** ([taxCalculations.ts](../src/features/tax/utils/taxCalculations.ts))
```typescript
export const TAX_RATES = {
  EXEMPT: 0.00,      // Exento
  REDUCED: 4.00,     // Medicamentos
  STANDARD: 13.00,   // General
};
```

**2. Campos en Base de Datos** (migración existente)
- `products.tax_rate` - Tasa de IVA del producto
- `sale_items.tax_rate`, `tax_amount`, `subtotal_before_tax`
- `sales.subtotal`, `total_tax`
- Vista `vw_tax_report` para reportes

**3. Desglose en Tickets** ([ticketFormatter.ts](../src/features/printing/services/ticketFormatter.ts))
- Agrupa items por tasa de IVA
- Muestra subtotal, IVA y total
- Formato profesional de ticket POS

### ❌ Falta Implementar

| Componente | Prioridad | Complejidad |
|------------|-----------|-------------|
| Campo `cabys_code` en productos | Alta | Baja |
| Tasa 1% para CBT | Alta | Baja |
| Datos del emisor (negocio) | Alta | Baja |
| Generador de XML v4.4 | Alta | Alta |
| Firma digital (integración) | Alta | Alta |
| API Hacienda (conexión) | Alta | Media |
| Gestión de respuestas | Media | Media |
| Notas de crédito/débito | Media | Media |

---

## Propuesta de Implementación

### Fase 1: Preparación de Datos (1-2 semanas)

**1.1 Actualizar tasas de IVA**
```typescript
export const TAX_RATES = {
  EXEMPT: 0.00,      // Completamente exento
  CBT: 1.00,         // Canasta Básica Tributaria ⭐ NUEVO
  REDUCED_2: 2.00,   // Reducido especial
  REDUCED_4: 4.00,   // Medicamentos
  STANDARD: 13.00,   // General
};
```

**1.2 Agregar campos a productos**
```sql
ALTER TABLE products ADD COLUMN cabys_code VARCHAR(13);
ALTER TABLE products ADD COLUMN unit_measure VARCHAR(10) DEFAULT 'Unid';
```

**1.3 Configuración del emisor**
```sql
CREATE TABLE business_info (
  id UUID PRIMARY KEY,
  legal_name VARCHAR(100),           -- Razón social
  trade_name VARCHAR(100),           -- Nombre comercial
  id_type VARCHAR(2),                -- 01=Física, 02=Jurídica
  id_number VARCHAR(12),             -- Cédula/Jurídica
  activity_code VARCHAR(6),          -- CIIU
  province VARCHAR(50),
  canton VARCHAR(50),
  district VARCHAR(50),
  address TEXT,
  phone VARCHAR(20),
  email VARCHAR(100),
  -- Facturación electrónica
  fe_enabled BOOLEAN DEFAULT false,
  fe_environment VARCHAR(10),        -- 'stag' o 'prod'
  fe_atv_user VARCHAR(100),
  fe_atv_password_encrypted TEXT,
  fe_certificate_path TEXT,
  fe_certificate_pin_encrypted TEXT,
  consecutive_factura INTEGER DEFAULT 1,
  consecutive_tiquete INTEGER DEFAULT 1,
  consecutive_nc INTEGER DEFAULT 1,
  consecutive_nd INTEGER DEFAULT 1,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Fase 2: Generación de XML (2-3 semanas)

**2.1 Crear servicio de facturación**
```
src/features/electronic-invoice/
├── services/
│   ├── invoiceService.ts      -- Lógica principal
│   ├── xmlBuilder.ts          -- Genera XML v4.4
│   ├── keyGenerator.ts        -- Genera clave 50 dígitos
│   └── haciendaApi.ts         -- Conexión con API
├── utils/
│   ├── xmlSigner.ts           -- Firma digital
│   └── validators.ts          -- Validaciones
└── types/
    └── index.ts               -- Tipos TypeScript
```

### Fase 3: Integración con API (2-3 semanas)

**3.1 Flujo completo**
```
Venta → Generar XML → Firmar → Enviar a Hacienda → Guardar respuesta → Notificar
```

**3.2 Estados de factura**
```typescript
type InvoiceStatus =
  | 'pending'      // Pendiente de envío
  | 'sent'         // Enviada, esperando respuesta
  | 'accepted'     // Aceptada por Hacienda
  | 'rejected'     // Rechazada (con mensaje de error)
  | 'contingency'; // Modo contingencia (sin internet)
```

---

## Opciones de Integración

### Opción A: Desarrollo Propio (Open Source)

**Usar [CRLibre/API_Hacienda](https://github.com/CRLibre/API_Hacienda)**

| Pros | Contras |
|------|---------|
| Gratis | Requiere servidor propio |
| Control total | Mantenimiento por tu cuenta |
| Sin límites de facturas | Más tiempo de desarrollo |
| Código abierto | Necesitas firma digital propia |

**Costo:** $0/mes (solo hosting ~$5-20/mes)

### Opción B: Proveedor Comercial con API

**Proveedores recomendados:**

| Proveedor | Costo aproximado | API | Soporte |
|-----------|------------------|-----|---------|
| [Alanube](https://www.alanube.co/costarica/) | Desde $15/mes | ✅ REST | 24/7 |
| [Gosocket](https://gosocket.net/) | Desde $20/mes | ✅ REST | Horario |
| [IntegraFactura](https://www.integrafactura.com/) | Consultar | ✅ REST | Horario |
| [FACTURATica](https://facturatica.com/) | Desde $10/mes | ✅ REST | Horario |

**Costo:** $10-30/mes según volumen

### Opción C: Híbrido

Usar proveedor comercial para:
- Firma digital
- Envío a Hacienda
- Almacenamiento legal

Desarrollo propio para:
- Generación de XML
- UI de facturación
- Reportes

**Costo:** $10-15/mes + desarrollo

---

## Cronograma y Costos

### Cronograma Estimado

| Fase | Duración | Descripción |
|------|----------|-------------|
| **Fase 1** | 1-2 semanas | Preparación de datos, campos CABYS, tasas IVA |
| **Fase 2** | 2-3 semanas | Generador XML, firma digital |
| **Fase 3** | 2-3 semanas | API Hacienda, gestión de respuestas |
| **Fase 4** | 1 semana | Testing, ajustes, documentación |
| **Total** | 6-9 semanas | Implementación completa |

### Costos Estimados

**Opción A (Desarrollo propio):**
| Concepto | Costo único | Costo mensual |
|----------|-------------|---------------|
| Firma digital | ₡25,000 | - |
| Servidor (VPS) | - | $10-20 |
| Desarrollo | Tiempo | - |
| **Total** | ~₡25,000 | ~$15/mes |

**Opción B (Proveedor comercial):**
| Concepto | Costo único | Costo mensual |
|----------|-------------|---------------|
| Setup proveedor | $0-50 | - |
| Suscripción | - | $15-30 |
| Desarrollo (integración) | Tiempo | - |
| **Total** | ~$50 | ~$20/mes |

### Recomendación

Para un supermercado pequeño/mediano:

**Opción B (Proveedor comercial)** es la más práctica porque:
1. ✅ Menor tiempo de implementación
2. ✅ Soporte técnico incluido
3. ✅ Actualizaciones automáticas (cambios de Hacienda)
4. ✅ No necesitas manejar firma digital
5. ✅ Costo predecible

---

## Próximos Pasos

1. **Decidir opción de integración** (A, B o C)
2. **Obtener firma digital** (si es opción A o C)
3. **Registrarse en ATV** (portal de Hacienda)
4. **Agregar códigos CABYS** a productos existentes
5. **Implementar Fase 1** (preparación de datos)

---

## Referencias

### Documentación Oficial
- [Ministerio de Hacienda - Facturación](https://www.hacienda.go.cr/docs/Facturacion.pdf)
- [Especificaciones v4.4](https://www.hacienda.go.cr/docs/ComprobantesElectronicos-GeneralidadesyVersion4.4.marzo2025.pdf)
- [CABYS - Banco Central](https://www.bccr.fi.cr/indicadores-economicos/catálogo-de-bienes-y-servicios)
- [Firma Digital](https://www.mifirmadigital.go.cr/)

### Recursos Técnicos
- [CRLibre/API_Hacienda](https://github.com/CRLibre/API_Hacienda) - API Open Source
- [Esquemas XML v4.3](https://atv.hacienda.go.cr/ATV/ComprobanteElectronico/docs/esquemas/2016/v4.3/)
- [Guía de Emisión](https://www.hacienda.go.cr/docs/GuiaEmisiondecomprobanteselectronicos.pdf)

### Proveedores
- [Alanube](https://www.alanube.co/costarica/)
- [Gosocket](https://gosocket.net/)
- [IntegraFactura](https://www.integrafactura.com/)
- [FACTURATica](https://facturatica.com/)
- [FacturaProfesional](https://www.facturaprofesional.com/)

---

*Documento generado: Enero 2026*
*Versión: 1.0*

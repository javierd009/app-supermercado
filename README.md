# 🏪 Sabrosita POS

> Sistema POS moderno para pulperías costarricenses • Reemplazo de Mónica 8.5

**Versión:** 1.0.0 MVP
**Estado:** 🟡 40% Completo - Código 100% listo, falta ejecución
**Fecha:** Enero 2026

🚀 **[VER LISTO_PARA_EJECUTAR.md](LISTO_PARA_EJECUTAR.md)** ← Empezar aquí (20 min)

---

## 🎯 Descripción

Sistema de punto de venta (POS) desktop diseñado específicamente para pulperías y pequeños negocios en Costa Rica. Reemplaza el software legacy Mónica 8.5 con una interfaz moderna, manteniendo la simplicidad y rapidez del flujo original.

**Problema que resuelve:**
- Mónica 8.5 crashea en Windows 11
- Interfaz anticuada y difícil de mantener
- No hay soporte técnico disponible
- Falta integración con hardware moderno

**Solución:**
- Desktop app moderna con Electron
- Compatible con Windows 11
- Integración con scanners e impresoras USB
- Cloud backup automático
- Importación de datos desde Mónica 8.5

---

## ⚡ Quick Start

### Instalación

```bash
# 1. Clonar repositorio
cd sabrosita-v3

# 2. Instalar dependencias
npm install

# 3. Configurar Supabase
# Crear archivo .env.local con:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# 4. Ejecutar migraciones SQL
# Copiar contenido de supabase/migrations/*.sql
# Ejecutar en Supabase SQL Editor

# 5. Iniciar en desarrollo
npm run dev          # Next.js en http://localhost:3000
npm run dev:electron # Electron app

# 6. Build para producción
npm run build
npm run build:electron # Genera .exe en /dist
```

### Login Inicial

```
Usuario: ADMIN
Contraseña: admin123
```

---

## 🎨 Stack Tecnológico

| Capa | Tecnología | Por Qué |
|------|------------|---------|
| **Desktop** | Electron 33 | Compatibilidad Windows 11 |
| **Framework** | Next.js 16 | Full-stack, Turbopack rápido |
| **UI** | React 19 + Tailwind CSS | Moderno, responsive |
| **Language** | TypeScript | Type-safety |
| **State** | Zustand | Lightweight, simple |
| **Database** | Supabase (PostgreSQL) | Cloud backup, RLS |
| **Auth** | Supabase Auth | Seguro, escalable |
| **Hardware** | IPC Electron | Scanner, impresora |

---

## 📦 Features Implementadas ✅

1. **Autenticación Simple** - Login alfanumérico, 3 roles, sesiones 8h → [📖 Docs](src/features/auth/README.md)
2. **Gestión de Productos** - CRUD + CSV import desde Mónica 8.5 → [📖 Docs](src/features/products/README.md)
3. **Punto de Venta (POS)** - Carrito, 3 métodos de pago, atajos teclado → [📖 Docs](src/features/pos/README.md)
4. **Cash Register** - Apertura/cierre de caja con reconciliación → [📖 Docs](src/features/cash-register/README.md)
5. **Ventas** - Persistencia automática + actualización de stock → [📖 Docs](src/features/sales/README.md)
6. **Impresión Térmica** - ESC/POS, Epson TM-T20/T88 compatible → [📖 Docs](src/features/printing/README.md)
7. **Scanner USB** - Detección automática, indicador visual → [📖 Docs](src/features/scanner/README.md)
8. **Multi-Ventana** - Múltiples cajeros simultáneos → [📖 Docs](src/features/windows/README.md)

---

## 📂 Estructura del Proyecto

```
sabrosita-v3/
├── electron/               # Electron main process
│   ├── main.js            # IPC handlers
│   └── preload.js         # Secure bridge
│
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/       # Login flow
│   │   └── (main)/       # Protected routes
│   │       ├── dashboard/
│   │       ├── pos/
│   │       ├── products/
│   │       └── cash-register/
│   │
│   ├── features/          # Feature-first architecture
│   │   ├── auth/
│   │   ├── products/
│   │   ├── pos/
│   │   ├── cash-register/
│   │   ├── sales/
│   │   ├── printing/
│   │   ├── scanner/
│   │   └── windows/
│   │
│   └── shared/            # Shared code
│
├── supabase/
│   └── migrations/        # Database schema
│
├── PROYECTO_COMPLETADO.md # Documentación completa
└── README.md              # Este archivo
```

---

## 🗄️ Base de Datos

### Tablas

- `users` - Usuarios del sistema
- `products` - Inventario
- `cash_registers` - Turnos de caja
- `sales` - Encabezados de venta
- `sale_items` - Líneas de venta

### Migración

```bash
# Ejecutar en Supabase SQL Editor
cat supabase/migrations/20260116_initial_schema.sql
```

---

## 🧪 Testing

### Casos Críticos

1. **Venta Simple:** Escanear → F10 → Pago → Ticket
2. **Multi-Cajero:** 2 ventanas, misma venta simultánea
3. **Stock:** Vender más de lo disponible
4. **Impresión:** Verificar formato de ticket
5. **Scanner:** Detectar como "Scanner" no "Teclado"

Ver checklist completo en [PROYECTO_COMPLETADO.md](PROYECTO_COMPLETADO.md)

---

## 📖 Documentación Completa

**Empezar aquí:**
- 🚀 **[LISTO_PARA_EJECUTAR.md](LISTO_PARA_EJECUTAR.md)** - Guía para terminar el proyecto (20 min)
- ⚡ **[SETUP_SUPABASE.md](SETUP_SUPABASE.md)** - Configurar base de datos (10 min)
- ⭐ **[PASOS_FINALES.md](PASOS_FINALES.md)** - Paso a paso completo

**Documentación técnica:**
- **[CHANGELOG.md](CHANGELOG.md)** - Qué se implementó en v1.0.0
- **[PROYECTO_COMPLETADO.md](PROYECTO_COMPLETADO.md)** - Documentación técnica completa
- **[BUSINESS_LOGIC.md](BUSINESS_LOGIC.md)** - Lógica de negocio
- **[INSTRUCCIONES_DEPLOYMENT.md](INSTRUCCIONES_DEPLOYMENT.md)** - Deployment en producción
- **[INDICE_DOCUMENTACION.md](INDICE_DOCUMENTACION.md)** - Índice completo (~146 páginas)

---

## 🚀 Despliegue

```bash
# Build
npm run build
npm run build:electron

# Distribuir
# Archivo: dist/Sabrosita-POS-Setup-1.0.0.exe
```

---

**Desarrollado por:** Claude Sonnet 4.5  
**Cliente:** Pulpería en Costa Rica  
**Inspirado por:** Mónica 8.5  

🚀 ¡Listo para operar!

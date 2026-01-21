# 🏪 App Supermercado - Sistema POS + Admin Web

> Sistema completo de punto de venta con panel de administración remota • Sincronización en tiempo real

**Versión:** 1.1.0 - Admin Web PWA
**Estado:** ✅ **EN PRODUCCIÓN**
**Fecha:** Enero 2026

---

## 🌐 **DEMO EN VIVO**

### Admin Web (PWA) - Gestión Remota
**🚀 URL**: https://sabrosita-v3.vercel.app/admin-web/login

- 📊 **Dashboard**: Métricas en tiempo real
- 📦 **Productos**: Actualizar precios desde cualquier lugar
- ⚙️ **Configuración**: Tipo de cambio y settings
- 👥 **Clientes**: Base de datos con estadísticas
- 📈 **Reportes**: Exportación a CSV

**📖 Documentación**: [ADMIN-WEB-README.md](./ADMIN-WEB-README.md)

### GitHub Repository
**📦 Código**: https://github.com/javierd009/app-supermercado

---

## 🎯 Descripción

Sistema completo para supermercados y pulperías que combina:

### 1. **POS Desktop (Electron)** - Para cajeros
- Aplicación desktop para Windows/Mac/Linux
- Funciona offline con SQLite local
- Sincronización bidireccional con Supabase
- Integración con scanners e impresoras USB
- Interfaz optimizada para flujo rápido de ventas

### 2. **Admin Web (PWA)** - Para administradores ✨ **NUEVO**
- Panel web accesible desde cualquier dispositivo
- Actualización remota de precios e inventario
- Dashboard con métricas en tiempo real
- Reportes y exportación de datos
- Instalable como app nativa (PWA)

**Arquitectura:**
```
┌─────────────────┐
│   Admin Web     │  ← Gestión remota (navegador/PWA)
│  (Vercel PWA)   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│    Supabase     │  ← Base de datos central
│   PostgreSQL    │     + Realtime Sync
└────────┬────────┘
         │ WebSocket
         ▼
┌─────────────────┐
│   POS Desktop   │  ← Terminal de caja
│  (Electron app) │     + SQLite local
└─────────────────┘
```

**Sincronización en tiempo real**: Cambios en Admin Web → Supabase → POS en < 2 segundos

---

## ⚡ Quick Start

### Opción A: Usar Admin Web (Recomendado) ⭐

**No necesitas instalar nada** - Usa la versión en producción:

1. **Acceder**: https://sabrosita-v3.vercel.app/admin-web/login
2. **Login**: Usuario con rol `admin` o `super_admin`
3. **Gestionar**: Productos, precios, clientes, reportes
4. **Instalar PWA**: Click en "Instalar app" desde el navegador

📖 **Guía completa**: [ADMIN-WEB-README.md](./ADMIN-WEB-README.md)

---

### Opción B: Instalar POS Desktop (Local)

Para desarrolladores o uso como terminal de caja:

```bash
# 1. Clonar repositorio
git clone https://github.com/javierd009/app-supermercado.git
cd app-supermercado

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Crear archivo .env.local con:
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=https://lkiyyweipmgzcxcnocxs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key_aqui
EOF

# 4. Ejecutar en modo desarrollo
npm run dev

# 5. Ejecutar como Electron app
npm run dev:electron
```

📖 **Setup completo**: [SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)

---

## 📚 Documentación Completa

| Documento | Descripción |
|-----------|-------------|
| **[ADMIN-WEB-README.md](./ADMIN-WEB-README.md)** | Guía completa del Admin Web + plan de testing |
| **[DEPLOYMENT-SUCCESS.md](./DEPLOYMENT-SUCCESS.md)** | Resumen del deployment + URLs de producción |
| **[DEPLOYMENT-GUIDE.md](./DEPLOYMENT-GUIDE.md)** | Cómo hacer deployment a Vercel |
| **[PROJECT-STATUS.md](./PROJECT-STATUS.md)** | Estado del proyecto + próximos pasos |
| **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** | Setup del POS local |

---

## ✨ Features Principales

### Admin Web (PWA) - En Producción ✅

- **📊 Dashboard**: Ventas del día, ingresos, stock bajo, cajas activas (tiempo real)
- **📦 Productos**: CRUD completo, búsqueda, actualización de precios/stock
- **⚙️ Configuración**: Tipo de cambio USD→CRC, IVA, nombre del negocio
- **👥 Clientes**: Base de datos con estadísticas de compras
- **📈 Reportes**: 4 tipos (ventas, inventario, clientes, financiero) + exportación CSV
- **🔄 Sincronización**: Bidireccional en tiempo real con todos los POS
- **📱 PWA**: Instalable como app nativa, funciona offline
- **🔐 Seguridad**: Autenticación con roles, RLS en todas las tablas

### POS Desktop (Electron)

- **💰 Punto de Venta**: Flujo optimizado para venta rápida
- **📊 Gestión de Cajas**: Apertura/cierre de turno con conteo
- **📦 Inventario**: CRUD de productos, importación CSV
- **👥 Clientes**: Gestión de clientes frecuentes
- **🖨️ Impresión**: Tickets de venta (USB)
- **📡 Scanner**: Soporte para lectores de código de barras
- **💾 Offline**: Funciona sin internet (SQLite local)
- **🔄 Sync**: Sincronización automática con Supabase

---

## 🛠️ Stack Tecnológico

### Frontend
- **Framework**: Next.js 16 (App Router + Turbopack)
- **UI Library**: React 19
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4
- **Icons**: Lucide React

### Backend & Database
- **BaaS**: Supabase (PostgreSQL + Realtime)
- **Local DB**: SQLite (better-sqlite3)
- **ORM**: Direct SQL queries + Supabase client
- **Auth**: Supabase Auth + custom role validation

### Desktop (POS)
- **Framework**: Electron 28
- **Bundler**: Next.js production build
- **Storage**: SQLite local database

### Admin Web (PWA)
- **Deployment**: Vercel Edge Network
- **PWA**: Service Worker + Web Manifest
- **Caching**: Cache-First (static) + Network-First (API)
- **SSL**: Let's Encrypt (automático)

### Development
- **Package Manager**: npm
- **Linting**: ESLint + Next.js config
- **Type Checking**: TypeScript strict mode
- **Git Hooks**: Conventional Commits

---

## 📦 Estructura del Proyecto

```
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (main)/              # POS routes
│   │   ├── (admin-web)/         # Admin Web routes ✨ NUEVO
│   │   └── layout.tsx           # Root layout
│   │
│   ├── features/                 # Feature-first architecture
│   │   ├── auth/                # Autenticación
│   │   ├── pos/                 # Punto de venta
│   │   ├── products/            # Gestión de productos
│   │   ├── cash-register/       # Cajas
│   │   ├── customers/           # Clientes
│   │   ├── reports/             # Reportes
│   │   └── ...
│   │
│   ├── lib/                      # Utilities y servicios
│   │   ├── database/            # Database adapters
│   │   ├── supabase/            # Supabase client
│   │   └── pwa/                 # PWA utilities ✨ NUEVO
│   │
│   └── shared/                   # Componentes reutilizables
│       ├── components/
│       ├── hooks/
│       └── utils/
│
├── electron/                     # Electron app
│   ├── main.js                  # Main process
│   ├── preload.js               # Preload script
│   └── database/                # SQLite setup
│
├── supabase/                     # Supabase config
│   └── migrations/              # SQL migrations
│
├── public/                       # Static assets
│   ├── sw.js                    # Service Worker ✨ NUEVO
│   └── site.webmanifest         # PWA manifest ✨ NUEVO
│
└── docs/                         # Documentación
    ├── ADMIN-WEB-README.md      ✨ NUEVO
    ├── DEPLOYMENT-SUCCESS.md    ✨ NUEVO
    └── ...
```

---

## 🚀 Deployment

### Admin Web (Producción)

**URL**: https://sabrosita-v3.vercel.app

**Plataforma**: Vercel Edge Network
- ✅ Build automático desde GitHub
- ✅ SSL/HTTPS incluido
- ✅ CDN global (70+ ubicaciones)
- ✅ Variables de entorno configuradas

### POS Desktop

Genera ejecutables para Windows/Mac/Linux:

```bash
npm run build:electron
```

Output en `dist/`:
- `Sabrosita POS Setup.exe` (Windows)
- `Sabrosita POS.app` (macOS)
- `Sabrosita POS.AppImage` (Linux)

---

## 💰 Costos

### Plan Actual (FREE)

| Servicio | Plan | Costo |
|----------|------|-------|
| **Vercel** | Hobby | $0/mes |
| **Supabase** | Free | $0/mes |
| **Total** | | **$0/mes** |

**Límites generosos**:
- Vercel: 100 GB bandwidth, 100k invocations
- Supabase: 500 MB database, 200 realtime connections

---

## 🤝 Contribuir

Este es un proyecto open source. Contribuciones son bienvenidas:

1. Fork el repositorio
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

---

## 📞 Soporte y Contacto

- **📦 GitHub**: https://github.com/javierd009/app-supermercado
- **🚀 Demo**: https://sabrosita-v3.vercel.app/admin-web/login
- **📚 Docs**: Ver archivos `.md` en el repositorio

---

## 🎯 Roadmap

### Completado ✅
- [x] POS Desktop funcional
- [x] Admin Web PWA
- [x] Sincronización en tiempo real
- [x] Dashboard con métricas
- [x] Gestión de productos remota
- [x] Configuración de tipo de cambio
- [x] Reportes y exportación CSV
- [x] Deployment a producción

### Próximas Features
- [ ] Gráficos y visualizaciones en dashboard
- [ ] Notificaciones push para stock bajo
- [ ] Exportación de reportes a PDF
- [ ] Gestión de usuarios desde Admin Web
- [ ] Tema claro/oscuro
- [ ] Soporte multi-idioma

---

**Desarrollado con**: Claude Code + SaaS Factory V3
**Versión**: 1.1.0 - Admin Web PWA
**Status**: ✅ EN PRODUCCIÓN

🚀 **[Ver Demo en Vivo](https://sabrosita-v3.vercel.app/admin-web/login)**

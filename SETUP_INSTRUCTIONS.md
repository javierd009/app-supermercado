# 🚀 Instrucciones de Setup - Sabrosita POS

## Paso 1: Instalar Dependencias

Ejecuta en tu terminal:

```bash
npm install
```

Esto instalará:
- **Electron** (framework desktop)
- **Next.js 16** + React 19 (interfaz)
- **Supabase** (backend cloud)
- **Zustand** (estado global)
- **Zod** (validación)
- **shadcn/ui** (componentes UI)
- **better-sqlite3** (base de datos local)
- **Radix UI** (primitivos accesibles)

---

## Paso 2: Configurar Variables de Entorno

Copia el archivo de ejemplo:

```bash
cp .env.local.example .env.local
```

Edita `.env.local` y agrega tus credenciales de Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_de_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key_de_supabase
```

---

## Paso 3: Ejecutar en Modo Desarrollo

### Opción A: Solo Next.js (navegador)
```bash
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000)

### Opción B: Electron + Next.js (app desktop)
```bash
npm run dev:electron
```
Se abrirá la ventana de Electron con la app.

---

## Paso 4: Build para Producción

```bash
npm run build:electron
```

Esto genera el instalador `.exe` en la carpeta `dist/`.

---

## 🛠️ Comandos Disponibles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor Next.js (puerto 3000-3006) |
| `npm run dev:electron` | App Electron + Next.js |
| `npm run build` | Build Next.js |
| `npm run build:electron` | Build + generar instalador Windows |
| `npm run typecheck` | Verificar tipos TypeScript |
| `npm run lint` | ESLint |

---

## 📁 Estructura del Proyecto

```
sabrosita-v3/
├── electron/               # Electron main process
│   ├── main.js            # Proceso principal
│   └── preload.js         # APIs expuestas a React
│
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (auth)/       # Rutas de autenticación
│   │   ├── (main)/       # Rutas principales
│   │   └── globals.css   # Estilos globales
│   │
│   ├── features/          # Features del negocio
│   │   ├── auth/         # Autenticación
│   │   ├── products/     # Productos (a crear)
│   │   ├── pos/          # Punto de venta (a crear)
│   │   ├── sales/        # Ventas (a crear)
│   │   └── ...
│   │
│   ├── shared/            # Código compartido
│   │   ├── components/   # Componentes UI reutilizables
│   │   ├── hooks/        # Hooks personalizados
│   │   └── utils/        # Utilidades
│   │
│   └── types/             # Tipos TypeScript globales
│       └── electron.d.ts  # Tipos para Electron API
│
├── BUSINESS_LOGIC.md      # Especificación del negocio
├── SETUP_INSTRUCTIONS.md  # Este archivo
└── package.json
```

---

## 🔍 Próximos Pasos

1. ✅ Setup Electron + Next.js (COMPLETADO)
2. ⏳ Configurar Supabase (tablas)
3. ⏳ Implementar Auth (código alfanumérico)
4. ⏳ Feature: Productos (CRUD + import CSV)
5. ⏳ Feature: POS (pantalla de facturación)

---

## 💡 Notas

- **Offline-first**: La app funciona sin internet usando SQLite local
- **Sincronización**: Cuando hay internet, sincroniza con Supabase
- **Impresoras**: Compatibles con ESC/POS (Epson TM-T20, etc.)
- **Scanners**: Keyboard wedge (se conecta como teclado USB)

---

*Para dudas o problemas, revisar [BUSINESS_LOGIC.md](BUSINESS_LOGIC.md)*

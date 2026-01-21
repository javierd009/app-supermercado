# 🗄️ Supabase Database Setup

## Crear Proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com)
2. Crea una nueva organización (si no tienes una)
3. Crea un nuevo proyecto:
   - **Name**: Sabrosita POS
   - **Database Password**: (guarda esta contraseña)
   - **Region**: Closest to Costa Rica (us-east-1)
4. Espera a que el proyecto se inicialice (~2 minutos)

---

## Aplicar Migraciones

### Opción 1: SQL Editor (Manual - Recomendado para MVP)

1. En el dashboard de Supabase, ve a **SQL Editor**
2. Abre el archivo `migrations/20260116_initial_schema.sql`
3. Copia todo el contenido
4. Pega en el SQL Editor de Supabase
5. Click en **Run** (▶️)
6. Verifica que todas las tablas se crearon:
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public';
   ```

### Opción 2: Supabase CLI (Avanzado)

Si prefieres usar la CLI de Supabase:

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link al proyecto
supabase link --project-ref <tu-project-id>

# Aplicar migraciones
supabase db push
```

---

## Configurar Variables de Entorno

Copia tus credenciales de Supabase:

1. En el dashboard, ve a **Settings** → **API**
2. Copia:
   - **Project URL** (ej: `https://xxxxx.supabase.co`)
   - **anon/public key** (larga, empieza con `eyJ...`)

3. Pega en `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
   ```

---

## Verificar Tablas Creadas

Deberías ver estas tablas en **Table Editor**:

- ✅ `users` - Usuarios del sistema
- ✅ `products` - Catálogo de productos
- ✅ `cash_registers` - Cajas/turnos
- ✅ `sales` - Ventas
- ✅ `sale_items` - Ítems de ventas
- ✅ `sync_queue` - Cola de sincronización
- ✅ `config` - Configuración

---

## Autenticación

⚠️ **IMPORTANTE**: Por defecto, la autenticación de Supabase Auth está **deshabilitada** en este proyecto.

Usamos un sistema de autenticación custom con códigos alfanuméricos (como Mónica 8.5).

### Deshabilitar Email Confirmations

1. Ve a **Authentication** → **Settings**
2. Deshabilita **"Enable email confirmations"**
3. Deshabilita **"Enable phone confirmations"**

Esto permite login directo sin verificación de email.

---

## Row Level Security (RLS)

Las políticas RLS ya están configuradas en la migración:

- **Cajeros**: Solo ven sus propias ventas y cajas
- **Admins**: Ven todo
- **Super Admin**: Control total

Para probar RLS:

```sql
-- Ver políticas de una tabla
SELECT * FROM pg_policies WHERE tablename = 'sales';
```

---

## Datos de Prueba (Opcional)

Para agregar productos de prueba:

```sql
-- Insertar productos de ejemplo
INSERT INTO products (code, name, category, cost, price, stock) VALUES
  ('7501055300082', 'Coca Cola 500ml', 'Bebidas', 400, 800, 100),
  ('7501000100002', 'Galletas Pozuelo', 'Snacks', 600, 1200, 50),
  ('7501000200003', 'Agua Cristal 1L', 'Bebidas', 300, 600, 200),
  ('7501000300004', 'Pan Bimbo Blanco', 'Panadería', 800, 1500, 30);
```

---

## Troubleshooting

### Error: "permission denied for schema public"

Ejecuta:
```sql
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

### Error: "uuid-ossp extension not found"

Ejecuta:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

### Tablas no aparecen en Table Editor

Refresca la página y espera unos segundos. Supabase a veces tarda en actualizar la UI.

---

## 🔐 Seguridad

**NUNCA** commitees las siguientes variables:
- ❌ `SUPABASE_SERVICE_ROLE_KEY` (solo para backend, tiene permisos totales)
- ❌ Contraseñas de base de datos
- ❌ Secrets de producción

Solo usa `SUPABASE_ANON_KEY` en el frontend (es seguro).

---

## 📊 Backup

Supabase hace backups automáticos (plan gratuito: 7 días).

Para backup manual:

```bash
# Exportar toda la base de datos
supabase db dump -f backup.sql
```

---

*Siguiente paso: [Implementar Auth](../src/features/auth/)*

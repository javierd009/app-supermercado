# ⚡ Setup Rápido de Supabase

Ya tienes tu cuenta de Supabase lista. Sigue estos pasos para configurar la base de datos.

---

## 📋 Checklist Rápido

- [ ] Crear proyecto en Supabase
- [ ] Ejecutar migración SQL
- [ ] Configurar variables de entorno
- [ ] Crear usuario admin inicial
- [ ] Verificar conexión

**Tiempo total:** ~10 minutos

---

## Paso 1: Crear Proyecto en Supabase (2 min)

### 1.1 Acceder al Dashboard

1. Ir a: https://supabase.com/dashboard
2. Click en **"New Project"**

### 1.2 Configurar Proyecto

```
Organization: [Tu organización]
Name: sabrosita-pos
Database Password: [Genera uno seguro - GUÁRDALO]
Region: South America (São Paulo) - Más cercano a Costa Rica
Pricing Plan: Free (suficiente para empezar)
```

3. Click **"Create new project"**
4. Esperar ~2 minutos (se está creando la base de datos)

---

## Paso 2: Ejecutar Migración SQL (3 min)

### 2.1 Abrir SQL Editor

1. En el dashboard del proyecto → **SQL Editor** (menú izquierdo)
2. Click en **"New query"**

### 2.2 Copiar y Ejecutar Schema

1. Abrir archivo local: `supabase/migrations/20260116_initial_schema.sql`
2. Copiar TODO el contenido
3. Pegar en el SQL Editor de Supabase
4. Click **"Run"** (o presionar Ctrl+Enter)

**Salida esperada:**
```
Success. No rows returned
```

### 2.3 Verificar Tablas Creadas

1. Ir a **Table Editor** (menú izquierdo)
2. Deberías ver 7 tablas:
   - ✅ users
   - ✅ products
   - ✅ categories
   - ✅ cash_registers
   - ✅ sales
   - ✅ sale_items
   - ✅ payment_methods

---

## Paso 3: Configurar Variables de Entorno (1 min)

### 3.1 Obtener Credenciales

1. En dashboard → **Settings** → **API**
2. Copiar dos valores:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.2 Crear .env.local

1. En la raíz del proyecto crear: `.env.local`
2. Pegar:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. Reemplazar con tus valores reales
4. Guardar archivo

⚠️ **IMPORTANTE:** Este archivo NO debe subirse a git (ya está en .gitignore)

---

## Paso 4: Crear Usuario Admin Inicial (2 min)

### 4.1 Ejecutar en SQL Editor

```sql
-- Crear usuario ADMIN con password temporal
INSERT INTO users (username, password_hash, role)
VALUES ('ADMIN', 'admin123', 'super_admin');

-- Crear usuarios de prueba (opcional)
INSERT INTO users (username, password_hash, role)
VALUES
  ('CAJERO1', 'cajero123', 'cashier'),
  ('MANAGER1', 'manager123', 'admin');
```

Click **"Run"**

**Nota:** Estos passwords son temporales. El script `setup-final.sh` los hasheará automáticamente.

### 4.2 Verificar Usuarios

1. Ir a **Table Editor** → tabla `users`
2. Deberías ver 3 usuarios:
   - ADMIN (super_admin)
   - CAJERO1 (cashier)
   - MANAGER1 (admin)

---

## Paso 5: Verificar RLS (Row Level Security) (1 min)

### 5.1 Verificar Políticas

1. Ir a **Authentication** → **Policies**
2. Cada tabla debe tener políticas activas:
   - `users` → 4 políticas
   - `products` → 4 políticas
   - `cash_registers` → 4 políticas
   - etc.

Si no aparecen políticas:
- **Causa:** La migración SQL no se ejecutó completa
- **Solución:** Re-ejecutar el archivo `20260116_initial_schema.sql`

---

## Paso 6: Test de Conexión (1 min)

### Desde tu computadora:

```bash
# 1. Verificar que .env.local existe
cat .env.local

# 2. Ejecutar setup final (instala dependencias y migra passwords)
./setup-final.sh

# 3. Iniciar aplicación
npm run dev:electron
```

### Test de Login:

1. La app debería abrir
2. Ingresar:
   - Usuario: `ADMIN`
   - Password: `admin123`
3. Debería entrar al dashboard

Si funciona: ✅ Supabase configurado correctamente

---

## 🎯 Resumen de Configuración

| Item | Status | Valor |
|------|--------|-------|
| Proyecto creado | ✅ | https://xxxxx.supabase.co |
| SQL ejecutado | ✅ | 7 tablas creadas |
| .env.local | ✅ | Configurado |
| Usuario ADMIN | ✅ | ADMIN/admin123 |
| RLS activo | ✅ | 4 políticas por tabla |

---

## 🔧 Troubleshooting

### Error: "relation users does not exist"

**Causa:** La migración SQL no se ejecutó

**Solución:**
1. Ir a SQL Editor
2. Re-ejecutar `20260116_initial_schema.sql`
3. Verificar salida: "Success. No rows returned"

### Error: "Invalid API key"

**Causa:** Variables de entorno incorrectas

**Solución:**
1. Verificar que copiaste el **anon public** key (no el service_role)
2. Verificar que la URL empieza con `https://`
3. No debe haber espacios antes/después de los valores

### Error: "row-level security policy violation"

**Causa:** RLS activo pero sin políticas

**Solución:**
1. Verificar en Authentication → Policies
2. Ejecutar migración completa de nuevo
3. O desactivar RLS temporalmente (no recomendado para producción)

### No puedo hacer login

**Posibles causas:**
1. Usuario no existe → Verificar en Table Editor → users
2. Password incorrecto → Re-ejecutar INSERT del usuario
3. RLS bloqueando → Verificar políticas

---

## 📊 Datos de Prueba (Opcional)

### Importar Productos de Ejemplo

```sql
-- 10 productos de ejemplo
INSERT INTO products (name, barcode, price, cost, stock, category_id)
VALUES
  ('Coca Cola 600ml', '7501055301126', 1500, 1000, 50, NULL),
  ('Galletas Oreo', '7622300120965', 2200, 1500, 30, NULL),
  ('Arroz Superior 1kg', '7441001401015', 1800, 1200, 100, NULL),
  ('Frijoles Negros 500g', '7441001402012', 1400, 900, 80, NULL),
  ('Pan Bimbo Blanco', '7501055300853', 2500, 1800, 25, NULL),
  ('Leche Dos Pinos 1L', '7441001100014', 1600, 1100, 40, NULL),
  ('Huevos 12 unidades', '7441001200013', 3000, 2200, 60, NULL),
  ('Aceite Oliva 500ml', '8001480206010', 4500, 3200, 20, NULL),
  ('Café Volio 250g', '7441001300012', 2800, 2000, 35, NULL),
  ('Papel Higiénico 4pk', '7501055300846', 3500, 2500, 45, NULL);
```

---

## ✅ Checklist Final

Antes de continuar, verifica:

- [x] Proyecto Supabase creado
- [x] 7 tablas visibles en Table Editor
- [x] .env.local configurado con URL y key
- [x] Usuario ADMIN creado
- [x] RLS policies activas
- [x] Login funciona desde la app

**Si todo está ✅ → Continuar con [PASOS_FINALES.md](PASOS_FINALES.md)**

---

## 🚀 Siguiente Paso

Ahora ejecuta el setup automatizado:

```bash
# Darle permisos de ejecución (solo la primera vez)
chmod +x setup-final.sh

# Ejecutar setup completo
./setup-final.sh
```

Esto instalará dependencias, migrará passwords a bcrypt, y verificará que todo funcione.

---

**Tiempo total:** ~10 minutos
**Dificultad:** Baja (copy-paste)
**Costo:** $0 (plan Free)

🎉 **¡Supabase listo para operar!**

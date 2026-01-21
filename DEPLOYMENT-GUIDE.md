# 🚀 Guía de Deployment a Vercel

## Pre-requisitos

- [x] Cuenta en [Vercel](https://vercel.com) (gratuita)
- [x] Proyecto funcionando localmente (`npm run dev`)
- [x] Variables de entorno configuradas en `.env.local`
- [x] Git repository (opcional pero recomendado)

---

## Opción 1: Deploy con Vercel CLI (Recomendado)

### 1. Instalar Vercel CLI

```bash
npm i -g vercel
```

### 2. Login a Vercel

```bash
vercel login
```

Te pedirá autenticación por email o GitHub.

### 3. Deploy al Proyecto

```bash
# Desde el directorio del proyecto
cd /Users/mac/Documents/mis-proyectos/sabrosita-v3

# Deploy a preview (staging)
vercel

# Seguir los prompts:
# - Set up and deploy? [Y/n]: Y
# - Which scope? [tu cuenta]
# - Link to existing project? [N]
# - What's your project's name? sabrosita-pos
# - In which directory is your code located? ./
```

### 4. Configurar Variables de Entorno

Durante el primer deploy, Vercel te preguntará por las variables de entorno. También puedes configurarlas después:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
# Pegar el valor cuando te lo pida

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
# Pegar el valor

vercel env add NEXT_PUBLIC_ENABLE_PWA
# Valor: true
```

O agregar todas las variables desde archivo:

```bash
vercel env pull .env.vercel
# Editar .env.vercel con tus valores
vercel env add < .env.vercel
```

### 5. Deploy a Producción

```bash
vercel --prod
```

Tu app estará disponible en: `https://sabrosita-pos.vercel.app`

---

## Opción 2: Deploy desde GitHub (Automático)

### 1. Crear Repositorio en GitHub

```bash
git init
git add .
git commit -m "Initial commit - Admin Web PWA"
git branch -M main
git remote add origin https://github.com/tu-usuario/sabrosita-pos.git
git push -u origin main
```

### 2. Importar en Vercel Dashboard

1. Ir a [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Seleccionar tu repo de GitHub
4. Configurar:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 3. Agregar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables:

| Key | Value | Environment |
|-----|-------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJxxx...` | Production, Preview, Development |
| `NEXT_PUBLIC_ENABLE_PWA` | `true` | Production, Preview, Development |

### 4. Deploy

Click "Deploy". Vercel automáticamente:
- Instalará dependencias
- Ejecutará build
- Desplegará a CDN global

**Auto-Deploy**: Cada push a `main` desplegará automáticamente.

---

## Verificación Post-Deployment

### 1. Verificar Build Success

En Vercel Dashboard → Deployments:
- ✅ Status: Ready
- ✅ Build time: ~2-3 minutos
- ✅ No errores en logs

### 2. Probar URLs

**Admin Web:**
```
https://tu-app.vercel.app/admin-web/login
https://tu-app.vercel.app/admin-web/dashboard
https://tu-app.vercel.app/admin-web/products
```

**POS:**
```
https://tu-app.vercel.app/login
https://tu-app.vercel.app/pos
```

### 3. Verificar PWA

1. Abrir Admin Web en Chrome/Edge
2. Buscar ícono de "Instalar" en barra de direcciones
3. Instalar como app
4. Probar offline (desconectar internet, verificar que cache funcione)

### 4. Probar Realtime Sync

1. Login en Admin Web (desde Vercel URL)
2. Actualizar precio de un producto
3. Verificar en POS local que se sincroniza
4. Crear venta en POS
5. Verificar que dashboard Admin actualice métricas

---

## Configuración de Dominio Personalizado (Opcional)

### 1. Agregar Dominio en Vercel

1. Vercel Dashboard → Settings → Domains
2. Click "Add Domain"
3. Ingresar tu dominio: `admin.tusitio.com`
4. Seguir instrucciones de configuración DNS

### 2. Configurar DNS

Agregar registros en tu proveedor de DNS:

**Opción A: CNAME (Subdominios)**
```
Type:  CNAME
Name:  admin
Value: cname.vercel-dns.com
```

**Opción B: A Record (Dominio raíz)**
```
Type:  A
Name:  @
Value: 76.76.21.21
```

### 3. Verificar SSL

Vercel automáticamente provee certificado SSL (Let's Encrypt).
Esperar 1-2 minutos para propagación.

---

## Configuración de Supabase para Producción

### Habilitar Realtime para Producción

1. Ir a [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleccionar tu proyecto
3. Database → Replication
4. Habilitar Realtime para:
   - [x] `products`
   - [x] `sales`
   - [x] `system_config`
   - [x] `customers`
   - [x] `cash_registers`

### Configurar RLS Policies

Verificar que las políticas de seguridad estén activas:

```sql
-- Ver políticas existentes
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

Si faltan políticas, ejecutar desde Supabase SQL Editor:

```sql
-- Productos: Todos pueden leer, autenticados pueden escribir
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read products"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can modify products"
  ON products FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- System Config: Todos pueden leer, autenticados pueden actualizar
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read system config"
  ON system_config FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can update system config"
  ON system_config FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

---

## Monitoring y Mantenimiento

### Analytics en Vercel

1. Vercel Dashboard → Analytics
2. Monitorear:
   - Page views
   - Visitors
   - Top pages
   - Performance metrics

### Logs

Ver logs en tiempo real:

```bash
vercel logs sabrosita-pos --follow
```

O desde Vercel Dashboard → Deployments → [tu deploy] → Logs

### Performance

Vercel incluye:
- ✅ **CDN Global**: Edge network en +70 ubicaciones
- ✅ **Automatic HTTPS**: SSL incluido
- ✅ **Compression**: Gzip/Brotli automático
- ✅ **Image Optimization**: Next.js Image component optimizado
- ✅ **Caching**: Caching inteligente de assets estáticos

---

## Rollback (En caso de problemas)

### Volver a deployment anterior

```bash
# Ver deployments
vercel ls sabrosita-pos

# Promover un deployment anterior a producción
vercel promote <deployment-url> --scope=tu-cuenta
```

O desde Vercel Dashboard:
1. Deployments → [deployment anterior]
2. Click botón "Promote to Production"

---

## Costos y Límites

### Vercel - Plan Hobby (Gratuito)

| Recurso | Límite |
|---------|--------|
| **Deployments** | Ilimitados |
| **Bandwidth** | 100 GB/mes |
| **Invocations** | 100,000/mes |
| **Build Time** | 100 horas/mes |
| **Domains** | Ilimitados |
| **SSL** | Incluido |

Para más tráfico → Upgrade a plan Pro ($20/mes/usuario)

### Supabase - Plan Free

| Recurso | Límite |
|---------|--------|
| **Database** | 500 MB |
| **Storage** | 1 GB |
| **Bandwidth** | 5 GB/mes |
| **Realtime Connections** | 200 simultáneas |
| **API Requests** | Sin límite |

Para más recursos → Upgrade a plan Pro ($25/mes)

---

## Troubleshooting

### Build falla con "Module not found"

**Solución**: Verificar que todas las dependencias estén en `package.json`:

```bash
npm install --save-dev typescript @types/react @types/node
npm install
vercel --prod
```

### "TypeError: Cannot read property 'supabase' of undefined"

**Causa**: Variables de entorno no configuradas
**Solución**:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### PWA no se instala en producción

**Causa**: Service Worker no registrado en HTTPS
**Solución**: Verificar que `NEXT_PUBLIC_ENABLE_PWA=true` en Vercel

### Realtime sync no funciona en producción

**Causa**: Realtime no habilitado en Supabase para producción
**Solución**: Supabase Dashboard → Database → Replication → Habilitar tablas

---

## Checklist Final

Antes de considerar el deployment completo:

- [ ] Build exitoso sin errores
- [ ] Admin Web accesible en `/admin-web/login`
- [ ] Login funciona con usuarios admin
- [ ] Dashboard muestra métricas en tiempo real
- [ ] Productos se pueden editar y sincronizan con POS
- [ ] Configuración (tipo de cambio) se guarda correctamente
- [ ] Reportes se generan y exportan a CSV
- [ ] PWA instalable desde navegador
- [ ] SSL activo (HTTPS)
- [ ] Dominio personalizado configurado (si aplica)
- [ ] Logs sin errores críticos
- [ ] Performance aceptable (< 3s load time)

---

## Recursos Adicionales

- [Vercel Docs](https://vercel.com/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Supabase Realtime](https://supabase.com/docs/guides/realtime)
- [PWA Checklist](https://web.dev/pwa-checklist/)

---

## Soporte

Para problemas de deployment:
- Vercel Discord: [vercel.com/discord](https://vercel.com/discord)
- Vercel Support: [vercel.com/support](https://vercel.com/support)
- Supabase Discord: [supabase.com/discord](https://supabase.com/discord)

---

**¡Listo para producción!** 🚀

Tu Admin Web PWA está preparado para deployment. Sigue esta guía paso a paso y tendrás tu aplicación en producción en menos de 10 minutos.

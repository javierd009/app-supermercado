# ⚠️ Notas Importantes - Sabrosita POS

Información crítica antes de usar el sistema en producción.

---

## 🔴 Crítico

### 1. Ícono de Aplicación (Pendiente)

**Ubicación esperada:** `electron/icon.ico`

**Estado:** No existe actualmente

**Solución temporal:**
```bash
# Opción A: Comentar referencia en package.json
# Editar package.json línea 66:
# "icon": "electron/icon.ico"  →  COMENTAR

# Opción B: Crear ícono placeholder
# Usar herramienta online: https://icoconvert.com/
# Dimensiones: 256x256 px
# Formato: .ico
# Guardar en: electron/icon.ico
```

**Solución definitiva:**
1. Diseñar logo profesional (256x256 px)
2. Convertir a .ico
3. Guardar en `electron/icon.ico`
4. Rebuild: `npm run build:electron`

---

### 2. Seguridad de Passwords ✅ IMPLEMENTADO

**Estado Actual:** Passwords hasheados con bcrypt

**✅ COMPLETADO:**
- bcrypt agregado a package.json
- authService.ts actualizado con bcrypt.compare() y bcrypt.hash()
- Nuevos usuarios se crean con hash automático
- Login verifica contraseñas hasheadas

**Próximo paso - Migrar passwords existentes:**
```bash
# Instalar dependencias
npm install

# Ejecutar script de migración UNA VEZ
export $(cat .env.local | xargs)
node scripts/migrate-passwords.js
```

**Nota:** El código tiene fallback temporal para passwords legacy (texto plano) durante la migración. Eliminar este fallback después de ejecutar el script.

---

### 3. Variables de Entorno

**⚠️ NUNCA** commitear `.env.local` con credenciales reales

**Archivo:** `.env.local`
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

**Git ignore:** Ya está en `.gitignore`

---

## 🟡 Importante

### 4. Puerto del Servidor

**Actual:** Auto-detección entre 3000-3006

**Si falla:**
```bash
# Matar proceso en puerto 3000
lsof -i :3000
kill -9 <PID>

# O usar puerto específico
PORT=3001 npm run dev
```

---

### 5. Impresión en Desarrollo

**Modo desarrollo:**
- Tickets se guardan en `/tmp/ticket-[timestamp].txt`
- Preview en consola (primeros 500 caracteres)
- NO se envía a impresora

**Modo producción:**
- Se envía a impresora predeterminada
- Silencioso (sin diálogo)

**Cambiar comportamiento:**
```javascript
// electron/main.js línea 71
if (isDev) { ... }  // Cambiar a: if (false) { ... }
```

---

### 6. Stock Inicial

**Después de importar CSV:**

Si productos no tienen stock correcto:
```sql
-- Ejecutar en Supabase SQL Editor
UPDATE products
SET stock = 100
WHERE stock = 0;
```

O ajustar manualmente en UI de Productos.

---

### 7. Multi-Ventana Solo en Electron

**Comportamiento:**
- Electron: Abre nueva ventana nativa BrowserWindow
- Web: Abre nueva pestaña del navegador

**No soportado en modo web:**
- Estado independiente por ventana
- IPC entre ventanas

---

## 🟢 Opcional

### 8. Configuración de Scanner

**Velocidad de escaneo:**

Si scanner se detecta como "Teclado" en vez de "Scanner":

1. Consultar manual del scanner
2. Buscar configuración "Scan Speed" o "Key Delay"
3. Configurar para modo "Fast" o "High Speed"
4. Verificar que envía "Enter" al final

**Código de configuración común (Honeywell):**
```
Escanear código: "Add Suffix CR"
```

---

### 9. Tamaño de Papel Térmico

**Configuración actual:** 40 caracteres de ancho (58mm)

**Cambiar a 80mm:**
```typescript
// src/features/printing/services/ticketFormatter.ts
constructor(config?: Partial<PrinterConfig>) {
  this.config = {
    width: 48,  // Cambiar de 40 a 48 para 80mm
    // ...
  };
}
```

---

### 10. Logs y Debugging

**Electron Console:**
```bash
# En desarrollo
npm run dev:electron
# Presionar Ctrl+Shift+I para DevTools
```

**Next.js Console:**
```bash
# Browser DevTools
F12 → Console
```

**Archivos de Log:**
```
Windows: %APPDATA%/sabrosita-pos/logs/
Mac: ~/Library/Application Support/sabrosita-pos/logs/
Linux: ~/.config/sabrosita-pos/logs/
```

---

### 11. RLS (Row Level Security) Policies

**Verificar en Supabase:**

Dashboard → Authentication → Policies

Cada tabla debe tener:
- SELECT para roles específicos
- INSERT para admins
- UPDATE para admins
- DELETE solo super_admins

**Si hay errores de permisos:**
```sql
-- Ejecutar en SQL Editor
-- Ver políticas existentes
SELECT * FROM pg_policies WHERE tablename = 'sales';
```

---

### 12. Actualización de Versión

**Cambiar versión:**
```json
// package.json
{
  "version": "1.0.1",  // Incrementar
  // ...
}
```

**Nomenclatura:**
- 1.0.0 → Primera versión estable
- 1.0.1 → Bug fix
- 1.1.0 → Nueva feature
- 2.0.0 → Breaking changes

---

## 📝 Checklist Pre-Producción

Antes de deployment final:

### Código
- [x] Implementar bcrypt para passwords - ✅ HECHO
- [ ] Ejecutar script migración de passwords existentes
- [ ] Crear ícono profesional
- [ ] Verificar `.env.local` no está en repo
- [ ] Eliminar `console.log` innecesarios
- [ ] Comentarios TODO completados o documentados

### Base de Datos
- [ ] Migraciones ejecutadas
- [ ] RLS policies activadas
- [ ] Usuario ADMIN creado
- [ ] Backup configurado

### Hardware
- [ ] Scanner probado y detectado
- [ ] Impresora configurada
- [ ] Papel térmico cargado

### Testing
- [ ] Venta completa OK
- [ ] Impresión ticket OK
- [ ] Actualización stock OK
- [ ] Apertura/cierre caja OK
- [ ] Multi-ventana OK (si aplica)

### Documentación
- [ ] README.md actualizado
- [ ] Info del negocio en tickets
- [ ] Credenciales guardadas
- [ ] Manual de usuario entregado

---

## 🆘 Contactos de Emergencia

### Desarrollador
- **Nombre:** [A completar]
- **Email:** [A completar]
- **Teléfono:** [A completar]

### Supabase Support
- Dashboard: https://supabase.com/dashboard
- Docs: https://supabase.com/docs
- Community: https://github.com/supabase/supabase/discussions

### Hardware
- **Scanner:** [Modelo y proveedor]
- **Impresora:** [Modelo y proveedor]
- **Soporte técnico:** [Teléfono]

---

## 📅 Historial de Cambios

### v1.0.0 (2026-01-17)
- ✅ Release inicial MVP
- ✅ Todas las features core implementadas
- ✅ Bcrypt implementado para passwords
- ⚠️ Pendiente: Migrar passwords existentes
- ⚠️ Falta ícono de app

### v1.0.1 (Planeado)
- [ ] Ícono profesional
- [ ] Reportes básicos
- [ ] Exportar a Excel

---

**Última actualización:** 2026-01-16
**Responsable:** Claude Sonnet 4.5

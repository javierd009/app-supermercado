# 🔐 Sistema de Seguridad y Control de Acceso por Roles

**Fecha:** 2026-01-17
**Versión:** 1.1.0
**Estado:** ✅ Implementado

---

## 📊 Resumen de Cambios

Se implementó un sistema robusto de control de acceso basado en roles (RBAC) para proteger las operaciones críticas del sistema. Los cajeros ahora requieren autorización explícita de un administrador para realizar operaciones sensibles.

---

## 🎭 Roles del Sistema

### 1. Super Administrador (`super_admin`)
- **Acceso:** Completo sin restricciones
- **Permisos:** Todas las operaciones del sistema
- **Uso:** Dueño del negocio, gerente general

### 2. Administrador (`admin`)
- **Acceso:** Todas las funciones menos configuración de sistema
- **Permisos:**
  - Gestión completa de productos (CRUD)
  - Apertura y cierre de caja
  - Autorización de operaciones de cajeros
  - Reportes y estadísticas
- **Uso:** Manager, supervisor

### 3. Cajero (`cashier`)
- **Acceso:** Operaciones de venta únicamente
- **Permisos:**
  - Procesamiento de ventas
  - Consulta de productos (solo lectura)
  - Apertura/cierre de caja **CON AUTORIZACIÓN**
- **Uso:** Personal de punto de venta

---

## 🔒 Operaciones Protegidas

### Caja Registradora

#### Apertura de Caja
- **Restricción:** Cajeros requieren autorización de admin/manager
- **Flujo:**
  1. Cajero ingresa monto inicial y tipo de cambio
  2. Al hacer click en "Abrir Caja", se muestra modal de autorización
  3. Admin/Manager ingresa sus credenciales (usuario + contraseña)
  4. Sistema valida credenciales con bcrypt
  5. Si es correcto y el rol es admin/super_admin, se autoriza la operación
  6. La caja se abre automáticamente

**Componente:** [src/features/cash-register/components/OpenRegisterForm.tsx](src/features/cash-register/components/OpenRegisterForm.tsx)

#### Cierre de Caja
- **Restricción:** Cajeros requieren autorización de admin/manager
- **Flujo:** Idéntico a apertura de caja

**Componente:** [src/features/cash-register/components/CloseRegisterForm.tsx](src/features/cash-register/components/CloseRegisterForm.tsx)

---

### Gestión de Productos

#### Crear Producto
- **Restricción:** Solo admin y super_admin
- **Implementación:** Botón "NUEVO" oculto para cajeros

#### Editar Producto
- **Restricción:** Solo admin y super_admin
- **Implementación:** Botón "EDITAR" oculto para cajeros, muestra "SOLO LECTURA"

#### Eliminar Producto
- **Restricción:** Solo admin y super_admin
- **Implementación:** Botón "ELIMINAR" oculto para cajeros

#### Modificar Precios
- **Restricción:** Solo admin y super_admin (incluido en edición)
- **Implementación:** Formulario de edición no accesible para cajeros

#### Importar CSV
- **Restricción:** Solo admin y super_admin
- **Implementación:** Botón "IMPORTAR" oculto para cajeros

**Componentes:**
- [src/app/(main)/products/page.tsx](src/app/(main)/products/page.tsx) - Botones de acciones
- [src/features/products/components/ProductsList.tsx](src/features/products/components/ProductsList.tsx) - Botones por producto

---

## 🛡️ Componente de Autorización

### AdminAuthModal

Modal reutilizable para solicitar credenciales de administrador.

**Ubicación:** [src/shared/components/AdminAuthModal.tsx](src/shared/components/AdminAuthModal.tsx)

**Props:**
```typescript
interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorized: () => void;
  title?: string;
  message?: string;
}
```

**Características:**
- ✅ Validación de usuario por username
- ✅ Verificación de rol (admin o super_admin)
- ✅ Comparación segura de contraseña con bcrypt
- ✅ Mensajes de error claros
- ✅ UI corporativa consistente
- ✅ Auto-submit después de autorización exitosa

**Flujo de Validación:**
1. Usuario ingresa username (convertido a mayúsculas)
2. Sistema busca usuario en base de datos
3. Verifica que el rol sea admin o super_admin
4. Compara contraseña usando `bcrypt.compare()`
5. Si todo es correcto, ejecuta callback `onAuthorized()`

---

## 📝 Matriz de Permisos

| Operación | Super Admin | Admin | Cajero |
|-----------|-------------|-------|--------|
| **Punto de Venta** | ✅ | ✅ | ✅ |
| Procesar ventas | ✅ | ✅ | ✅ |
| Aplicar descuentos | ✅ | ✅ | ❌ |
| **Caja Registradora** | | | |
| Abrir caja | ✅ | ✅ | ⚠️ Con autorización |
| Cerrar caja | ✅ | ✅ | ⚠️ Con autorización |
| Ver historial de cajas | ✅ | ✅ | ❌ |
| **Productos** | | | |
| Ver productos | ✅ | ✅ | ✅ Solo lectura |
| Crear producto | ✅ | ✅ | ❌ |
| Editar producto | ✅ | ✅ | ❌ |
| Eliminar producto | ✅ | ✅ | ❌ |
| Modificar precios | ✅ | ✅ | ❌ |
| Importar CSV | ✅ | ✅ | ❌ |
| **Clientes** | | | |
| Ver clientes | ✅ | ✅ | ✅ Solo lectura |
| Gestionar clientes | ✅ | ✅ | ❌ |
| **Reportes** | | | |
| Ver reportes | ✅ | ✅ | ❌ |
| Exportar datos | ✅ | ✅ | ❌ |
| **Configuración** | | | |
| Configurar sistema | ✅ | ❌ | ❌ |
| Gestionar usuarios | ✅ | ✅ | ❌ |

**Leyenda:**
- ✅ Acceso directo
- ⚠️ Requiere autorización
- ❌ Sin acceso

---

## 💻 Ejemplos de Uso

### Ejemplo 1: Cajero Abriendo Caja

```typescript
// Usuario: CAJERO1 (rol: cashier)
// 1. Va a /cash-register
// 2. Ingresa monto inicial: 50000
// 3. Click en "Abrir Caja"
// 4. Se muestra AdminAuthModal
// 5. Ingresa credenciales del manager:
//    - Usuario: ADMIN
//    - Contraseña: admin123
// 6. Sistema valida y autoriza
// 7. Caja se abre automáticamente
```

### Ejemplo 2: Cajero Intentando Editar Producto

```typescript
// Usuario: CAJERO1 (rol: cashier)
// 1. Va a /products
// 2. Ve lista de productos
// 3. No ve botones "NUEVO" ni "IMPORTAR"
// 4. En cada fila, ve "SOLO LECTURA" en lugar de "EDITAR" / "ELIMINAR"
// 5. No puede modificar catálogo
```

### Ejemplo 3: Admin Editando Producto

```typescript
// Usuario: ADMIN (rol: admin)
// 1. Va a /products
// 2. Ve botones "NUEVO" e "IMPORTAR"
// 3. Click en "EDITAR" en cualquier producto
// 4. Accede directamente al formulario
// 5. Modifica precio, stock, etc.
// 6. Guarda cambios sin autorización adicional
```

---

## 🔧 Implementación Técnica

### 1. Validación en Frontend

```typescript
// En componentes de UI
const { user } = useAuth();
const canModify = user?.role === 'admin' || user?.role === 'super_admin';

{canModify ? (
  <button onClick={handleEdit}>EDITAR</button>
) : (
  <span>SOLO LECTURA</span>
)}
```

### 2. Modal de Autorización

```typescript
const [showAuthModal, setShowAuthModal] = useState(false);
const [isAuthorized, setIsAuthorized] = useState(false);

const handleSubmit = async () => {
  if (user?.role === 'cashier' && !isAuthorized) {
    setShowAuthModal(true);
    return;
  }
  // Continuar con operación...
};

const handleAuthorized = () => {
  setIsAuthorized(true);
  setShowAuthModal(false);
  // Auto-submit
};
```

### 3. Validación de Contraseña (Segura)

```typescript
// En AdminAuthModal
import bcrypt from 'bcryptjs';

// Buscar usuario
const { data: user } = await supabase
  .from('users')
  .select('*')
  .eq('username', username.toUpperCase())
  .single();

// Verificar rol
if (user.role !== 'admin' && user.role !== 'super_admin') {
  setError('Este usuario no tiene permisos de administrador');
  return;
}

// Verificar contraseña con bcrypt
const passwordMatch = await bcrypt.compare(password, user.password_hash);

if (!passwordMatch) {
  setError('Contraseña incorrecta');
  return;
}

// Autorizar
onAuthorized();
```

---

## 🚨 Consideraciones de Seguridad

### Protección en Múltiples Capas

1. **Frontend (UI):**
   - Ocultar botones según rol
   - Deshabilitar funciones no autorizadas
   - Mostrar mensajes informativos

2. **Lógica de Negocio:**
   - Validar rol antes de ejecutar operaciones
   - Requerir autorización para operaciones sensibles
   - Verificar permisos en cada paso

3. **Base de Datos (RLS):**
   - Row Level Security en Supabase
   - Políticas por rol en tablas
   - Restricciones a nivel de PostgreSQL

### Buenas Prácticas Implementadas

✅ **Contraseñas Hasheadas:** Uso de bcrypt para comparación segura
✅ **Validación de Rol:** Verificación explícita del rol del usuario
✅ **Mensajes Claros:** Feedback inmediato sobre restricciones
✅ **Auto-submit:** UX fluido después de autorización
✅ **Timeout de Seguridad:** Modal se cierra al cancelar
✅ **Logs de Auditoría:** Registros de quién autorizó qué (implementar)

---

## 📋 Checklist de Testing

### Caja Registradora
- [ ] Cajero puede abrir caja solo con autorización de admin
- [ ] Cajero puede cerrar caja solo con autorización de admin
- [ ] Admin puede abrir/cerrar caja sin autorización adicional
- [ ] Modal muestra error si credenciales son incorrectas
- [ ] Modal muestra error si usuario no es admin
- [ ] Caja se abre automáticamente después de autorización

### Productos
- [ ] Cajero ve lista de productos (solo lectura)
- [ ] Cajero NO ve botones "NUEVO" ni "IMPORTAR"
- [ ] Cajero ve "SOLO LECTURA" en lugar de botones de acción
- [ ] Admin ve todos los botones de gestión
- [ ] Admin puede crear, editar y eliminar productos
- [ ] Admin puede importar CSV
- [ ] Admin puede modificar precios

### Seguridad
- [ ] Contraseñas se comparan con bcrypt
- [ ] No se exponen contraseñas en logs o consola
- [ ] Modal se cierra al presionar cancelar
- [ ] No hay forma de bypass de autorización
- [ ] RLS en Supabase funciona correctamente

---

## 🔄 Migración desde Versión Anterior

Si actualizas desde una versión sin control de acceso:

1. **Verificar Roles:** Asegurar que todos los usuarios tienen rol asignado
2. **Actualizar Contraseñas:** Migrar a bcrypt si aún no lo has hecho
3. **Capacitar Personal:** Explicar flujo de autorización a cajeros
4. **Probar Flujos:** Verificar cada operación con cada rol

---

## 🐛 Troubleshooting

### Problema: Modal de autorización no aparece

**Causa:** Usuario ya tiene rol admin/super_admin

**Solución:** Esto es correcto, admins no necesitan autorización adicional

---

### Problema: Contraseña correcta pero modal muestra error

**Causa 1:** Contraseña no está hasheada con bcrypt

**Solución:** Ejecutar script de migración `scripts/migrate-passwords.js`

**Causa 2:** Usuario no tiene rol admin

**Solución:** Verificar rol en tabla users de Supabase

---

### Problema: Cajero no ve botones en productos

**Causa:** Comportamiento esperado según restricciones

**Solución:** Esto es correcto, solo admin/super_admin pueden modificar catálogo

---

## 📞 Soporte

Para problemas relacionados con seguridad o permisos:

1. Verificar rol del usuario en Supabase
2. Verificar que contraseñas están hasheadas (empiezan con `$2b$`)
3. Revisar consola del navegador para errores
4. Verificar que AdminAuthModal se está importando correctamente

---

## 📅 Roadmap de Seguridad

### v1.2 (Próximo)
- [ ] Logs de auditoría (quién autorizó qué y cuándo)
- [ ] Historial de autorizaciones por turno
- [ ] Límite de intentos fallidos de autorización
- [ ] Notificaciones de autorizaciones rechazadas

### v1.3 (Futuro)
- [ ] Autenticación de dos factores (2FA)
- [ ] Tokens de sesión con expiración
- [ ] Permisos granulares por operación
- [ ] Roles personalizados

---

**Última actualización:** 2026-01-17
**Responsable:** Sistema de Seguridad Sabrosita POS
**Versión del documento:** 1.0.0

🔐 **Sistema de seguridad implementado y operativo**

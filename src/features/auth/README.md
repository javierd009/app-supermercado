# 🔐 Feature: Autenticación

Sistema de autenticación simple con código alfanumérico, inspirado en la simplicidad de Mónica 8.5.

---

## 📁 Estructura

```
auth/
├── components/
│   ├── LoginForm.tsx         # Formulario de login
│   ├── ProtectedRoute.tsx    # Componente para proteger rutas
│   ├── UserMenu.tsx          # Menú de usuario (logout)
│   └── index.ts
├── hooks/
│   └── useAuth.ts            # Hooks de autenticación
├── services/
│   └── authService.ts        # Servicio de autenticación (Supabase)
├── store/
│   └── authStore.ts          # Estado global con Zustand
├── types/
│   └── index.ts              # Tipos TypeScript
└── README.md                 # Este archivo
```

---

## 🚀 Uso

### Login

```tsx
import { LoginForm } from '@/features/auth/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <LoginForm />
    </div>
  );
}
```

### Proteger Rutas

```tsx
import { ProtectedRoute } from '@/features/auth/components/ProtectedRoute';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="cashier">
      {children}
    </ProtectedRoute>
  );
}
```

### Hooks en Componentes

```tsx
'use client';

import { useAuth, useLogin, useLogout } from '@/features/auth/hooks/useAuth';

export function MyComponent() {
  const { user, userRole, isAuthenticated } = useAuth();
  const { login } = useLogin();
  const { logout } = useLogout();

  const handleLogin = async () => {
    const result = await login({ username: 'MARIA_01', password: '1234' });
    if (result.success) {
      // Login exitoso
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Hola, {user?.username}</p>
      ) : (
        <button onClick={handleLogin}>Iniciar Sesión</button>
      )}
    </div>
  );
}
```

### Verificar Permisos

```tsx
import { usePermission, useHasRole } from '@/features/auth/hooks/useAuth';

export function AdminPanel() {
  const canCreateUsers = usePermission('users:create');
  const isAdmin = useHasRole('admin');

  if (!isAdmin) {
    return <p>Acceso denegado</p>;
  }

  return (
    <div>
      {canCreateUsers && <button>Crear Usuario</button>}
    </div>
  );
}
```

---

## 🔑 Sistema de Roles

### Roles Disponibles

| Rol | Descripción | Permisos |
|-----|-------------|----------|
| `super_admin` | Propietario del negocio | Acceso total (crear usuarios, configuración) |
| `admin` | Encargado/Supervisor | Gestión completa excepto crear usuarios |
| `cashier` | Cajero | Solo registrar ventas y consultar productos |

### Jerarquía de Roles

```
super_admin (nivel 3)
    ↓
admin (nivel 2)
    ↓
cashier (nivel 1)
```

Un usuario con rol superior puede acceder a todas las funciones de roles inferiores.

---

## 🔒 Seguridad

### Autenticación

- **Username**: Código alfanumérico único (ej: `MARIA_01`, `ADMIN`)
- **Password**: Contraseña simple para MVP (temporal)
- **Sesión**: Almacenada en `localStorage` con expiración de 8 horas
- **Token**: Generado al iniciar sesión

### TODO: Producción

Para producción, implementar:
- [ ] Bcrypt para hash de contraseñas
- [ ] JWT para tokens seguros
- [ ] Refresh tokens
- [ ] Rate limiting en login
- [ ] Auditoría de accesos

---

## 📊 Flujo de Autenticación

```
1. Usuario ingresa código y contraseña
   ↓
2. authService.login() consulta tabla users en Supabase
   ↓
3. Verifica contraseña (temporal: comparación directa)
   ↓
4. Genera sesión con token y expiración
   ↓
5. authStore.setSession() guarda en estado y localStorage
   ↓
6. Redirige a /dashboard
```

---

## 🗄️ Persistencia

La sesión se guarda en `localStorage` con la clave `sabrosita-auth-storage`.

Estructura:
```json
{
  "state": {
    "session": {
      "user": {
        "id": "uuid",
        "username": "MARIA_01",
        "role": "cashier"
      },
      "token": "abc123",
      "expiresAt": 1234567890
    },
    "isAuthenticated": true
  },
  "version": 0
}
```

---

## 🧪 Testing

### Usuario de Prueba

- **Username**: `ADMIN`
- **Password**: `admin123`
- **Rol**: `super_admin`

### Crear Nuevos Usuarios

Desde SQL Editor de Supabase:

```sql
INSERT INTO users (username, password_hash, role) VALUES
  ('MARIA_01', '1234', 'cashier'),
  ('PEDRO_02', '5678', 'admin');
```

⚠️ En producción, usar bcrypt para hashear las contraseñas.

---

## 🔄 Próximos Pasos

- [ ] Implementar bcrypt para contraseñas
- [ ] Agregar validación de fortaleza de contraseña
- [ ] Implementar "Olvidé mi contraseña"
- [ ] Agregar autenticación de dos factores (2FA)
- [ ] Panel de administración de usuarios
- [ ] Registro de auditoría de accesos

---

*Feature completada: 2026-01-16*

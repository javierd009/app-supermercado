# 📦 Sincronización en Electron - Arquitectura Híbrida

## ❓ ¿Necesita sincronización en Electron?

**Respuesta: SÍ** ✅

## ¿Por Qué SÍ Necesita Sincronización?

### Electron = Modo Híbrido (SQLite Local + Supabase Nube)

En la versión de Electron de Sabrosita POS:

1. **Base de datos principal:** SQLite local en tu computadora (funcionamiento offline)
2. **Backup en la nube:** Supabase PostgreSQL para respaldo automático
3. **Administración remota:** El administrador puede modificar productos/precios desde cualquier lugar
4. **Sincronización bidireccional:** Los cambios locales se suben a la nube y los cambios remotos se descargan automáticamente

### Comparación: Web vs Electron

| Característica | Web (Supabase) | Electron (Híbrido) |
|----------------|----------------|-------------------|
| Base de datos principal | ☁️ PostgreSQL en la nube | 💾 SQLite local |
| Backup | ☁️ En el servidor | ☁️ Automático en Supabase |
| Requiere internet | ✅ Sí (siempre) | ⚡ No (offline-first) |
| Sincronización | ✅ Necesaria (offline → online) | ✅ Bidireccional (local ↔ nube) |
| Administración remota | ✅ Directa en Supabase | ✅ Supabase → SQLite (auto-sync) |

## 🔄 ¿Cómo Funciona la Sincronización Bidireccional?

### Flujo de Guardado Local → Nube (Backup Automático)

Cuando haces una operación en Electron (venta, agregar producto, etc.):

1. **Se guarda inmediatamente** en SQLite local
2. **Se agrega a la cola de sincronización**
3. **Disponible al instante** para todas las pantallas locales
4. **Auto-sincronización cada 5 minutos** → Sube cambios a Supabase
5. **Backup en la nube** ✅

### Flujo de Cambios Remotos → Local (Administración Remota)

Cuando el administrador modifica algo desde Supabase:

1. **Administrador cambia precio/producto** en Supabase (desde cualquier lugar)
2. **Auto-sincronización cada 5 minutos** → Descarga cambios a SQLite local
3. **Cambios disponibles en Electron** automáticamente
4. **Sistema actualizado** sin intervención manual ✅

### Ejemplo Visual: Crear una Venta

```
Usuario crea venta en Electron
   ↓
SQLite guarda inmediatamente (disponible al instante)
   ↓
Se agrega a cola de sincronización
   ↓
Cada 5 minutos: Auto-sync sube a Supabase
   ↓
✅ Backup en la nube completado
```

### Ejemplo Visual: Administrador Cambia Precio Remoto

```
Admin cambia precio en Supabase (desde casa)
   ↓
Cada 5 minutos: Auto-sync descarga cambios
   ↓
SQLite local se actualiza
   ↓
✅ Precio actualizado en Electron automáticamente
```

## 💾 ¿Dónde Están los Datos?

### Base de Datos Local (SQLite)

Los datos locales de Electron se guardan en:

```
/Users/tu-usuario/Library/Application Support/sabrosita-pos/database.db
```

(En Windows: `C:\Users\TuUsuario\AppData\Roaming\sabrosita-pos\database.db`)

### Base de Datos en la Nube (Supabase)

Los datos se sincronizan automáticamente a Supabase PostgreSQL cada 5 minutos.

## 🛡️ Backup Automático y Manual

### Backup Automático (Recomendado) ✅

La sincronización automática a Supabase funciona como backup:

1. **Cada 5 minutos** se suben los cambios locales a Supabase
2. **Backup en la nube** siempre actualizado
3. **Sin intervención manual** necesaria
4. **Accesible desde cualquier lugar** vía Supabase Dashboard

### Backup Manual (Adicional)

Si deseas un backup local adicional:

1. **Cierra la aplicación** completamente
2. **Copia el archivo** `database.db` a una ubicación segura (USB, nube, etc.)
3. **Para restaurar:** Reemplaza el archivo `database.db` con tu copia de backup

## ✅ Sistema de Sincronización Implementado

### Características Principales:

1. **Sincronización Bidireccional**:
   - 📤 SQLite → Supabase (backup automático de cambios locales)
   - 📥 Supabase → SQLite (descarga de cambios remotos)

2. **Auto-Sincronización**:
   - ⏰ Cada 5 minutos automáticamente
   - 🔄 Al iniciar la aplicación
   - ✋ Botón manual "🔄 Sincronizar Ahora"

3. **Interfaz de Usuario**:
   - 📊 Cola de sincronización (Pendientes/Sincronizados/Errores)
   - ☁️ Botón "Sincronización" en esquina inferior derecha
   - ⏱️ Última sincronización con timestamp
   - ℹ️ Mensajes informativos de estado

4. **Administración Remota**:
   - El administrador puede modificar productos/precios desde Supabase
   - Los cambios se descargan automáticamente a Electron
   - Sin necesidad de estar en el local físico

## 📊 Resumen

| Pregunta | Respuesta |
|----------|-----------|
| ¿Necesito sincronizar manualmente? | ⚡ NO (auto cada 5 min), pero puedes forzarlo |
| ¿Se guarda automáticamente? | ✅ SÍ, en SQLite local inmediatamente |
| ¿Funciona sin internet? | ✅ SÍ, 100% offline-first |
| ¿Necesito servidor remoto? | ✅ SÍ, Supabase para backup y admin remota |
| ¿Cómo hago backup? | ☁️ Automático a Supabase cada 5 min |
| ¿Puedo administrar remotamente? | ✅ SÍ, cambios en Supabase se sincronizan a local |
| ¿Qué pasa si estoy offline? | 💾 Todo funciona local, se sincroniza cuando vuelva internet |

---

## 🎯 En Resumen

**Arquitectura Híbrida Offline-First:**

- 💾 **SQLite Local**: Guarda todo inmediatamente, funciona 100% offline
- ☁️ **Supabase Cloud**: Backup automático cada 5 minutos cuando hay internet
- 🔄 **Sincronización Bidireccional**:
  - Local → Nube: Tus cambios se respaldan automáticamente
  - Nube → Local: Cambios remotos del administrador se descargan automáticamente
- 🎮 **Administración Remota**: El administrador puede modificar productos/precios desde cualquier lugar
- ⚡ **Mejor de ambos mundos**: Velocidad y confiabilidad local + backup y acceso remoto en la nube

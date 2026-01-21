# 🔄 Pasos para Reiniciar la Aplicación

## Opción 1: Reinicio Completo (Recomendado)

1. **Cierra la aplicación Electron completamente**
   - Cierra todas las ventanas
   - Si está en la barra de tareas/dock, ciérrala desde ahí también

2. **Detén el servidor de desarrollo**
   - En la terminal donde corre `npm run dev:electron`
   - Presiona `Ctrl + C` para detener

3. **Reinicia todo**
   ```bash
   npm run dev:electron
   ```

## Opción 2: Hot Reload (Más Rápido)

Si la app ya está corriendo con `npm run dev:electron`:

1. **En la aplicación Electron:**
   - Presiona `Cmd + R` (Mac) o `Ctrl + R` (Windows/Linux)
   - Esto recarga la página

2. **Abre DevTools para ver logs**
   - Presiona `Cmd + Option + I` (Mac) o `Ctrl + Shift + I` (Windows/Linux)
   - Ve a la pestaña "Console"
   - Busca mensajes que empiecen con `[ConnectionMonitor]` o `[SQLiteClient]`

## ¿Qué Buscar en los Logs?

Deberías ver:
```
[ConnectionMonitor] Electron detectado - modo siempre online (SQLite local)
[SQLiteClient] isAvailable check: { hasWindow: true, hasElectronAPI: true, isElectronFlag: true }
```

Si ves estos mensajes, el sistema debería mostrar "Online" correctamente.

## Si Aún Muestra Offline

Comparte los logs de la consola que empiecen con `[ConnectionMonitor]` y `[SQLiteClient]`

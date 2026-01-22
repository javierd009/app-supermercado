# Sabrosita POS - Instalador Windows

## Requisitos Previos

1. **Windows 10/11** (64-bit)
2. **Node.js 18+** - Descarga desde: https://nodejs.org (version LTS)
3. **Git** - Descarga desde: https://git-scm.com/download/win

---

## Pasos para Generar el Instalador

### Opcion A: Automatico (Recomendado)

1. Abre **CMD** o **PowerShell**

2. Clona el repositorio:
   ```cmd
   git clone https://github.com/javierd009/sabrosita-v3.git
   cd sabrosita-v3
   ```

3. Ejecuta el script de build:
   ```cmd
   build-windows.bat
   ```

4. Espera a que termine (3-5 minutos)

5. El instalador estara en: `dist\Sabrosita POS Setup.exe`

---

### Opcion B: Manual

1. Abre **CMD** o **PowerShell**

2. Clona el repositorio:
   ```cmd
   git clone https://github.com/javierd009/sabrosita-v3.git
   cd sabrosita-v3
   ```

3. Instala dependencias:
   ```cmd
   npm install
   ```

4. Compila la aplicacion:
   ```cmd
   npm run build:electron
   ```

5. El instalador estara en: `dist\Sabrosita POS Setup.exe`

---

## Instalacion

1. Ejecuta `Sabrosita POS Setup.exe`
2. Sigue el asistente de instalacion
3. Selecciona la carpeta de instalacion (o usa la predeterminada)
4. Se creara un acceso directo en el Escritorio y Menu Inicio

---

## Primer Uso

1. Abre **Sabrosita POS** desde el acceso directo
2. Inicia sesion con tu usuario
3. Abre una caja para comenzar a vender

---

## Notas

- La aplicacion funciona **offline** (sin internet)
- Los datos se sincronizan automaticamente cuando hay conexion
- La base de datos local esta en: `%APPDATA%\sabrosita-pos\`

---

## Solucion de Problemas

### "npm no se reconoce como comando"
- Instala Node.js desde https://nodejs.org
- Reinicia la terminal despues de instalar

### "git no se reconoce como comando"
- Instala Git desde https://git-scm.com/download/win
- Reinicia la terminal despues de instalar

### Error en "npm install"
- Ejecuta como Administrador
- O intenta: `npm install --legacy-peer-deps`

### Error en "electron-builder"
- Verifica que no hay antivirus bloqueando
- Ejecuta como Administrador

---

**Version**: 1.0.0
**Fecha**: Enero 2026

@echo off
echo ============================================
echo    SABROSITA POS - Build para Windows
echo ============================================
echo.

:: Verificar Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado.
    echo.
    echo Descarga Node.js desde: https://nodejs.org
    echo Instala la version LTS (recomendada).
    echo Luego ejecuta este script de nuevo.
    pause
    exit /b 1
)

echo [OK] Node.js encontrado:
node --version
echo.

:: Instalar dependencias
echo [1/3] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Fallo la instalacion de dependencias
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas
echo.

:: Build de Next.js
echo [2/3] Compilando aplicacion Next.js...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Fallo el build de Next.js
    pause
    exit /b 1
)
echo [OK] Build de Next.js completado
echo.

:: Build de Electron
echo [3/3] Generando instalador Windows...
call npx electron-builder --win
if %errorlevel% neq 0 (
    echo [ERROR] Fallo la generacion del instalador
    pause
    exit /b 1
)
echo.

echo ============================================
echo    BUILD COMPLETADO EXITOSAMENTE
echo ============================================
echo.
echo El instalador se encuentra en la carpeta: dist\
echo Archivo: Sabrosita POS Setup.exe
echo.
echo Para instalar, ejecuta el archivo .exe
echo.
pause

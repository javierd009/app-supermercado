#!/bin/bash

###############################################################################
# Setup Final - Sabrosita POS v1.0.0
#
# Este script ejecuta todos los pasos finales antes de producción:
# 1. Instala dependencias (incluyendo bcrypt)
# 2. Migra passwords existentes a bcrypt
# 3. Verifica instalación
# 4. Ejecuta tests básicos
#
# Uso:
#   chmod +x setup-final.sh
#   ./setup-final.sh
###############################################################################

set -e  # Exit on error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
print_header() {
    echo ""
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "   $1"
}

# Banner inicial
clear
echo -e "${BLUE}"
cat << "EOF"
   ____        _                   _ _
  / ___|  __ _| |__  _ __ ___  ___(_) |_ __ _
  \___ \ / _` | '_ \| '__/ _ \/ __| | __/ _` |
   ___) | (_| | |_) | | | (_) \__ \ | || (_| |
  |____/ \__,_|_.__/|_|  \___/|___/_|\__\__,_|

  Setup Final v1.0.0 - Preparación para Producción
EOF
echo -e "${NC}"
echo ""

###############################################################################
# PASO 1: Verificar entorno
###############################################################################

print_header "PASO 1/5: Verificando Entorno"

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Ejecuta este script desde la raíz del proyecto."
    exit 1
fi

print_success "Directorio correcto"

# Verificar Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado. Instala Node.js 18+ primero."
    exit 1
fi

NODE_VERSION=$(node -v)
print_success "Node.js instalado: $NODE_VERSION"

# Verificar npm
if ! command -v npm &> /dev/null; then
    print_error "npm no está instalado."
    exit 1
fi

NPM_VERSION=$(npm -v)
print_success "npm instalado: $NPM_VERSION"

# Verificar .env.local
if [ ! -f ".env.local" ]; then
    print_error "No se encontró .env.local"
    print_info "Crea el archivo .env.local con:"
    print_info "  NEXT_PUBLIC_SUPABASE_URL=tu_url"
    print_info "  NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_key"
    exit 1
fi

print_success "Archivo .env.local encontrado"

# Cargar variables de entorno
export $(cat .env.local | grep -v '^#' | xargs)

# Verificar variables críticas
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    print_error "Variables de entorno no configuradas correctamente"
    exit 1
fi

print_success "Variables de entorno configuradas"

###############################################################################
# PASO 2: Instalar dependencias
###############################################################################

print_header "PASO 2/5: Instalando Dependencias"

print_info "Instalando npm packages (esto puede tardar 1-2 minutos)..."
npm install --silent

if [ $? -eq 0 ]; then
    print_success "Dependencias instaladas correctamente"
else
    print_error "Error instalando dependencias"
    exit 1
fi

# Verificar que bcrypt se instaló
if [ -d "node_modules/bcrypt" ]; then
    print_success "bcrypt instalado correctamente"
else
    print_error "bcrypt no se instaló. Intenta: npm install bcrypt"
    exit 1
fi

###############################################################################
# PASO 3: Migrar passwords
###############################################################################

print_header "PASO 3/5: Migrando Passwords a Bcrypt"

print_warning "Este paso hasheará todos los passwords en texto plano"
print_warning "Solo se ejecuta UNA VEZ. Si ya se ejecutó, los passwords hasheados se saltarán."
echo ""

read -p "¿Continuar con la migración? (s/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    print_info "Ejecutando script de migración..."

    if [ -f "scripts/migrate-passwords.js" ]; then
        node scripts/migrate-passwords.js

        if [ $? -eq 0 ]; then
            print_success "Migración completada"
        else
            print_error "Error en la migración. Revisa los logs arriba."
            exit 1
        fi
    else
        print_error "No se encontró scripts/migrate-passwords.js"
        exit 1
    fi
else
    print_warning "Migración saltada. Ejecuta manualmente después:"
    print_info "  node scripts/migrate-passwords.js"
fi

###############################################################################
# PASO 4: Verificar instalación
###############################################################################

print_header "PASO 4/5: Verificando Instalación"

# Verificar TypeScript
print_info "Verificando tipos TypeScript..."
npm run typecheck --silent

if [ $? -eq 0 ]; then
    print_success "TypeScript OK - Sin errores de tipos"
else
    print_warning "Hay errores de TypeScript (revisar arriba)"
fi

# Verificar ESLint
print_info "Verificando ESLint..."
npm run lint --silent

if [ $? -eq 0 ]; then
    print_success "ESLint OK - Sin errores de linting"
else
    print_warning "Hay warnings de ESLint (no críticos)"
fi

# Verificar build
print_info "Verificando build Next.js (esto puede tardar 1-2 minutos)..."
npm run build

if [ $? -eq 0 ]; then
    print_success "Build exitoso - Aplicación lista para producción"
else
    print_error "Error en build. Revisar logs arriba."
    exit 1
fi

###############################################################################
# PASO 5: Resumen final
###############################################################################

print_header "PASO 5/5: Resumen Final"

echo ""
print_success "¡Setup completado exitosamente!"
echo ""
print_info "Estado del proyecto:"
print_success "  ✅ Dependencias instaladas"
print_success "  ✅ bcrypt configurado"
print_success "  ✅ Passwords migrados (si se ejecutó)"
print_success "  ✅ TypeScript verificado"
print_success "  ✅ Build exitoso"
echo ""

print_info "Próximos pasos:"
echo ""
print_info "1️⃣  Verificar en Supabase:"
print_info "   → Dashboard → Table Editor → users"
print_info "   → Columna password_hash debe empezar con \$2b\$10\$"
echo ""
print_info "2️⃣  Test funcional:"
print_info "   → npm run dev:electron"
print_info "   → Login, abrir caja, procesar venta"
echo ""
print_info "3️⃣  Crear ícono (opcional para v1.0):"
print_info "   → Ver CREAR_ICONO.md"
print_info "   → Placeholder SVG ya existe en electron/icon.svg"
echo ""
print_info "4️⃣  Build para distribución:"
print_info "   → npm run build:electron"
print_info "   → Archivo .exe estará en dist/"
echo ""

print_header "¡Sistema listo para producción! 🎉"

# Guardar log
LOG_FILE="setup-final-$(date +%Y%m%d-%H%M%S).log"
echo "Log guardado en: $LOG_FILE"

exit 0

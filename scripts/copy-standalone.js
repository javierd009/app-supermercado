#!/usr/bin/env node

/**
 * Script para preparar el build standalone de Next.js para Electron
 *
 * Next.js standalone output no incluye:
 * - .next/static (archivos CSS, JS compilados)
 * - public (imágenes, iconos, etc.)
 *
 * Este script los copia al directorio standalone para que funcione correctamente.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const standaloneDir = path.join(rootDir, '.next', 'standalone');

console.log('📦 Preparando build standalone para Electron...');
console.log(`   Root: ${rootDir}`);
console.log(`   Standalone: ${standaloneDir}`);

// Verificar que existe el directorio standalone
if (!fs.existsSync(standaloneDir)) {
  console.error('❌ No se encontró el directorio .next/standalone');
  console.error('   Ejecuta: BUILD_TARGET=electron npm run build');
  process.exit(1);
}

// 1. Copiar .next/static a .next/standalone/.next/static
const staticSrc = path.join(rootDir, '.next', 'static');
const staticDest = path.join(standaloneDir, '.next', 'static');

if (fs.existsSync(staticSrc)) {
  console.log('📂 Copiando .next/static...');
  fs.cpSync(staticSrc, staticDest, { recursive: true });
  console.log('   ✅ Archivos estáticos copiados');
} else {
  console.warn('⚠️  No se encontró .next/static');
}

// 2. Copiar public a .next/standalone/public
const publicSrc = path.join(rootDir, 'public');
const publicDest = path.join(standaloneDir, 'public');

if (fs.existsSync(publicSrc)) {
  console.log('📂 Copiando public...');
  fs.cpSync(publicSrc, publicDest, { recursive: true });
  console.log('   ✅ Archivos públicos copiados');
} else {
  console.warn('⚠️  No se encontró directorio public');
}

// 3. Copiar .env.local al standalone (para variables de entorno)
const envSrc = path.join(rootDir, '.env.local');
const envDest = path.join(standaloneDir, '.env.local');

if (fs.existsSync(envSrc)) {
  console.log('📄 Copiando .env.local...');
  fs.copyFileSync(envSrc, envDest);
  console.log('   ✅ Variables de entorno copiadas');
}

console.log('');
console.log('✅ Build standalone preparado correctamente');
console.log('');

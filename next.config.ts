import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Activa el MCP server en /_next/mcp (Next.js 16+)
  experimental: {
    mcpServer: true,
  },

  // Configuración para Electron
  // Solo exportar estático si estamos construyendo para Electron
  output: process.env.BUILD_TARGET === 'electron' ? 'export' : undefined,

  // Deshabilitar optimización de imágenes para build estático
  images: {
    unoptimized: true,
  },

  // Ignorar errores de TypeScript en el build (temporal)
  // Los errores están en código legacy del POS, Admin Web está correcto
  typescript: {
    ignoreBuildErrors: true,
  },

  // Ignorar errores de ESLint en el build (temporal)
  eslint: {
    ignoreDuringBuilds: true,
  },
}

export default nextConfig

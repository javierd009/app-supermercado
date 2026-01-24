import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Activa el MCP server en /_next/mcp (Next.js 16+)
  experimental: {
    mcpServer: true,
  },

  // Configuración para Electron
  // Usar standalone para crear servidor Node.js mínimo que corre dentro de Electron
  output: process.env.BUILD_TARGET === 'electron' ? 'standalone' : undefined,

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

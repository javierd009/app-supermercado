import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Activa el MCP server en /_next/mcp (Next.js 16+)
  experimental: {
    mcpServer: true,
  },

  // Configuración para Electron
  // En producción, exportamos estático para que Electron lo cargue
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,

  // Deshabilitar optimización de imágenes para build estático
  images: {
    unoptimized: true,
  },
}

export default nextConfig

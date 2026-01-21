import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ConnectionStatus } from '@/shared/components/ConnectionStatus'
import { RealtimeSyncProvider } from '@/lib/database/RealtimeSyncProvider'
import { PWARegister } from '@/lib/pwa/PWARegister'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'La Sabrosita POS',
  description: 'Sistema de Punto de Venta moderno para pulperías - POS Offline + Admin Web',
  keywords: ['POS', 'punto de venta', 'pulpería', 'Costa Rica', 'retail', 'Sabrosita', 'PWA', 'offline'],
  authors: [{ name: 'Sabrosita POS' }],
  applicationName: 'Sabrosita POS',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sabrosita POS',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { url: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: '#1e40af',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={inter.className}>
        <PWARegister />
        <RealtimeSyncProvider>
          {children}
          <ConnectionStatus />
        </RealtimeSyncProvider>
      </body>
    </html>
  )
}

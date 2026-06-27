import type { Metadata, Viewport } from 'next'
import { DM_Sans, Syne } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { AuthProvider } from '@/providers/AuthProvider'
import { ActionToastProvider } from '@/providers/ActionToastProvider'
import AppShell from '@/components/AppShell'
import './globals.css'

const syne = Syne({ subsets: ['latin'], variable: '--font-syne' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })

export const metadata: Metadata = {
  title: 'Atlas Detailing',
  description: 'Car detailing business operations and profit tracking',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/logo.png', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/icons/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Atlas Detailing',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f0f0f',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`dark ${syne.variable} ${dmSans.variable}`}
      style={{ colorScheme: 'dark' }}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <AuthProvider>
          <ActionToastProvider>
            <AppShell>{children}</AppShell>
          </ActionToastProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}

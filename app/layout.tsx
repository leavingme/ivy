import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL('https://ivy.leavingme.cn'),
  title: 'ivy 藤学',
  description: 'Ivy 的语文学习助手 — 说话就能看到笔顺动画',
  applicationName: 'ivy 藤学',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ivy 藤学',
  },
  formatDetection: { telephone: false },
  // Icons auto-discovered from app/icon.tsx — Next.js generates /icon
  // (single source of truth). apple-touch-icon served from /icon too.
  icons: undefined,
  manifest: '/manifest.webmanifest',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1a1a1a',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-Hans">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}

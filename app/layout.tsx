import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import EnvWarning from "@/components/env-warning"

import { Inter } from 'next/font/google'

// Sentry must be imported in the root layout
import * as Sentry from "@sentry/nextjs"

// Otimizando carregamento de fontes - apenas pesos realmente usados
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: 'swap',
  preload: true,
  fallback: ['system-ui', 'arial']
})

export const metadata: Metadata = {
  title: "Odonto GPT - AI para Profissionais de Odontologia",
  description: "Plataforma SaaS com IA e cursos para profissionais de odontologia",
  generator: "v0.app",
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Snippet VTurb para pré-carregar player e acelerar renderização */}
        <script
          dangerouslySetInnerHTML={{
            __html: '!function(i,n){i._plt=i._plt||(n&&n.timeOrigin?n.timeOrigin+n.now():Date.now())}(window,performance);'
          }}
        />
        <link
          rel="preload"
          href="https://scripts.converteai.net/b4d52743-082a-47bd-a232-f61795447a53/players/690ddf3e19eaa3a949e81a16/v4/player.js"
          as="script"
        />
        <link
          rel="preload"
          href="https://scripts.converteai.net/lib/js/smartplayer-wc/v4/smartplayer.js"
          as="script"
        />
        <link
          rel="preload"
          href="https://cdn.converteai.net/b4d52743-082a-47bd-a232-f61795447a53/690ddf3219eaa3a949e81a0b/main.m3u8"
          as="fetch"
          crossOrigin="anonymous"
        />
        <link rel="dns-prefetch" href="https://cdn.converteai.net" />
        <link rel="dns-prefetch" href="https://scripts.converteai.net" />
        <link rel="dns-prefetch" href="https://images.converteai.net" />
        <link rel="dns-prefetch" href="https://api.vturb.com.br" />
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <EnvWarning />
          <div className="min-h-screen bg-session-landing">
            {children}
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

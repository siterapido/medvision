import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import { Inter } from 'next/font/google'
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import EnvWarning from "@/components/env-warning"
import { SiteFrame } from "@/components/layout/site-frame"

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
        {/* DNS prefetch para melhor performance quando os recursos forem necessários */}
        <link rel="dns-prefetch" href="https://cdn.converteai.net" />
        <link rel="dns-prefetch" href="https://scripts.converteai.net" />
        <link rel="dns-prefetch" href="https://images.converteai.net" />
        <link rel="dns-prefetch" href="https://api.vturb.com.br" />
      </head>
      <body className={`${inter.className} font-sans antialiased app-shell`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          forcedTheme="dark"
          disableTransitionOnChange
        >
          <EnvWarning />
          <SiteFrame>
            {children}
          </SiteFrame>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}

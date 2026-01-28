'use client'

import { useTheme } from 'next-themes'
import { useEffect } from 'react'

/**
 * Componente que força o modo escuro no painel administrativo.
 * Deve ser usado no layout do admin para garantir que apenas
 * o dark mode esteja disponível.
 */
export function ForceDarkMode() {
  const { setTheme, theme } = useTheme()

  useEffect(() => {
    // Sempre forçar dark mode no admin
    if (theme !== 'dark') {
      setTheme('dark')
    }
  }, [theme, setTheme])

  return null
}

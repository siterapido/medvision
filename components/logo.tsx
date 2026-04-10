"use client"

interface LogoProps {
  width?: number
  height?: number
  className?: string
  /**
   * Define a variante da logo.
   * - 'auto': alterna entre preta (claro) e branca (escuro)
   * - 'white': força a versão branca (evita 404 e garante contraste)
   */
  variant?: 'auto' | 'white'
  iconOnly?: boolean
}

export function Logo({ width = 120, height = 40, className = '', variant = 'auto', iconOnly = false }: LogoProps) {
  // Renderiza o logo como texto "MedVision"
  const textSizeClass = width && width < 50 ? 'text-sm' : 'text-xl'

  return (
    <div
      className={`font-bold ${textSizeClass} bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent ${className}`}
      style={{ width, height }}
    >
      MedVision
    </div>
  )
}

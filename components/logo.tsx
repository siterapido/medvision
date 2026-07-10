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
  const textSizeClass = width && width < 50 ? 'text-sm' : 'text-xl'
  const colorClass =
    variant === 'white'
      ? 'text-white'
      : 'text-ink dark:text-white'

  return (
    <div
      className={`font-bold ${textSizeClass} ${colorClass} ${className}`}
      style={{ width, height }}
      aria-label="MedVision"
    >
      {iconOnly ? 'MV' : 'MedVision'}
    </div>
  )
}

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
  if (variant === 'white') {
    // Renderiza apenas a versão branca, útil para seções escuras (landing hero/footer)
    return (
      <img
        src="/Imagens%20/logo-odonto-gpt-branca.png"
        alt="Odonto Suite"
        width={width}
        height={height}
        className={className}
      />
    )
  }

  return (
    <>
      {/* Fallback: renderiza só a branca se a preta não existir */}
      <img
        src="/Imagens%20/logo-odonto-gpt-branca.png"
        alt="Odonto Suite"
        width={width}
        height={height}
        className={`hidden dark:block ${className}`}
      />
      <img
        src="/Imagens%20/logo-odonto-gpt-branca.png"
        alt="Odonto Suite"
        width={width}
        height={height}
        className={`block dark:hidden ${className}`}
      />
    </>
  )
}

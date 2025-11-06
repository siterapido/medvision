"use client"

interface LogoProps {
  width?: number
  height?: number
  className?: string
}

export function Logo({ width = 120, height = 40, className = '' }: LogoProps) {
  return (
    <>
      {/* Logo preta para tema claro */}
      <img
        src="/Imagens%20/logo-odonto-gpt-preta.png"
        alt="Odonto GPT"
        width={width}
        height={height}
        className={`block dark:hidden ${className}`}
      />
      {/* Logo branca para tema escuro */}
      <img
        src="/Imagens%20/logo-odonto-gpt-branca.png"
        alt="Odonto GPT"
        width={width}
        height={height}
        className={`hidden dark:block ${className}`}
      />
    </>
  )
}
'use client'

import { cn } from '@/lib/utils'
import type React from 'react'

interface FixedFooterProps {
  /**
   * Conteúdo da div fixa
   */
  children: React.ReactNode
  /**
   * Classes CSS adicionais
   */
  className?: string
  /**
   * Offset personalizado do bottom (em pixels)
   * Útil para evitar sobreposição com outros elementos
   */
  offset?: number
  /**
   * Z-index personalizado
   */
  zIndex?: number
  /**
   * Usar position sticky em vez de fixed
   * Útil para containers com scroll interno
   */
  useSticky?: boolean
  /**
   * Adicionar padding no body para evitar sobreposição de conteúdo
   */
  addBodyPadding?: boolean
}

export function FixedFooter({
  children,
  className,
  offset = 0,
  zIndex = 50,
  useSticky = false,
  addBodyPadding = true,
}: FixedFooterProps) {
  const positionClass = useSticky ? 'sticky-variant' : 'fixed-footer-container'
  const offsetStyle = offset > 0 ? { bottom: `${offset}px` } : undefined

  // Efeito para adicionar/remover padding do body quando necessário
  React.useEffect(() => {
    if (addBodyPadding && !useSticky) {
      document.body.classList.add('has-fixed-footer')
      return () => {
        document.body.classList.remove('has-fixed-footer')
      }
    }
  }, [addBodyPadding, useSticky])

  return (
    <div
      className={cn(
        positionClass, // Classe base com posicionamento
        {
          'sticky bottom-0': useSticky, // Para variante sticky
        },
        className
      )}
      style={{
        zIndex,
        ...offsetStyle,
      }}
      data-fixed-footer="true"
    >
      {/* Container interno com padding responsivo */}
      <div className="fixed-footer-content">
        {children}
      </div>
    </div>
  )
}

/**
 * Hook para calcular offset automático baseado em elementos existentes
 */
export function useFixedFooterOffset() {
  const [offset, setOffset] = React.useState(0)

  React.useEffect(() => {
    const calculateOffset = () => {
      // Encontrar elementos fixos existentes no rodapé
      const fixedElements = document.querySelectorAll(
        'footer, [data-fixed-footer="true"]'
      )
      
      let totalHeight = 0
      fixedElements.forEach((el) => {
        if (el !== document.querySelector('[data-fixed-footer="true"]')) {
          totalHeight += el.getBoundingClientRect().height
        }
      })

      setOffset(totalHeight)
    }

    calculateOffset()
    window.addEventListener('resize', calculateOffset)
    
    return () => {
      window.removeEventListener('resize', calculateOffset)
    }
  }, [])

  return offset
}
'use client'

import { useEffect, useRef, useState } from 'react'

interface LazyVideoWrapperProps {
  children: React.ReactNode
  threshold?: number
  rootMargin?: string
  placeholder?: React.ReactNode
}

/**
 * Wrapper que usa Intersection Observer para carregar vídeos apenas quando visíveis
 * Melhora significativamente a performance inicial da página
 */
export function LazyVideoWrapper({
  children,
  threshold = 0.1,
  rootMargin = '50px',
  placeholder
}: LazyVideoWrapperProps) {
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true)
            // Desconecta o observer após o primeiro carregamento
            observer.disconnect()
          }
        })
      },
      {
        threshold,
        rootMargin
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, isVisible])

  return (
    <div ref={containerRef} className="w-full">
      {isVisible ? (
        children
      ) : (
        placeholder || (
          <div className="w-full aspect-video bg-gray-900 rounded-xl flex items-center justify-center">
            <div className="text-white/60 text-sm">Carregando vídeo...</div>
          </div>
        )
      )}
    </div>
  )
}

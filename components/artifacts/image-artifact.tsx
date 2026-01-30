'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Download, Expand, X } from 'lucide-react'
import type { ImageArtifact as ImageArtifactType } from './types'

interface ImageArtifactProps {
  artifact: ImageArtifactType
  className?: string
}

export function ImageArtifact({ artifact, className }: ImageArtifactProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const downloadImage = async () => {
    const response = await fetch(artifact.url)
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = artifact.title || 'image'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <div
        className={cn(
          'rounded-lg border border-border bg-card overflow-hidden',
          'shadow-sm hover:shadow-md transition-shadow',
          className
        )}
      >
        {/* Header */}
        {artifact.title && (
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
            <span className="text-sm font-medium text-foreground">{artifact.title}</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsExpanded(true)}
                className={cn(
                  'p-1.5 rounded-md text-muted-foreground',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors'
                )}
                title="Expandir"
              >
                <Expand className="h-4 w-4" />
              </button>
              <button
                onClick={downloadImage}
                className={cn(
                  'p-1.5 rounded-md text-muted-foreground',
                  'hover:bg-accent hover:text-accent-foreground',
                  'transition-colors'
                )}
                title="Baixar imagem"
              >
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Image */}
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <img
            src={artifact.url}
            alt={artifact.alt || artifact.title || 'Imagem'}
            width={artifact.width}
            height={artifact.height}
            className={cn(
              'w-full h-auto object-contain cursor-pointer',
              'transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            onLoad={() => setIsLoading(false)}
            onClick={() => setIsExpanded(true)}
          />
        </div>

        {/* Description */}
        {artifact.description && (
          <div className="px-4 py-2 border-t border-border">
            <p className="text-sm text-muted-foreground">{artifact.description}</p>
          </div>
        )}
      </div>

      {/* Expanded Modal */}
      {isExpanded && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsExpanded(false)}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setIsExpanded(false)}
              className={cn(
                'absolute -top-12 right-0 p-2 rounded-full',
                'bg-card border border-border text-foreground',
                'hover:bg-accent transition-colors'
              )}
            >
              <X className="h-5 w-5" />
            </button>
            <img
              src={artifact.url}
              alt={artifact.alt || artifact.title || 'Imagem'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  )
}

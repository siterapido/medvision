'use client'

/**
 * FileBlockRenderer - Renders file attachments (images) in chat messages
 *
 * Supports:
 * - Image preview with thumbnail
 * - Click to expand in modal
 * - Keyboard navigation (Escape to close)
 * - Fallback for non-image files
 */

import { cn } from '@/lib/utils'
import { FileIcon, Maximize2, X } from 'lucide-react'
import { useState, useCallback, useEffect } from 'react'

interface FileBlockProps {
  url: string
  mediaType?: string
  filename?: string
  className?: string
}

export function FileBlockRenderer({
  url,
  mediaType,
  filename,
  className,
}: FileBlockProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isImage = mediaType?.startsWith('image/')

  // Handle keyboard events for modal
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsExpanded(false)
    }
  }, [])

  useEffect(() => {
    if (isExpanded) {
      document.addEventListener('keydown', handleKeyDown)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isExpanded, handleKeyDown])

  if (isImage) {
    return (
      <>
        <div className={cn('relative group', className)}>
          <div className="relative rounded-lg overflow-hidden border border-border/50 max-w-xs sm:max-w-sm">
            <img
              src={url}
              alt={filename || 'Imagem anexada'}
              className="w-full h-auto max-h-64 object-contain cursor-pointer hover:opacity-95 transition-opacity bg-muted/30"
              onClick={() => setIsExpanded(true)}
            />
            <button
              onClick={() => setIsExpanded(true)}
              className="absolute bottom-2 right-2 p-1.5 rounded-md bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity border border-border/50"
              aria-label="Expandir imagem"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
          {filename && (
            <p className="mt-1 text-xs text-muted-foreground truncate max-w-xs">
              {filename}
            </p>
          )}
        </div>

        {/* Expanded modal */}
        {isExpanded && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setIsExpanded(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Imagem expandida"
          >
            <button
              onClick={() => setIsExpanded(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-6 h-6 text-white" />
            </button>
            <img
              src={url}
              alt={filename || 'Imagem'}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </>
    )
  }

  // Fallback for non-image files
  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border/50 max-w-xs',
        className
      )}
    >
      <FileIcon className="w-4 h-4 text-muted-foreground shrink-0" />
      <span className="text-sm truncate">{filename || 'Arquivo'}</span>
    </div>
  )
}

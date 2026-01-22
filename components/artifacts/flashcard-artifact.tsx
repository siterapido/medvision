'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Layers, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import type { FlashcardArtifact as FlashcardArtifactType } from './types'

interface FlashcardArtifactProps {
  artifact: FlashcardArtifactType
  className?: string
}

export function FlashcardArtifact({ artifact, className }: FlashcardArtifactProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)

  const currentCard = artifact.cards[currentIndex]
  const totalCards = artifact.cards.length

  const goToPrevious = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev === 0 ? totalCards - 1 : prev - 1))
  }

  const goToNext = () => {
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev === totalCards - 1 ? 0 : prev + 1))
  }

  const flipCard = () => {
    setIsFlipped(!isFlipped)
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card overflow-hidden',
        'shadow-sm hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {artifact.title || 'Flashcards'}
          </span>
          <span className="text-xs text-muted-foreground">
            {currentIndex + 1} / {totalCards}
          </span>
        </div>

        {currentCard.category && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
            {currentCard.category}
          </span>
        )}
      </div>

      {/* Card Area */}
      <div className="p-4">
        <div
          className="perspective-1000 cursor-pointer"
          onClick={flipCard}
        >
          <div
            className={cn(
              'relative w-full min-h-[200px] preserve-3d transition-transform duration-500',
              isFlipped && 'rotate-y-180'
            )}
          >
            {/* Front */}
            <div
              className={cn(
                'absolute inset-0 backface-hidden',
                'rounded-lg border border-border bg-gradient-to-br from-primary/5 to-primary/10',
                'flex flex-col items-center justify-center p-6 text-center'
              )}
            >
              <span className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Pergunta
              </span>
              <p className="text-lg font-medium text-foreground">{currentCard.front}</p>
              <span className="text-xs text-muted-foreground mt-4">
                Clique para virar
              </span>
            </div>

            {/* Back */}
            <div
              className={cn(
                'absolute inset-0 backface-hidden rotate-y-180',
                'rounded-lg border border-border bg-gradient-to-br from-success/5 to-success/10',
                'flex flex-col items-center justify-center p-6 text-center'
              )}
            >
              <span className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Resposta
              </span>
              <p className="text-lg font-medium text-foreground">{currentCard.back}</p>
              <span className="text-xs text-muted-foreground mt-4">
                Clique para virar
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-center gap-4 mt-4">
          <button
            onClick={goToPrevious}
            className={cn(
              'p-2 rounded-full border border-border',
              'hover:bg-accent hover:text-accent-foreground',
              'transition-colors'
            )}
            aria-label="Anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={flipCard}
            className={cn(
              'p-2 rounded-full border border-border',
              'hover:bg-accent hover:text-accent-foreground',
              'transition-colors'
            )}
            aria-label="Virar"
          >
            <RotateCcw className="h-5 w-5" />
          </button>

          <button
            onClick={goToNext}
            className={cn(
              'p-2 rounded-full border border-border',
              'hover:bg-accent hover:text-accent-foreground',
              'transition-colors'
            )}
            aria-label="Proximo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1 mt-3">
          {artifact.cards.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsFlipped(false)
                setCurrentIndex(index)
              }}
              className={cn(
                'w-2 h-2 rounded-full transition-colors',
                index === currentIndex
                  ? 'bg-primary'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              )}
              aria-label={`Ir para card ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

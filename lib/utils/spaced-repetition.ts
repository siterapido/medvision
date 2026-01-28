/**
 * SM-2 Spaced Repetition Algorithm Implementation
 *
 * Based on the SuperMemo SM-2 algorithm for optimal learning retention.
 *
 * Quality ratings:
 * 0 - Complete blackout, no memory
 * 1 - Incorrect response, but upon seeing correct answer, remembered
 * 2 - Incorrect response, but correct answer seemed easy to recall
 * 3 - Correct response with serious difficulty
 * 4 - Correct response after hesitation
 * 5 - Perfect response with no hesitation
 */

export type QualityRating = 0 | 1 | 2 | 3 | 4 | 5

export interface CardProgress {
  cardId: string
  artifactId: string
  repetition: number       // Number of times reviewed successfully
  easeFactor: number       // Difficulty multiplier (starts at 2.5)
  intervalDays: number     // Days until next review
  nextReviewAt: Date
  lastReviewedAt: Date
}

export interface ReviewResult {
  nextReviewAt: Date
  newInterval: number
  newEaseFactor: number
  newRepetition: number
}

/**
 * Calculate the next review date and parameters using SM-2 algorithm
 */
export function calculateNextReview(
  quality: QualityRating,
  currentRepetition: number,
  currentEaseFactor: number,
  currentInterval: number
): ReviewResult {
  let newRepetition: number
  let newEaseFactor: number
  let newInterval: number

  // If quality < 3, restart the learning process
  if (quality < 3) {
    newRepetition = 0
    newInterval = 1 // Review again tomorrow
  } else {
    newRepetition = currentRepetition + 1

    // Calculate interval based on repetition count
    if (newRepetition === 1) {
      newInterval = 1
    } else if (newRepetition === 2) {
      newInterval = 6
    } else {
      newInterval = Math.round(currentInterval * currentEaseFactor)
    }
  }

  // Calculate new ease factor
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  newEaseFactor = currentEaseFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))

  // Ease factor should never go below 1.3
  newEaseFactor = Math.max(1.3, newEaseFactor)

  // Calculate next review date
  const nextReviewAt = new Date()
  nextReviewAt.setDate(nextReviewAt.getDate() + newInterval)

  return {
    nextReviewAt,
    newInterval,
    newEaseFactor,
    newRepetition
  }
}

/**
 * Get user-friendly labels for quality ratings
 */
export function getQualityLabel(quality: QualityRating): string {
  const labels: Record<QualityRating, string> = {
    0: 'Esqueci completamente',
    1: 'Errei, mas lembrei depois',
    2: 'Errei, mas era fácil',
    3: 'Acertei com dificuldade',
    4: 'Acertei após hesitar',
    5: 'Perfeito!'
  }
  return labels[quality]
}

/**
 * Simplified rating options for UI
 */
export interface SimpleRating {
  quality: QualityRating
  label: string
  color: string
  description: string
}

export const SIMPLE_RATINGS: SimpleRating[] = [
  {
    quality: 1,
    label: 'Difícil',
    color: 'bg-red-500 hover:bg-red-600',
    description: 'Não lembrei ou errei'
  },
  {
    quality: 3,
    label: 'Bom',
    color: 'bg-amber-500 hover:bg-amber-600',
    description: 'Lembrei com esforço'
  },
  {
    quality: 5,
    label: 'Fácil',
    color: 'bg-emerald-500 hover:bg-emerald-600',
    description: 'Lembrei facilmente'
  }
]

/**
 * Check if a card is due for review
 */
export function isCardDue(nextReviewAt: Date | null): boolean {
  if (!nextReviewAt) return true // New card
  return new Date() >= new Date(nextReviewAt)
}

/**
 * Sort cards by review urgency (most urgent first)
 */
export function sortCardsByUrgency<T extends { nextReviewAt: Date | null }>(cards: T[]): T[] {
  return [...cards].sort((a, b) => {
    if (!a.nextReviewAt) return -1 // New cards first
    if (!b.nextReviewAt) return 1
    return new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime()
  })
}

/**
 * Get cards that are due for review
 */
export function getDueCards<T extends { nextReviewAt: Date | null }>(cards: T[]): T[] {
  return cards.filter(card => isCardDue(card.nextReviewAt))
}

/**
 * Calculate study statistics
 */
export interface StudyStats {
  totalCards: number
  dueCards: number
  newCards: number
  learningCards: number   // repetition < 3
  reviewCards: number     // repetition >= 3
  masteredCards: number   // interval >= 21 days
}

export function calculateStudyStats<T extends {
  nextReviewAt: Date | null
  repetition: number
  intervalDays: number
}>(cards: T[]): StudyStats {
  const now = new Date()

  let dueCards = 0
  let newCards = 0
  let learningCards = 0
  let reviewCards = 0
  let masteredCards = 0

  for (const card of cards) {
    if (!card.nextReviewAt) {
      newCards++
      dueCards++
    } else if (new Date(card.nextReviewAt) <= now) {
      dueCards++
      if (card.repetition < 3) {
        learningCards++
      } else {
        reviewCards++
      }
    }

    if (card.intervalDays >= 21) {
      masteredCards++
    }
  }

  return {
    totalCards: cards.length,
    dueCards,
    newCards,
    learningCards,
    reviewCards,
    masteredCards
  }
}

/**
 * Default values for a new card
 */
export const DEFAULT_CARD_PROGRESS = {
  repetition: 0,
  easeFactor: 2.5,
  intervalDays: 0,
  nextReviewAt: null
}

/**
 * Format days until next review
 */
export function formatNextReview(nextReviewAt: Date | null): string {
  if (!nextReviewAt) return 'Novo'

  const now = new Date()
  const next = new Date(nextReviewAt)
  const diffMs = next.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'Agora'
  if (diffDays === 1) return 'Amanhã'
  if (diffDays < 7) return `Em ${diffDays} dias`
  if (diffDays < 30) return `Em ${Math.round(diffDays / 7)} semanas`
  return `Em ${Math.round(diffDays / 30)} meses`
}

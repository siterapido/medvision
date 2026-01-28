/**
 * API Route: Flashcard Review
 *
 * Endpoint: POST /api/flashcards/review
 *
 * Records a flashcard review and calculates next review date using SM-2 algorithm
 */

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import {
  calculateNextReview,
  QualityRating,
  DEFAULT_CARD_PROGRESS
} from '@/lib/utils/spaced-repetition'

// Admin client for persistence (bypasses RLS)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface ReviewRequest {
  artifactId: string
  cardId: string
  quality: QualityRating
}

export async function POST(req: Request) {
  try {
    // 1. Authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request
    const body: ReviewRequest = await req.json()
    const { artifactId, cardId, quality } = body

    if (!artifactId || !cardId || quality === undefined) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (quality < 0 || quality > 5) {
      return Response.json({ error: 'Quality must be between 0 and 5' }, { status: 400 })
    }

    // 3. Get current progress (or create new)
    const { data: existingProgress } = await adminSupabase
      .from('flashcard_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('artifact_id', artifactId)
      .eq('card_id', cardId)
      .single()

    const currentProgress = existingProgress || {
      repetition: DEFAULT_CARD_PROGRESS.repetition,
      ease_factor: DEFAULT_CARD_PROGRESS.easeFactor,
      interval_days: DEFAULT_CARD_PROGRESS.intervalDays
    }

    // 4. Calculate next review using SM-2
    const result = calculateNextReview(
      quality,
      currentProgress.repetition,
      Number(currentProgress.ease_factor),
      currentProgress.interval_days
    )

    // 5. Upsert progress
    const progressData = {
      user_id: user.id,
      artifact_id: artifactId,
      card_id: cardId,
      repetition: result.newRepetition,
      ease_factor: result.newEaseFactor,
      interval_days: result.newInterval,
      next_review_at: result.nextReviewAt.toISOString(),
      last_reviewed_at: new Date().toISOString()
    }

    const { error: upsertError } = await adminSupabase
      .from('flashcard_reviews')
      .upsert(progressData, {
        onConflict: 'user_id,artifact_id,card_id'
      })

    if (upsertError) {
      console.error('[Flashcard Review] Upsert error:', upsertError)
      return Response.json({ error: 'Failed to save progress' }, { status: 500 })
    }

    // 6. Record history
    await adminSupabase
      .from('flashcard_review_history')
      .insert({
        user_id: user.id,
        artifact_id: artifactId,
        card_id: cardId,
        quality,
        previous_interval: currentProgress.interval_days,
        new_interval: result.newInterval,
        previous_ease: currentProgress.ease_factor,
        new_ease: result.newEaseFactor
      })

    // 7. Return result
    return Response.json({
      success: true,
      nextReviewAt: result.nextReviewAt,
      interval: result.newInterval,
      easeFactor: result.newEaseFactor,
      repetition: result.newRepetition
    })

  } catch (error) {
    console.error('[Flashcard Review] Error:', error)
    return Response.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

/**
 * GET /api/flashcards/review?artifactId=xxx
 *
 * Get review progress for all cards in an artifact
 */
export async function GET(req: Request) {
  try {
    // 1. Authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse query params
    const { searchParams } = new URL(req.url)
    const artifactId = searchParams.get('artifactId')

    if (!artifactId) {
      return Response.json({ error: 'Missing artifactId' }, { status: 400 })
    }

    // 3. Get all progress for this artifact
    const { data: progress, error } = await adminSupabase
      .from('flashcard_reviews')
      .select('*')
      .eq('user_id', user.id)
      .eq('artifact_id', artifactId)

    if (error) {
      console.error('[Flashcard Review] Query error:', error)
      return Response.json({ error: 'Failed to fetch progress' }, { status: 500 })
    }

    // 4. Calculate stats
    const now = new Date()
    const dueCards = (progress || []).filter(p =>
      !p.next_review_at || new Date(p.next_review_at) <= now
    )

    return Response.json({
      progress: progress || [],
      stats: {
        totalReviewed: progress?.length || 0,
        dueNow: dueCards.length,
        masteredCount: (progress || []).filter(p => p.interval_days >= 21).length
      }
    })

  } catch (error) {
    console.error('[Flashcard Review] Error:', error)
    return Response.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

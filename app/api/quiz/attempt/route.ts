/**
 * API Route: Quiz Attempts
 *
 * POST /api/quiz/attempt - Start or complete a quiz attempt
 * GET /api/quiz/attempt?artifactId=xxx - Get attempt history for a quiz
 */

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const adminSupabase = createAdminClient()

interface StartAttemptRequest {
  action: 'start'
  artifactId: string
  totalQuestions: number
  timeLimitSeconds?: number
}

interface CompleteAttemptRequest {
  action: 'complete'
  attemptId: string
  answers: Record<number, string>
  score: number
  timeSpentSeconds: number
  timedOut?: boolean
}

type AttemptRequest = StartAttemptRequest | CompleteAttemptRequest

export async function POST(req: Request) {
  try {
    // 1. Authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Parse request
    const body: AttemptRequest = await req.json()

    if (body.action === 'start') {
      // Start a new attempt
      const { artifactId, totalQuestions, timeLimitSeconds } = body

      if (!artifactId || !totalQuestions) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 })
      }

      const { data: attempt, error } = await adminSupabase
        .from('quiz_attempts')
        .insert({
          user_id: user.id,
          artifact_id: artifactId,
          total_questions: totalQuestions,
          time_limit_seconds: timeLimitSeconds || null,
          status: 'in_progress',
          started_at: new Date().toISOString()
        })
        .select()
        .single()

      if (error) {
        console.error('[Quiz Attempt] Start error:', error)
        return Response.json({ error: 'Failed to start attempt' }, { status: 500 })
      }

      return Response.json({
        success: true,
        attempt: {
          id: attempt.id,
          startedAt: attempt.started_at,
          timeLimitSeconds: attempt.time_limit_seconds
        }
      })

    } else if (body.action === 'complete') {
      // Complete an existing attempt
      const { attemptId, answers, score, timeSpentSeconds, timedOut } = body

      if (!attemptId || score === undefined || timeSpentSeconds === undefined) {
        return Response.json({ error: 'Missing required fields' }, { status: 400 })
      }

      const { data: attempt, error } = await adminSupabase
        .from('quiz_attempts')
        .update({
          answers,
          score,
          time_spent_seconds: timeSpentSeconds,
          timed_out: timedOut || false,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', attemptId)
        .eq('user_id', user.id) // Security: ensure user owns this attempt
        .select()
        .single()

      if (error) {
        console.error('[Quiz Attempt] Complete error:', error)
        return Response.json({ error: 'Failed to complete attempt' }, { status: 500 })
      }

      // Update question analytics
      for (const [questionIndex, answerId] of Object.entries(answers)) {
        const idx = parseInt(questionIndex)
        await adminSupabase
          .from('quiz_question_analytics')
          .upsert({
            user_id: user.id,
            artifact_id: attempt.artifact_id,
            question_index: idx,
            times_seen: 1,
            times_correct: 0, // We'd need to know if correct, simplified here
            last_answered_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,artifact_id,question_index'
          })
      }

      return Response.json({
        success: true,
        attempt: {
          id: attempt.id,
          score: attempt.score,
          totalQuestions: attempt.total_questions,
          timeSpentSeconds: attempt.time_spent_seconds,
          timedOut: attempt.timed_out,
          completedAt: attempt.completed_at
        }
      })

    } else {
      return Response.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('[Quiz Attempt] Error:', error)
    return Response.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

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

    // 3. Get attempts for this quiz
    const { data: attempts, error } = await adminSupabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('artifact_id', artifactId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('[Quiz Attempt] Query error:', error)
      return Response.json({ error: 'Failed to fetch attempts' }, { status: 500 })
    }

    // 4. Calculate stats
    const completedAttempts = attempts || []
    const bestScore = completedAttempts.length > 0
      ? Math.max(...completedAttempts.map(a => a.score))
      : 0
    const averageScore = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + a.score, 0) / completedAttempts.length
      : 0
    const averageTime = completedAttempts.length > 0
      ? completedAttempts.reduce((sum, a) => sum + a.time_spent_seconds, 0) / completedAttempts.length
      : 0

    return Response.json({
      attempts: completedAttempts.map(a => ({
        id: a.id,
        score: a.score,
        totalQuestions: a.total_questions,
        percentage: a.percentage,
        timeSpentSeconds: a.time_spent_seconds,
        timedOut: a.timed_out,
        completedAt: a.completed_at
      })),
      stats: {
        totalAttempts: completedAttempts.length,
        bestScore,
        averageScore: Math.round(averageScore * 10) / 10,
        averageTimeSeconds: Math.round(averageTime)
      }
    })

  } catch (error) {
    console.error('[Quiz Attempt] Error:', error)
    return Response.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

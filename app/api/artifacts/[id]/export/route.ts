/**
 * API Route: Export Artifact
 *
 * GET /api/artifacts/[id]/export?format=pdf|markdown|anki|txt
 *
 * Exports an artifact to various formats.
 */

import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import {
  exportResearchToPDF,
  exportSummaryToPDF,
  exportExamToPDF,
  exportFlashcardsToAnki,
  exportFlashcardsToTxt,
  exportMindMapToMarkdown,
} from '@/lib/utils/pdf-export'

// Admin client for fetching (bypasses RLS)
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Authentication
    const supabase = await createServerClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Get artifact ID and format
    const { id: artifactId } = await params
    const { searchParams } = new URL(req.url)
    const format = searchParams.get('format') || 'pdf'

    // 3. Fetch artifact
    const { data: artifact, error: fetchError } = await adminSupabase
      .from('artifacts')
      .select('*')
      .eq('id', artifactId)
      .eq('user_id', user.id) // Security: ensure user owns this artifact
      .single()

    if (fetchError || !artifact) {
      return Response.json({ error: 'Artifact not found' }, { status: 404 })
    }

    // 4. Generate export based on type and format
    let blob: Blob
    let filename: string
    let contentType: string

    const safeTitle = artifact.title
      .replace(/[^a-zA-Z0-9\s-]/g, '')
      .replace(/\s+/g, '_')
      .toLowerCase()
      .slice(0, 50)

    switch (artifact.type) {
      case 'research':
        if (format === 'markdown') {
          const mdContent = `# ${artifact.title}\n\n${artifact.content.markdownContent || ''}\n\n## Fontes\n${
            (artifact.content.sources || []).map((s: any, i: number) => `${i + 1}. ${s.title}${s.url ? ` - ${s.url}` : ''}`).join('\n')
          }`
          blob = new Blob([mdContent], { type: 'text/markdown' })
          filename = `${safeTitle}.md`
          contentType = 'text/markdown'
        } else {
          blob = exportResearchToPDF(artifact)
          filename = `${safeTitle}.pdf`
          contentType = 'application/pdf'
        }
        break

      case 'summary':
        if (format === 'markdown') {
          const mdContent = `# ${artifact.title}\n\n## Pontos-Chave\n${
            (artifact.content.keyPoints || []).map((p: string) => `- ${p}`).join('\n')
          }\n\n${artifact.content.markdownContent || ''}`
          blob = new Blob([mdContent], { type: 'text/markdown' })
          filename = `${safeTitle}.md`
          contentType = 'text/markdown'
        } else {
          blob = exportSummaryToPDF(artifact)
          filename = `${safeTitle}.pdf`
          contentType = 'application/pdf'
        }
        break

      case 'flashcards':
        if (format === 'anki') {
          blob = exportFlashcardsToAnki(artifact)
          filename = `${safeTitle}_anki.txt`
          contentType = 'text/tab-separated-values'
        } else if (format === 'txt') {
          blob = exportFlashcardsToTxt(artifact)
          filename = `${safeTitle}.txt`
          contentType = 'text/plain'
        } else {
          // Default: txt for flashcards
          blob = exportFlashcardsToTxt(artifact)
          filename = `${safeTitle}.txt`
          contentType = 'text/plain'
        }
        break

      case 'exam':
        if (format === 'markdown') {
          const questions = artifact.content.questions || []
          const mdContent = `# ${artifact.title}\n\n${
            questions.map((q: any, i: number) => {
              const qText = q.question_text || q.text || ''
              const options = (q.options || []).map((o: any, j: number) => {
                const letter = String.fromCharCode(65 + j)
                const optText = typeof o === 'string' ? o : o.text
                return `   ${letter}) ${optText}`
              }).join('\n')
              return `## Questão ${i + 1}\n${qText}\n\n${options}`
            }).join('\n\n')
          }\n\n---\n\n## Gabarito\n${
            questions.map((q: any, i: number) => `${i + 1}. ${q.correct_answer || ''}`).join('\n')
          }`
          blob = new Blob([mdContent], { type: 'text/markdown' })
          filename = `${safeTitle}.md`
          contentType = 'text/markdown'
        } else {
          blob = exportExamToPDF(artifact)
          filename = `${safeTitle}.pdf`
          contentType = 'application/pdf'
        }
        break

      case 'mindmap':
        blob = exportMindMapToMarkdown(artifact)
        filename = `${safeTitle}.md`
        contentType = 'text/markdown'
        break

      default:
        return Response.json({ error: 'Export not supported for this artifact type' }, { status: 400 })
    }

    // 5. Return file
    return new Response(blob, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })

  } catch (error) {
    console.error('[Artifact Export] Error:', error)
    return Response.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

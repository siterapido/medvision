import { createClient } from '@/lib/supabase/server'

export type LaudoAuditAction =
  | 'analyzed'
  | 'saved'
  | 'edited'
  | 'signed'
  | 'exported'
  | 'viewed'

export type RecordLaudoAuditInput = {
  artifactId: string
  userId: string
  action: LaudoAuditAction
  metadata?: Record<string, unknown>
}

/**
 * Persiste evento de auditoria clínica para um laudo (artifact).
 */
export async function recordLaudoAudit({
  artifactId,
  userId,
  action,
  metadata = {},
}: RecordLaudoAuditInput): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('laudo_audit_log').insert({
    artifact_id: artifactId,
    user_id: userId,
    action,
    metadata,
  })

  if (error) {
    throw new Error(`Failed to record laudo audit: ${error.message}`)
  }
}

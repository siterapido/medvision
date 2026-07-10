/**
 * L2 cache compartilhado em Postgres (`vision_cache`).
 * Usado como fallback quando o L1 in-memory missa (serverless multi-instance).
 */

import { createAdminClient } from '@/lib/supabase/admin'
import type { CacheEntry } from '@/lib/vision/cache'

function getClient() {
  return createAdminClient()
}

export async function getDbCachedResult<T>(key: string): Promise<CacheEntry<T> | null> {
  try {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('vision_cache')
      .select('payload, expires_at')
      .eq('cache_key', key)
      .maybeSingle()

    if (error || !data) return null

    const expiresAt = new Date(data.expires_at as string).getTime()
    if (Date.now() > expiresAt) {
      // Best-effort cleanup
      void supabase.from('vision_cache').delete().eq('cache_key', key)
      return null
    }

    const payload = data.payload as CacheEntry<T>
    if (!payload || typeof payload !== 'object' || !('result' in payload)) {
      return null
    }
    return payload
  } catch {
    return null
  }
}

export async function setDbCachedResult<T>(
  key: string,
  entry: CacheEntry<T>,
  ttlMinutes: number,
): Promise<void> {
  try {
    const supabase = getClient()
    const expiresAt = new Date(Date.now() + ttlMinutes * 60_000).toISOString()
    await supabase.from('vision_cache').upsert(
      {
        cache_key: key,
        payload: entry,
        created_at: new Date(entry.createdAt).toISOString(),
        expires_at: expiresAt,
      },
      { onConflict: 'cache_key' },
    )
  } catch {
    // Fail-open: L1 continua válido
  }
}

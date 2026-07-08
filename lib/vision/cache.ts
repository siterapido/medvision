/**
 * Cache de análise por hash da imagem + contexto clínico.
 * Evita reprocessar mesma imagem+contexto em janela curta.
 *
 * Chave: SHA-256 da imagem (primeiros 4KB + últimos 4KB) + hash do clinicalContext
 * TTL: configurável via MEDVISION_CACHE_TTL_MINUTES (default: 30 min)
 */

import { createHash } from 'node:crypto'

function envCacheTTL(): number {
    const raw = process.env.MEDVISION_CACHE_TTL_MINUTES
    const parsed = raw ? Number(raw) : NaN
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 30
}

/**
 * Gera hash determinístico para imagem base64.
 * Usa cabeçalho (primeiros 4KB) + cauda (últimos 4KB) para performance.
 */
function hashImageData(imageData: string): string {
    const head = imageData.slice(0, 4096)
    const tail = imageData.length > 8192 ? imageData.slice(-4096) : ''
    return createHash('sha256').update(head).update(tail).digest('hex')
}

function hashContext(clinicalContext?: string | null): string {
    const normalized = (clinicalContext ?? '').trim().toLowerCase()
    if (!normalized) return 'no-context'
    return createHash('sha256').update(normalized).digest('hex')
}

export interface CacheEntry<T = unknown> {
    key: string
    result: T
    modelId: string
    analysisMs: number
    tokenUsage?: { input: number; output: number }
    createdAt: number
}

// In-memory cache (serverless-friendly: per-instance, não compartilhado)
const cache = new Map<string, CacheEntry>()

/** Limpa entradas expiradas. Chamado a cada cache miss. */
function purgeStale(): void {
    const ttlMs = envCacheTTL() * 60_000
    const now = Date.now()
    for (const [key, entry] of cache) {
        if (now - entry.createdAt > ttlMs) {
            cache.delete(key)
        }
    }
}

export function buildCacheKey(imageData: string, clinicalContext?: string | null): string {
    const imgHash = hashImageData(imageData)
    const ctxHash = hashContext(clinicalContext)
    return `medvision:${imgHash}:${ctxHash}`
}

export function getCachedResult<T>(key: string): CacheEntry<T> | null {
    purgeStale()
    const entry = cache.get(key)
    if (!entry) return null

    const ttlMs = envCacheTTL() * 60_000
    if (Date.now() - entry.createdAt > ttlMs) {
        cache.delete(key)
        return null
    }
    return entry as CacheEntry<T>
}

export function setCachedResult<T>(
    key: string,
    result: T,
    modelId: string,
    analysisMs: number,
    tokenUsage?: { input: number; output: number },
): void {
    cache.set(key, {
        key,
        result,
        modelId,
        analysisMs,
        tokenUsage,
        createdAt: Date.now(),
    })
}

/** Para logging/métricas */
export function cacheStats(): { size: number; ttlMinutes: number } {
    return {
        size: cache.size,
        ttlMinutes: envCacheTTL(),
    }
}

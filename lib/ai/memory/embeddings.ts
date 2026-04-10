/**
 * Embeddings Service for Memory System
 *
 * Generates vector embeddings for semantic search using OpenRouter
 * Model: openai/text-embedding-3-small
 * Dimension: 1536
 */

// OpenRouter embedding model
const EMBEDDING_MODEL = 'openai/text-embedding-3-small'
const EMBEDDING_DIMENSION = 1536

// OpenRouter API URL
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/embeddings'

/**
 * Generate embedding for a single text via OpenRouter
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    console.warn('[Embeddings] OPENROUTER_API_KEY not configured, returning empty embedding')
    return []
  }

  if (!text || text.trim().length === 0) {
    return []
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'MedVision Memory System',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text.substring(0, 8000), // Limit input to avoid token limits
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('[Embeddings] OpenRouter API error:', response.status, error)
      return []
    }

    const data = await response.json()

    if (data.data && data.data[0] && data.data[0].embedding) {
      return data.data[0].embedding
    }

    console.error('[Embeddings] Unexpected response format:', data)
    return []
  } catch (error) {
    console.error('[Embeddings] Error generating embedding:', error)
    return []
  }
}

/**
 * Generate embeddings for multiple texts in batch via OpenRouter
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const apiKey = process.env.OPENROUTER_API_KEY

  if (!apiKey) {
    console.warn('[Embeddings] OPENROUTER_API_KEY not configured')
    return texts.map(() => [])
  }

  if (texts.length === 0) {
    return []
  }

  try {
    // Process in batches of 100 (API limit)
    const batchSize = 100
    const allEmbeddings: number[][] = []

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts
        .slice(i, i + batchSize)
        .map(t => t.substring(0, 8000))
        .filter(t => t.trim().length > 0)

      if (batch.length === 0) {
        continue
      }

      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
          'X-Title': 'MedVision Memory System',
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input: batch,
        }),
      })

      if (!response.ok) {
        const error = await response.text()
        console.error('[Embeddings] OpenRouter batch API error:', response.status, error)
        // Return empty embeddings for failed batch
        allEmbeddings.push(...batch.map(() => []))
        continue
      }

      const data = await response.json()

      if (data.data && Array.isArray(data.data)) {
        // Sort by index to maintain order
        const sorted = data.data.sort((a: { index: number }, b: { index: number }) => a.index - b.index)
        allEmbeddings.push(...sorted.map((item: { embedding: number[] }) => item.embedding))
      } else {
        allEmbeddings.push(...batch.map(() => []))
      }
    }

    return allEmbeddings
  } catch (error) {
    console.error('[Embeddings] Batch error:', error)
    return texts.map(() => [])
  }
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    return 0
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB)
  if (magnitude === 0) return 0

  return dotProduct / magnitude
}

/**
 * Format embedding array for Postgres vector type
 */
export function formatEmbeddingForPostgres(embedding: number[]): string {
  if (!embedding || embedding.length === 0) {
    return ''
  }
  return `[${embedding.join(',')}]`
}

/**
 * Parse embedding from Postgres vector format
 */
export function parseEmbeddingFromPostgres(pgVector: string | number[]): number[] {
  if (Array.isArray(pgVector)) {
    return pgVector
  }

  if (typeof pgVector !== 'string') {
    return []
  }

  // Remove brackets and split
  const cleaned = pgVector.replace(/[\[\]]/g, '')
  if (!cleaned) return []

  return cleaned.split(',').map(Number)
}

export const EMBEDDING_CONFIG = {
  model: EMBEDDING_MODEL,
  dimension: EMBEDDING_DIMENSION,
  provider: 'openrouter',
}

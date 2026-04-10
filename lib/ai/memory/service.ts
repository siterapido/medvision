/**
 * Memory Service for MedVision
 *
 * Provides a unified interface for:
 * - Saving memories with embeddings
 * - Semantic search for relevant memories
 * - Getting user context for conversations
 * - Managing memory lifecycle (expiration, cleanup)
 */

import type { SupabaseClient } from '@supabase/supabase-js'

import { createAdminClient } from '@/lib/supabase/admin'
import {
  Memory,
  CreateMemoryInput,
  UserMemoryContext,
  UserProfile,
  MemorySearchOptions,
  MemorySearchResult,
  MemoryType,
  memoryToRow,
  rowToMemory,
  AgentMemoryRow,
} from './types'
import { generateEmbedding, formatEmbeddingForPostgres } from './embeddings'

let adminSupabase: SupabaseClient | null = null

function getAdminSupabase() {
  if (adminSupabase) {
    return adminSupabase
  }

  adminSupabase = createAdminClient()
  return adminSupabase
}

/**
 * Default TTL for short-term memories (24 hours)
 */
const SHORT_TERM_TTL_HOURS = 24

/**
 * Default search threshold for semantic similarity
 */
const DEFAULT_SIMILARITY_THRESHOLD = 0.7

/**
 * Maximum memories to retrieve per type
 */
const DEFAULT_MEMORY_LIMIT = 5

/**
 * Default weights for hybrid search
 */
const DEFAULT_SEMANTIC_WEIGHT = 0.7
const DEFAULT_KEYWORD_WEIGHT = 0.3

/**
 * Result from hybrid search
 */
export interface HybridSearchResult extends MemorySearchResult {
  semanticScore: number
  keywordScore: number
  combinedScore: number
}

export class MemoryService {
  /**
   * Save a memory with automatic embedding generation
   */
  async saveMemory(input: CreateMemoryInput): Promise<Memory | null> {
    try {
      // Generate embedding for semantic search
      const embedding = await generateEmbedding(input.content)

      // Set expiration for short-term memories
      let expiresAt = input.expiresAt
      if (input.type === 'short_term' && !expiresAt) {
        expiresAt = new Date(Date.now() + SHORT_TERM_TTL_HOURS * 60 * 60 * 1000)
      }

      const rowData = memoryToRow({
        ...input,
        expiresAt,
        embedding,
        metadata: {
          source: input.metadata?.source || 'conversation',
          ...input.metadata,
        },
      })

      const { data, error } = await getAdminSupabase()
        .from('agent_memories' as any)
        .insert(rowData as any)
        .select()
        .single()

      if (error) {
        console.error('[MemoryService] Error saving memory:', error)
        return null
      }

      console.log(`[MemoryService] Saved ${input.type} memory for user ${input.userId}`)
      return rowToMemory(data as unknown as AgentMemoryRow)
    } catch (error) {
      console.error('[MemoryService] Error in saveMemory:', error)
      return null
    }
  }

  /**
   * Search memories using semantic similarity
   */
  async searchMemories(
    userId: string,
    query: string,
    options: MemorySearchOptions = {}
  ): Promise<MemorySearchResult[]> {
    const {
      types = ['long_term', 'fact'],
      limit = DEFAULT_MEMORY_LIMIT,
      threshold = DEFAULT_SIMILARITY_THRESHOLD,
    } = options

    try {
      // Generate embedding for query
      const queryEmbedding = await generateEmbedding(query)

      if (queryEmbedding.length === 0) {
        // Fallback to recent memories if embedding fails
        return this.getRecentMemories(userId, types, limit)
      }

      // Use the search_memories function
      const { data, error } = await getAdminSupabase().rpc('search_memories' as any, {
        p_user_id: userId,
        p_query_embedding: formatEmbeddingForPostgres(queryEmbedding),
        p_match_threshold: threshold,
        p_match_count: limit,
        p_memory_types: types,
      })

      if (error) {
        console.error('[MemoryService] Search error:', error)
        return this.getRecentMemories(userId, types, limit)
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        userId,
        agentId: 'medvision',
        type: row.type as MemoryType,
        content: row.content,
        topic: row.topic,
        confidence: 1.0,
        metadata: row.metadata || {},
        createdAt: new Date(row.created_at),
        similarity: row.similarity,
      }))
    } catch (error) {
      console.error('[MemoryService] Search error:', error)
      return this.getRecentMemories(userId, types, limit)
    }
  }

  /**
   * Hybrid search combining semantic and keyword search
   * Provides better results by leveraging both approaches
   */
  async hybridSearch(
    userId: string,
    query: string,
    options: MemorySearchOptions & {
      semanticWeight?: number
      keywordWeight?: number
    } = {}
  ): Promise<HybridSearchResult[]> {
    const {
      types = ['long_term', 'fact'],
      limit = DEFAULT_MEMORY_LIMIT,
      threshold = DEFAULT_SIMILARITY_THRESHOLD,
    } = options
    const semanticWeight = options.semanticWeight ?? DEFAULT_SEMANTIC_WEIGHT
    const keywordWeight = options.keywordWeight ?? DEFAULT_KEYWORD_WEIGHT

    try {
      // Generate embedding for semantic search
      const queryEmbedding = await generateEmbedding(query)

      if (queryEmbedding.length === 0) {
        // Fallback to keyword-only search if embedding fails
        const keywordResults = await this.keywordSearch(userId, query, { types, limit })
        return keywordResults.map((r) => ({
          ...r,
          semanticScore: 0,
          keywordScore: r.similarity,
          combinedScore: r.similarity,
        }))
      }

      // Use the hybrid_search_memories function
      const { data, error } = await getAdminSupabase().rpc('hybrid_search_memories' as any, {
        p_user_id: userId,
        p_query_embedding: formatEmbeddingForPostgres(queryEmbedding),
        p_query_text: query,
        p_match_threshold: threshold,
        p_match_count: limit,
        p_memory_types: types,
        p_semantic_weight: semanticWeight,
        p_keyword_weight: keywordWeight,
      })

      if (error) {
        console.error('[MemoryService] Hybrid search error:', error)
        // Fallback to semantic-only search
        return (await this.searchMemories(userId, query, { types, limit, threshold })).map(
          (r) => ({
            ...r,
            semanticScore: r.similarity,
            keywordScore: 0,
            combinedScore: r.similarity,
          })
        )
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        userId,
        agentId: 'medvision',
        type: row.type as MemoryType,
        content: row.content,
        topic: row.topic,
        confidence: 1.0,
        metadata: row.metadata || {},
        createdAt: new Date(row.created_at),
        similarity: row.combined_score,
        semanticScore: row.semantic_score,
        keywordScore: row.keyword_score,
        combinedScore: row.combined_score,
      }))
    } catch (error) {
      console.error('[MemoryService] Hybrid search error:', error)
      return this.getRecentMemories(userId, types, limit).then((results) =>
        results.map((r) => ({
          ...r,
          semanticScore: 0,
          keywordScore: 0,
          combinedScore: r.similarity,
        }))
      )
    }
  }

  /**
   * Keyword-only search using PostgreSQL full-text search
   */
  async keywordSearch(
    userId: string,
    query: string,
    options: MemorySearchOptions = {}
  ): Promise<MemorySearchResult[]> {
    const { types = ['long_term', 'fact'], limit = DEFAULT_MEMORY_LIMIT } = options

    try {
      const { data, error } = await getAdminSupabase().rpc('keyword_search_memories' as any, {
        p_user_id: userId,
        p_query: query,
        p_memory_types: types,
        p_limit: limit,
      })

      if (error) {
        console.error('[MemoryService] Keyword search error:', error)
        return []
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        userId,
        agentId: 'medvision',
        type: row.type as MemoryType,
        content: row.content,
        topic: row.topic,
        confidence: 1.0,
        metadata: row.metadata || {},
        createdAt: new Date(row.created_at),
        similarity: row.rank,
      }))
    } catch (error) {
      console.error('[MemoryService] Keyword search error:', error)
      return []
    }
  }

  /**
   * Get recent memories without semantic search (fallback)
   */
  async getRecentMemories(
    userId: string,
    types: MemoryType[] = ['long_term', 'fact'],
    limit: number = DEFAULT_MEMORY_LIMIT
  ): Promise<MemorySearchResult[]> {
    try {
      const { data, error } = await getAdminSupabase().rpc('get_recent_memories' as any, {
        p_user_id: userId,
        p_memory_types: types,
        p_limit: limit,
      })

      if (error) {
        console.error('[MemoryService] Get recent error:', error)
        return []
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        userId,
        agentId: 'medvision',
        type: row.type as MemoryType,
        content: row.content,
        topic: row.topic,
        confidence: 1.0,
        metadata: row.metadata || {},
        createdAt: new Date(row.created_at),
        similarity: 1.0, // No similarity for non-semantic search
      }))
    } catch (error) {
      console.error('[MemoryService] Get recent error:', error)
      return []
    }
  }

  /**
   * Get complete memory context for a user
   */
  async getUserContext(userId: string, currentQuery?: string): Promise<UserMemoryContext> {
    try {
      // Fetch user profile
      const { data: profile } = await getAdminSupabase()
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      // Fetch short-term memories (current session context)
      const shortTerm = await this.getRecentMemories(userId, ['short_term'], 10)

      // Fetch long-term memories (hybrid search if query provided)
      let longTerm: MemorySearchResult[]
      if (currentQuery) {
        // Use hybrid search for better results
        longTerm = await this.hybridSearch(userId, currentQuery, {
          types: ['long_term', 'fact'],
          limit: 5,
        })
      } else {
        longTerm = await this.getRecentMemories(userId, ['long_term', 'fact'], 5)
      }

      // Fetch episodic memories (conversation summaries)
      const episodic = await this.getRecentMemories(userId, ['episodic'], 3)

      return {
        shortTerm,
        longTerm,
        episodic,
        profile: profile ? this.mapProfile(profile) : null,
      }
    } catch (error) {
      console.error('[MemoryService] getUserContext error:', error)
      return {
        shortTerm: [],
        longTerm: [],
        episodic: [],
        profile: null,
      }
    }
  }

  /**
   * Map database profile to UserProfile type
   */
  private mapProfile(dbProfile: any): UserProfile {
    return {
      id: dbProfile.id,
      university: dbProfile.university,
      semester: dbProfile.semester,
      specialty: dbProfile.specialty_interest,
      level: dbProfile.level,
      learningStyle: dbProfile.learning_style,
      responsePreference: dbProfile.response_preference || 'hybrid',
      knowledgeGaps: dbProfile.knowledge_gaps || [],
      masteredTopics: dbProfile.mastered_topics || [],
      setupLevel: dbProfile.setup_level || 1,
      setupCompletedAt: dbProfile.setup_completed_at
        ? new Date(dbProfile.setup_completed_at)
        : undefined,
      conversationCount: dbProfile.conversation_count || 0,
    }
  }

  /**
   * Save episodic memory (conversation summary)
   */
  async saveEpisodicMemory(
    userId: string,
    sessionId: string,
    summary: string,
    topics: string[]
  ): Promise<Memory | null> {
    return this.saveMemory({
      userId,
      agentId: 'medvision',
      type: 'episodic',
      content: summary,
      topic: topics.join(', '),
      sessionId,
      metadata: {
        source: 'extraction',
        keywords: topics,
      },
    })
  }

  /**
   * Cleanup expired memories
   */
  async cleanupExpiredMemories(): Promise<number> {
    try {
      const { data, error } = await getAdminSupabase().rpc('cleanup_expired_memories' as any)

      if (error) {
        console.error('[MemoryService] Cleanup error:', error)
        return 0
      }

      console.log(`[MemoryService] Cleaned up ${data} expired memories`)
      return data || 0
    } catch (error) {
      console.error('[MemoryService] Cleanup error:', error)
      return 0
    }
  }

  /**
   * Delete all memories for a user (for /memory clear command)
   */
  async clearUserMemories(userId: string, types?: MemoryType[]): Promise<boolean> {
    try {
      let query = getAdminSupabase().from('agent_memories' as any).delete().eq('user_id', userId)

      if (types && types.length > 0) {
        query = query.in('type', types)
      }

      const { error } = await query

      if (error) {
        console.error('[MemoryService] Clear error:', error)
        return false
      }

      console.log(`[MemoryService] Cleared memories for user ${userId}`)
      return true
    } catch (error) {
      console.error('[MemoryService] Clear error:', error)
      return false
    }
  }

  /**
   * Update user profile with new information
   */
  async updateUserProfile(
    userId: string,
    updates: Partial<UserProfile>
  ): Promise<boolean> {
    try {
      const dbUpdates: Record<string, any> = {}

      if (updates.university !== undefined) dbUpdates.university = updates.university
      if (updates.semester !== undefined) dbUpdates.semester = updates.semester
      if (updates.specialty !== undefined) dbUpdates.specialty_interest = updates.specialty
      if (updates.level !== undefined) dbUpdates.level = updates.level
      if (updates.learningStyle !== undefined) dbUpdates.learning_style = updates.learningStyle
      if (updates.responsePreference !== undefined)
        dbUpdates.response_preference = updates.responsePreference
      if (updates.knowledgeGaps !== undefined) dbUpdates.knowledge_gaps = updates.knowledgeGaps
      if (updates.masteredTopics !== undefined) dbUpdates.mastered_topics = updates.masteredTopics
      if (updates.setupLevel !== undefined) dbUpdates.setup_level = updates.setupLevel
      if (updates.setupCompletedAt !== undefined)
        dbUpdates.setup_completed_at = updates.setupCompletedAt?.toISOString()

      if (Object.keys(dbUpdates).length === 0) {
        return true
      }

      const { error } = await getAdminSupabase()
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId)

      if (error) {
        console.error('[MemoryService] Profile update error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('[MemoryService] Profile update error:', error)
      return false
    }
  }

  /**
   * Increment conversation count for progressive setup
   */
  async incrementConversationCount(userId: string): Promise<number> {
    try {
      const { data, error } = await getAdminSupabase()
        .from('profiles')
        .select('conversation_count')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('[MemoryService] Get count error:', error)
        return 0
      }

      const newCount = ((data as any)?.conversation_count || 0) + 1

      await getAdminSupabase()
        .from('profiles')
        .update({ conversation_count: newCount } as any)
        .eq('id', userId)

      return newCount
    } catch (error) {
      console.error('[MemoryService] Increment count error:', error)
      return 0
    }
  }
}

// Singleton instance
export const memoryService = new MemoryService()

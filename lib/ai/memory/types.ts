/**
 * Memory Types for Odonto GPT
 *
 * Defines the structure for the memory system including:
 * - Short-term (session context)
 * - Long-term (persistent facts)
 * - Episodic (conversation summaries)
 */

export type MemoryType = 'short_term' | 'long_term' | 'episodic' | 'fact'

export type MemorySource = 'conversation' | 'artifact' | 'manual' | 'extraction'

export type LearningStyle = 'visual' | 'reading' | 'practice' | 'mixed'

export type ResponsePreference = 'direct' | 'didactic' | 'hybrid'

/**
 * Core memory structure
 */
export interface Memory {
  id: string
  userId: string
  agentId: string
  type: MemoryType
  content: string
  embedding?: number[]
  topic?: string
  confidence: number
  metadata: MemoryMetadata
  sessionId?: string
  createdAt: Date
  expiresAt?: Date
}

export interface MemoryMetadata {
  entities?: string[]
  source: MemorySource
  keywords?: string[]
  relatedMemories?: string[]
  importance?: 'low' | 'medium' | 'high'
}

/**
 * Memory creation input (without auto-generated fields)
 */
export interface CreateMemoryInput {
  userId: string
  agentId?: string
  type: MemoryType
  content: string
  topic?: string
  confidence?: number
  metadata?: Partial<MemoryMetadata>
  sessionId?: string
  expiresAt?: Date
}

/**
 * User profile structure for context
 */
export interface UserProfile {
  id: string
  name?: string
  email?: string
  university?: string
  semester?: string
  specialty?: string
  level?: string
  profession?: string
  cro?: string
  learningStyle?: LearningStyle
  responsePreference?: ResponsePreference
  knowledgeGaps?: string[]
  masteredTopics?: string[]
  setupLevel?: 1 | 2 | 3
  setupCompletedAt?: Date
  conversationCount?: number
}

/**
 * Complete memory context for a user
 */
export interface UserMemoryContext {
  shortTerm: Memory[]
  longTerm: Memory[]
  episodic: Memory[]
  profile: UserProfile | null
}

/**
 * Search options for memory retrieval
 */
export interface MemorySearchOptions {
  types?: MemoryType[]
  topic?: string
  limit?: number
  threshold?: number
  includeExpired?: boolean
}

/**
 * Result from semantic search
 */
export interface MemorySearchResult extends Memory {
  similarity: number
}

/**
 * Result from hybrid search (semantic + keyword)
 */
export interface HybridSearchResult extends MemorySearchResult {
  semanticScore: number
  keywordScore: number
  combinedScore: number
}

/**
 * Extracted fact from conversation
 */
export interface ExtractedFact {
  content: string
  type: 'fact' | 'long_term'
  topic?: string
  confidence: number
  entities?: string[]
}

/**
 * Session summary for episodic memory
 */
export interface SessionSummary {
  sessionId: string
  userId: string
  summary: string
  topics: string[]
  keyPoints: string[]
  artifactsGenerated?: string[]
  questionsAsked?: string[]
  duration?: number
}

/**
 * Database row type for agent_memories
 */
export interface AgentMemoryRow {
  id: string
  user_id: string
  agent_id: string
  content: string
  type: string
  topic: string | null
  confidence: number | null
  embedding: number[] | null
  metadata: Record<string, unknown>
  session_id: string | null
  expires_at: string | null
  shared: boolean
  created_at: string
}

/**
 * Convert database row to Memory type
 */
export function rowToMemory(row: AgentMemoryRow): Memory {
  return {
    id: row.id,
    userId: row.user_id,
    agentId: row.agent_id,
    type: row.type as MemoryType,
    content: row.content,
    topic: row.topic || undefined,
    confidence: row.confidence || 1.0,
    embedding: row.embedding || undefined,
    metadata: (row.metadata as unknown) as MemoryMetadata,
    sessionId: row.session_id || undefined,
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    createdAt: new Date(row.created_at),
  }
}

/**
 * Convert Memory to database insert format
 */
export function memoryToRow(
  memory: CreateMemoryInput & { embedding?: number[] }
): Partial<AgentMemoryRow> {
  return {
    user_id: memory.userId,
    agent_id: memory.agentId || 'odonto-gpt',
    content: memory.content,
    type: memory.type,
    topic: memory.topic || null,
    confidence: memory.confidence || 1.0,
    embedding: memory.embedding || null,
    metadata: (memory.metadata as Record<string, unknown>) || {},
    session_id: memory.sessionId || null,
    expires_at: memory.expiresAt?.toISOString() || null,
    shared: true,
  }
}

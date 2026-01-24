/**
 * Memory System for Odonto GPT
 *
 * Unified exports for the memory system including:
 * - Types and interfaces
 * - Memory service (save, search, context)
 * - Embeddings generation
 * - Fact extraction from conversations
 */

// Types
export * from './types'

// Services
export { MemoryService, memoryService } from './service'

// Embeddings
export {
  generateEmbedding,
  generateEmbeddings,
  cosineSimilarity,
  formatEmbeddingForPostgres,
  parseEmbeddingFromPostgres,
  EMBEDDING_CONFIG,
} from './embeddings'

// Extraction
export {
  extractFacts,
  summarizeSession,
  processConversation,
  processSessionEnd,
  classifyQueryType,
} from './extractor'

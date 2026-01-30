/**
 * Índice de Ferramentas do AI SDK
 * 
 * Exporta todas as ferramentas disponíveis para o modelo.
 */

// Ferramentas de Pesquisa
export { askPerplexity, searchPubMed } from './research'

// Ferramentas de Artefatos
export { createSummary, createFlashcards, createMindMap } from './artifacts'

// Objeto consolidado de ferramentas para uso com streamText
import { askPerplexity, searchPubMed } from './research'
import { createSummary, createFlashcards, createMindMap } from './artifacts'

export const tools = {
  // Pesquisa
  askPerplexity,
  searchPubMed,
  
  // Artefatos
  createSummary,
  createFlashcards,
  createMindMap,
}

export type ToolName = keyof typeof tools

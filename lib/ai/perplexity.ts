/**
 * Perplexity AI Integration
 *
 * Uses Perplexity Sonar API for research with real-time web citations.
 * Model: llama-3.1-sonar-large-128k-online
 */

import { createOpenAI } from '@ai-sdk/openai'

// Perplexity AI provider using OpenAI-compatible API
export const perplexity = createOpenAI({
  apiKey: process.env.PERPLEXITY_API_KEY || '',
  baseURL: 'https://api.perplexity.ai',
  name: 'perplexity',
})

// Model for research with online search
export const PERPLEXITY_RESEARCH_MODEL = 'llama-3.1-sonar-large-128k-online'

// Alternative model for faster responses
export const PERPLEXITY_FAST_MODEL = 'llama-3.1-sonar-small-128k-online'

/**
 * Research configuration options
 */
export interface PerplexityResearchOptions {
  query: string
  scope: 'pubmed' | 'scholar' | 'recent' | 'comprehensive'
  language: 'pt' | 'en' | 'both'
  maxSources?: number
}

/**
 * Build a research prompt for Perplexity
 */
export function buildResearchPrompt(options: PerplexityResearchOptions): string {
  const scopeInstructions: Record<string, string> = {
    pubmed: 'Foque em artigos do PubMed e revistas científicas médicas/odontológicas indexadas.',
    scholar: 'Busque artigos acadêmicos do Google Scholar, teses e dissertações.',
    recent: 'Priorize publicações dos últimos 2 anos (2024-2026) e tendências atuais.',
    comprehensive: 'Faça uma busca abrangente incluindo artigos científicos, guidelines e revisões sistemáticas.',
  }

  const languageInstructions: Record<string, string> = {
    pt: 'Busque principalmente fontes em português.',
    en: 'Busque principalmente fontes em inglês.',
    both: 'Busque fontes em português e inglês, priorizando qualidade.',
  }

  return `Realize uma pesquisa científica profunda sobre: "${options.query}"

ESCOPO: ${scopeInstructions[options.scope]}
IDIOMA: ${languageInstructions[options.language]}

INSTRUÇÕES:
1. Busque evidências científicas recentes e confiáveis
2. Cite TODAS as fontes com URLs reais e acessíveis
3. Classifique o nível de evidência de cada achado
4. Use linguagem técnica odontológica adequada
5. Organize em seções lógicas

FORMATO DE RESPOSTA (JSON):
{
  "title": "Título da pesquisa científica",
  "abstract": "Resumo executivo em 2-3 parágrafos",
  "sections": [
    {
      "title": "Título da Seção",
      "content": "Conteúdo em markdown",
      "citations": [1, 2]
    }
  ],
  "sources": [
    {
      "id": 1,
      "title": "Título do artigo",
      "authors": "Autor et al.",
      "journal": "Nome do periódico",
      "year": "2024",
      "url": "https://...",
      "evidenceLevel": "Alta/Média/Baixa"
    }
  ],
  "conclusion": "Conclusão baseada nas evidências",
  "keywords": ["palavra-chave1", "palavra-chave2"]
}

IMPORTANTE: Retorne APENAS o JSON válido, sem texto adicional.`
}

/**
 * Evidence level classification
 */
export const EVIDENCE_LEVELS = {
  systematic_review: { label: 'Revisão Sistemática', level: 'I', color: 'emerald' },
  rct: { label: 'Ensaio Clínico Randomizado', level: 'II', color: 'green' },
  cohort: { label: 'Estudo de Coorte', level: 'III', color: 'blue' },
  case_control: { label: 'Caso-Controle', level: 'IV', color: 'amber' },
  case_series: { label: 'Série de Casos', level: 'V', color: 'orange' },
  expert_opinion: { label: 'Opinião de Especialista', level: 'VI', color: 'gray' },
}

/**
 * Get evidence level badge props
 */
export function getEvidenceLevelBadge(level: string): { label: string; color: string } {
  const lowerLevel = level.toLowerCase()

  if (lowerLevel.includes('alta') || lowerLevel.includes('high') || lowerLevel.includes('i')) {
    return { label: 'Alta', color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' }
  }
  if (lowerLevel.includes('média') || lowerLevel.includes('medium') || lowerLevel.includes('ii')) {
    return { label: 'Média', color: 'bg-amber-500/10 text-amber-500 border-amber-500/30' }
  }
  return { label: 'Baixa', color: 'bg-red-500/10 text-red-500 border-red-500/30' }
}

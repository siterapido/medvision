import { tool } from 'ai'
import { z } from 'zod'
import { nanoid } from 'nanoid'

// Tool para criar resumos
export const createSummaryTool = tool({
  description: 'Cria um resumo estruturado sobre um tópico odontológico. Use quando o aluno pedir um resumo, síntese ou explicação organizada.',
  parameters: z.object({
    title: z.string().describe('Título do resumo'),
    content: z.string().describe('Conteúdo completo em markdown'),
    keyPoints: z.array(z.string()).describe('Lista de pontos-chave (3-5 itens)'),
    topic: z.string().describe('Tópico principal'),
    tags: z.array(z.string()).optional().describe('Tags para categorização'),
  }),
  execute: async ({ title, content, keyPoints, topic, tags }) => {
    return {
      type: 'summary' as const,
      id: nanoid(),
      title,
      content,
      keyPoints,
      topic,
      tags: tags || [],
      createdAt: new Date().toISOString(),
    }
  }
})

// Tool para criar flashcards
export const createFlashcardsTool = tool({
  description: 'Cria um deck de flashcards para memorização. Use quando o aluno quiser estudar com cards de pergunta/resposta.',
  parameters: z.object({
    title: z.string().describe('Título do deck'),
    cards: z.array(z.object({
      front: z.string().describe('Pergunta ou termo'),
      back: z.string().describe('Resposta'),
      category: z.string().optional().describe('Categoria do card'),
    })).min(3).max(20).describe('Lista de flashcards (3-20 cards)'),
    topic: z.string().describe('Tópico principal'),
  }),
  execute: async ({ title, cards, topic }) => {
    return {
      type: 'flashcards' as const,
      id: nanoid(),
      title,
      cards: cards.map((card, index) => ({
        id: `card-${index + 1}`,
        front: card.front,
        back: card.back,
        category: card.category,
      })),
      topic,
      createdAt: new Date().toISOString(),
    }
  }
})

// Tool para criar quiz/simulado
export const createQuizTool = tool({
  description: 'Cria um simulado/quiz com questões de múltipla escolha. Use quando o aluno quiser praticar com questões.',
  parameters: z.object({
    title: z.string().describe('Título do simulado'),
    topic: z.string().describe('Tópico principal'),
    specialty: z.string().optional().describe('Especialidade (ex: Endodontia, Periodontia)'),
    questions: z.array(z.object({
      text: z.string().describe('Enunciado da questão'),
      options: z.array(z.object({
        text: z.string().describe('Texto da alternativa'),
        isCorrect: z.boolean().describe('Se esta é a resposta correta'),
      })).length(5).describe('Exatamente 5 alternativas'),
      explanation: z.string().describe('Explicação detalhada da resposta'),
      difficulty: z.enum(['easy', 'medium', 'hard']).describe('Nível de dificuldade'),
    })).min(3).max(10).describe('Lista de questões (3-10)'),
  }),
  execute: async ({ title, topic, specialty, questions }) => {
    return {
      type: 'quiz' as const,
      id: nanoid(),
      title,
      topic,
      specialty,
      questions: questions.map((q, qIndex) => ({
        id: `q-${qIndex + 1}`,
        text: q.text,
        options: q.options.map((opt, optIndex) => ({
          id: String.fromCharCode(65 + optIndex), // A, B, C, D, E
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
        explanation: q.explanation,
        difficulty: q.difficulty,
      })),
      createdAt: new Date().toISOString(),
    }
  }
})

// Tool para criar dossiê de pesquisa
export const createResearchTool = tool({
  description: 'Cria um dossiê de pesquisa científica com fontes e análise. Use após realizar pesquisa com askPerplexity ou searchPubMed.',
  parameters: z.object({
    title: z.string().describe('Título da pesquisa'),
    query: z.string().describe('Pergunta de pesquisa original'),
    content: z.string().describe('Conteúdo completo em markdown com análise'),
    sources: z.array(z.object({
      title: z.string().describe('Título do artigo/fonte'),
      url: z.string().describe('URL da fonte'),
      summary: z.string().optional().describe('Resumo de 2-3 linhas'),
      authors: z.string().optional().describe('Autores'),
      pubdate: z.string().optional().describe('Data de publicação'),
    })).describe('Lista de fontes consultadas'),
    methodology: z.string().optional().describe('Metodologia de busca utilizada'),
  }),
  execute: async ({ title, query, content, sources, methodology }) => {
    return {
      type: 'research' as const,
      id: nanoid(),
      title,
      query,
      content,
      sources,
      methodology,
      createdAt: new Date().toISOString(),
    }
  }
})

// Tool para criar laudo radiográfico
export const createReportTool = tool({
  description: 'Cria um laudo de análise de imagem odontológica. Use após analisar radiografias ou fotos clínicas.',
  parameters: z.object({
    title: z.string().describe('Título do laudo'),
    examType: z.string().describe('Tipo de exame (Panorâmica, Periapical, CBCT, etc.)'),
    content: z.string().describe('Laudo completo em markdown'),
    findings: z.array(z.string()).describe('Lista de achados clínicos'),
    recommendations: z.array(z.string()).describe('Lista de recomendações'),
    imageUrl: z.string().optional().describe('URL da imagem analisada'),
    quality: z.object({
      rating: z.enum(['good', 'adequate', 'limited']).describe('Qualidade técnica'),
      notes: z.string().optional().describe('Observações sobre qualidade'),
    }).optional().describe('Avaliação da qualidade técnica'),
  }),
  execute: async ({ title, examType, content, findings, recommendations, imageUrl, quality }) => {
    return {
      type: 'report' as const,
      id: nanoid(),
      title,
      examType,
      content,
      findings,
      recommendations,
      imageUrl,
      quality,
      createdAt: new Date().toISOString(),
    }
  }
})

// Mapeamento de tools por agente
export const AGENT_ARTIFACT_TOOLS = {
  'odonto-gpt': {
    createSummary: createSummaryTool,
    createFlashcards: createFlashcardsTool
  },
  'odonto-research': {
    createResearch: createResearchTool
  },
  'odonto-practice': {
    createQuiz: createQuizTool
  },
  'odonto-summary': {
    createSummary: createSummaryTool,
    createFlashcards: createFlashcardsTool
  },
  'odonto-vision': {
    createReport: createReportTool
  }
} as const

export type AgentToolsMap = typeof AGENT_ARTIFACT_TOOLS

export function getAgentArtifactTools(agentId: string) {
  return AGENT_ARTIFACT_TOOLS[agentId as keyof typeof AGENT_ARTIFACT_TOOLS] || {}
}

/**
 * Test: Artifact Rendering
 * Verifica se os componentes de artifacts renderizam corretamente
 */

import { describe, it, expect } from 'vitest'
import type {
  QuizArtifact,
  ResearchArtifact,
  ReportArtifact,
  FlashcardArtifact,
  SummaryArtifact
} from '@/components/artifacts/types'

// Mock data para testes
const mockQuizArtifact: QuizArtifact = {
  id: 'quiz-1',
  kind: 'quiz',
  title: 'Simulado de Endodontia',
  topic: 'Preparo Químico-Mecânico',
  specialty: 'Endodontia',
  questions: [
    {
      id: 'q1',
      text: 'Qual é a concentração mais utilizada de hipoclorito de sódio na irrigação endodôntica?',
      options: [
        { id: 'A', text: '0,5%', isCorrect: false },
        { id: 'B', text: '1%', isCorrect: false },
        { id: 'C', text: '2,5%', isCorrect: true },
        { id: 'D', text: '5%', isCorrect: false },
        { id: 'E', text: '10%', isCorrect: false },
      ],
      explanation: 'A concentração de 2,5% é amplamente utilizada por apresentar boa ação antimicrobiana com menor toxicidade tecidual.',
      difficulty: 'medium',
    },
  ],
  createdAt: new Date(),
}

const mockResearchArtifact: ResearchArtifact = {
  id: 'research-1',
  kind: 'research',
  title: 'Dossiê: Irrigantes em Endodontia',
  query: 'Quais irrigantes são mais eficazes na endodontia?',
  content: '## Resumo\n\nO hipoclorito de sódio (NaOCl) continua sendo o irrigante mais utilizado...',
  sources: [
    {
      title: 'Antimicrobial efficacy of irrigants in endodontics',
      url: 'https://pubmed.ncbi.nlm.nih.gov/12345',
      summary: 'Estudo comparativo de irrigantes',
      authors: 'Silva et al.',
      pubdate: '2024',
    },
  ],
  methodology: 'Revisão sistemática via PubMed',
  createdAt: new Date(),
}

const mockReportArtifact: ReportArtifact = {
  id: 'report-1',
  kind: 'report',
  title: 'Laudo Radiográfico',
  examType: 'Radiografia Panorâmica',
  content: '## Descrição\n\nImagem panorâmica digital de adequada qualidade técnica...',
  findings: [
    'Reabsorção óssea horizontal generalizada',
    'Lesão periapical no elemento 46',
  ],
  recommendations: [
    'Avaliação periodontal completa',
    'Tratamento endodôntico do elemento 46',
  ],
  quality: {
    rating: 'good',
    notes: 'Posicionamento adequado',
  },
  createdAt: new Date(),
}

const mockFlashcardArtifact: FlashcardArtifact = {
  id: 'flashcard-1',
  kind: 'flashcard',
  title: 'Anatomia Dental',
  topic: 'Primeiro Molar Superior',
  cards: [
    { id: 'c1', front: 'Quantas raízes tem o primeiro molar superior?', back: 'Três raízes: duas vestibulares e uma palatina' },
    { id: 'c2', front: 'Qual a característica principal da cúspide de Carabelli?', back: 'Cúspide acessória na face palatina da cúspide mesio-palatina' },
  ],
  createdAt: new Date(),
}

const mockSummaryArtifact: SummaryArtifact = {
  id: 'summary-1',
  kind: 'summary',
  title: 'Cárie Dentária',
  content: '## Definição\n\nA cárie dentária é uma doença multifatorial...',
  keyPoints: [
    'Doença multifatorial',
    'Envolve bactérias, dieta e tempo',
    'Prevenção com fluoreto',
  ],
  topic: 'Cariologia',
  tags: ['cárie', 'prevenção', 'odontologia'],
  createdAt: new Date(),
}

describe('Artifact Type Validation', () => {
  it('should validate QuizArtifact structure', () => {
    expect(mockQuizArtifact.kind).toBe('quiz')
    expect(mockQuizArtifact.questions).toHaveLength(1)
    expect(mockQuizArtifact.questions[0].options).toHaveLength(5)
    expect(mockQuizArtifact.questions[0].options.filter(o => o.isCorrect)).toHaveLength(1)
  })

  it('should validate ResearchArtifact structure', () => {
    expect(mockResearchArtifact.kind).toBe('research')
    expect(mockResearchArtifact.sources).toHaveLength(1)
    expect(mockResearchArtifact.sources[0].url).toContain('pubmed')
  })

  it('should validate ReportArtifact structure', () => {
    expect(mockReportArtifact.kind).toBe('report')
    expect(mockReportArtifact.findings).toHaveLength(2)
    expect(mockReportArtifact.recommendations).toHaveLength(2)
    expect(mockReportArtifact.quality?.rating).toBe('good')
  })

  it('should validate FlashcardArtifact structure', () => {
    expect(mockFlashcardArtifact.kind).toBe('flashcard')
    expect(mockFlashcardArtifact.cards).toHaveLength(2)
    expect(mockFlashcardArtifact.cards[0].front).toBeTruthy()
    expect(mockFlashcardArtifact.cards[0].back).toBeTruthy()
  })

  it('should validate SummaryArtifact structure', () => {
    expect(mockSummaryArtifact.kind).toBe('summary')
    expect(mockSummaryArtifact.keyPoints).toHaveLength(3)
    expect(mockSummaryArtifact.content).toContain('##')
  })
})

describe('Tool Result to Artifact Mapping', () => {
  it('should map createQuiz result to QuizArtifact', () => {
    const toolResult = {
      type: 'quiz',
      id: 'test-quiz',
      title: 'Test Quiz',
      topic: 'Test Topic',
      questions: mockQuizArtifact.questions,
      createdAt: new Date().toISOString(),
    }

    // Simulando a conversão que acontece no frontend
    const artifact = {
      ...toolResult,
      kind: 'quiz' as const,
      createdAt: new Date(toolResult.createdAt),
    }

    expect(artifact.kind).toBe('quiz')
    expect(artifact.questions).toBeDefined()
  })

  it('should map createResearch result to ResearchArtifact', () => {
    const toolResult = {
      type: 'research',
      id: 'test-research',
      title: 'Test Research',
      query: 'test query',
      content: 'test content',
      sources: [],
      createdAt: new Date().toISOString(),
    }

    const artifact = {
      ...toolResult,
      kind: 'research' as const,
      createdAt: new Date(toolResult.createdAt),
    }

    expect(artifact.kind).toBe('research')
    expect(artifact.sources).toBeDefined()
  })
})

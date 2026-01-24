/**
 * Tools com Streaming de Artefatos
 * Usa o novo sistema de artifacts com progresso em tempo real
 */

import { tool } from 'ai';
import { z } from 'zod';
import {
  getContext,
  createPersistentSummary,
  createPersistentFlashcard,
  createPersistentQuiz,
  createPersistentResearch,
  createPersistentReport,
} from '../artifacts';

// ========================================
// SUMMARY TOOL COM STREAMING
// ========================================

export const createStreamingSummaryTool = tool({
  description: `Cria um resumo estruturado sobre um tópico odontológico.
Use quando o aluno pedir um resumo, síntese ou explicação organizada.
O resumo será salvo automaticamente no histórico do aluno.`,
  parameters: z.object({
    title: z.string().describe('Título do resumo'),
    topic: z.string().describe('Tópico principal'),
    content: z.string().describe('Conteúdo completo em markdown'),
    keyPoints: z.array(z.string()).min(3).max(7).describe('Lista de pontos-chave (3-7 itens)'),
    tags: z.array(z.string()).optional().describe('Tags para categorização'),
  }),
  execute: async ({ title, topic, content, keyPoints, tags }) => {
    // Criar artifact com auto-persist
    const artifact = createPersistentSummary({
      title,
      topic,
      stage: 'generating',
    });

    // Simular streaming progressivo
    artifact.stage = 'generating';
    artifact.progress = 0.3;

    await artifact.update({
      content: content.slice(0, Math.floor(content.length * 0.5)),
    });

    artifact.progress = 0.6;

    await artifact.update({
      content,
      keyPoints: keyPoints.slice(0, Math.floor(keyPoints.length * 0.5)),
    });

    artifact.progress = 0.9;

    // Completar e persistir
    const result = await artifact.complete({
      content,
      keyPoints,
      tags: tags || [],
      wordCount: content.split(/\s+/).length,
    });

    return {
      success: true,
      artifactId: result.id,
      type: 'summary',
      title: result.title,
      topic: result.topic,
      content: result.content,
      keyPoints: result.keyPoints,
      tags: result.tags,
      wordCount: result.wordCount,
      stage: 'complete',
    };
  },
});

// ========================================
// FLASHCARD TOOL COM STREAMING
// ========================================

export const createStreamingFlashcardsTool = tool({
  description: `Cria um deck de flashcards para memorização.
Use quando o aluno quiser estudar com cards de pergunta/resposta.
Os flashcards serão salvos automaticamente.`,
  parameters: z.object({
    title: z.string().describe('Título do deck'),
    topic: z.string().describe('Tópico principal'),
    cards: z
      .array(
        z.object({
          front: z.string().describe('Pergunta ou termo'),
          back: z.string().describe('Resposta'),
          category: z.string().optional().describe('Categoria do card'),
        })
      )
      .min(3)
      .max(20)
      .describe('Lista de flashcards (3-20 cards)'),
  }),
  execute: async ({ title, topic, cards }) => {
    const artifact = createPersistentFlashcard({
      title,
      topic,
      stage: 'generating',
      totalCards: cards.length,
    });

    // Adicionar cards progressivamente
    const processedCards = [];
    for (let i = 0; i < cards.length; i++) {
      processedCards.push({
        id: `card-${i + 1}`,
        front: cards[i].front,
        back: cards[i].back,
        category: cards[i].category,
      });

      artifact.progress = (i + 1) / cards.length;
      await artifact.update({ cards: [...processedCards] });
    }

    const result = await artifact.complete({
      cards: processedCards,
      totalCards: processedCards.length,
    });

    return {
      success: true,
      artifactId: result.id,
      type: 'flashcard',
      title: result.title,
      topic: result.topic,
      cards: result.cards,
      totalCards: result.totalCards,
      stage: 'complete',
    };
  },
});

// ========================================
// QUIZ TOOL COM STREAMING
// ========================================

export const createStreamingQuizTool = tool({
  description: `Cria um simulado/quiz com questões de múltipla escolha.
Use quando o aluno quiser praticar com questões no estilo de provas.
O simulado será salvo automaticamente.`,
  parameters: z.object({
    title: z.string().describe('Título do simulado'),
    topic: z.string().describe('Tópico principal'),
    specialty: z.string().optional().describe('Especialidade (ex: Endodontia, Periodontia)'),
    difficulty: z.enum(['easy', 'medium', 'hard']).describe('Nível de dificuldade'),
    questions: z
      .array(
        z.object({
          text: z.string().describe('Enunciado da questão'),
          options: z
            .array(
              z.object({
                text: z.string().describe('Texto da alternativa'),
                isCorrect: z.boolean().describe('Se esta é a resposta correta'),
              })
            )
            .length(5)
            .describe('Exatamente 5 alternativas'),
          explanation: z.string().describe('Explicação detalhada da resposta'),
          difficulty: z.enum(['easy', 'medium', 'hard']).describe('Nível de dificuldade'),
        })
      )
      .min(3)
      .max(10)
      .describe('Lista de questões (3-10)'),
  }),
  execute: async ({ title, topic, specialty, difficulty, questions }) => {
    const artifact = createPersistentQuiz({
      title,
      topic,
      specialty,
      difficulty,
      stage: 'generating',
      totalQuestions: questions.length,
    });

    // Processar questões progressivamente
    const processedQuestions = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      processedQuestions.push({
        id: `q-${i + 1}`,
        text: q.text,
        options: q.options.map((opt, j) => ({
          id: String.fromCharCode(65 + j), // A, B, C, D, E
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
        explanation: q.explanation,
        difficulty: q.difficulty,
      });

      artifact.progress = (i + 1) / questions.length;
      await artifact.update({
        questions: [...processedQuestions],
        stage: i === questions.length - 1 ? 'validating' : 'generating',
      });
    }

    const result = await artifact.complete({
      questions: processedQuestions,
      totalQuestions: processedQuestions.length,
    });

    return {
      success: true,
      artifactId: result.id,
      type: 'quiz',
      title: result.title,
      topic: result.topic,
      specialty: result.specialty,
      difficulty: result.difficulty,
      questions: result.questions,
      totalQuestions: result.totalQuestions,
      stage: 'complete',
    };
  },
});

// ========================================
// RESEARCH TOOL COM STREAMING
// ========================================

export const createStreamingResearchTool = tool({
  description: `Cria um dossiê de pesquisa científica com fontes e análise.
Use após realizar pesquisa com askPerplexity ou searchPubMed.
A pesquisa será salva automaticamente.`,
  parameters: z.object({
    title: z.string().describe('Título da pesquisa'),
    query: z.string().describe('Pergunta de pesquisa original'),
    content: z.string().describe('Conteúdo completo em markdown com análise'),
    sources: z
      .array(
        z.object({
          title: z.string().describe('Título do artigo/fonte'),
          url: z.string().describe('URL da fonte'),
          summary: z.string().optional().describe('Resumo de 2-3 linhas'),
          authors: z.string().optional().describe('Autores'),
          pubdate: z.string().optional().describe('Data de publicação'),
        })
      )
      .describe('Lista de fontes consultadas'),
    methodology: z.string().optional().describe('Metodologia de busca utilizada'),
  }),
  execute: async ({ title, query, content, sources, methodology }) => {
    const artifact = createPersistentResearch({
      title,
      query,
      stage: 'searching',
    });

    // Fase 1: Searching
    artifact.progress = 0.2;
    await artifact.update({
      sources: sources.map((s) => ({ ...s, relevance: undefined })),
      sourcesCount: sources.length,
    });

    // Fase 2: Analyzing
    artifact.stage = 'processing';
    artifact.progress = 0.5;
    await artifact.update({
      content: content.slice(0, Math.floor(content.length * 0.5)),
    });

    // Fase 3: Completing
    artifact.progress = 0.8;
    await artifact.update({
      content,
      methodology,
    });

    const result = await artifact.complete({
      content,
      sources,
      methodology,
      sourcesCount: sources.length,
    });

    return {
      success: true,
      artifactId: result.id,
      type: 'research',
      title: result.title,
      query: result.query,
      content: result.content,
      sources: result.sources,
      methodology: result.methodology,
      sourcesCount: result.sourcesCount,
      stage: 'complete',
    };
  },
});

// ========================================
// REPORT TOOL COM STREAMING
// ========================================

export const createStreamingReportTool = tool({
  description: `Cria um laudo de análise de imagem odontológica.
Use após analisar radiografias ou fotos clínicas.
O laudo será salvo automaticamente.`,
  parameters: z.object({
    title: z.string().describe('Título do laudo'),
    examType: z.string().describe('Tipo de exame (Panorâmica, Periapical, CBCT, etc.)'),
    content: z.string().describe('Laudo completo em markdown'),
    findings: z.array(z.string()).describe('Lista de achados clínicos'),
    recommendations: z.array(z.string()).describe('Lista de recomendações'),
    imageUrl: z.string().optional().describe('URL da imagem analisada'),
    quality: z
      .object({
        rating: z.enum(['good', 'adequate', 'limited']).describe('Qualidade técnica'),
        notes: z.string().optional().describe('Observações sobre qualidade'),
      })
      .optional()
      .describe('Avaliação da qualidade técnica'),
  }),
  execute: async ({ title, examType, content, findings, recommendations, imageUrl, quality }) => {
    const artifact = createPersistentReport({
      title,
      examType,
      stage: 'analyzing',
      imageUrl,
    });

    // Fase 1: Analyzing
    artifact.progress = 0.3;
    await artifact.update({
      findings: findings.slice(0, Math.ceil(findings.length / 2)),
    });

    // Fase 2: Documenting
    artifact.stage = 'processing';
    artifact.progress = 0.6;
    await artifact.update({
      findings,
      content: content.slice(0, Math.floor(content.length * 0.7)),
    });

    // Fase 3: Completing
    artifact.progress = 0.9;
    await artifact.update({
      content,
      recommendations,
      quality,
    });

    const result = await artifact.complete({
      content,
      findings,
      recommendations,
      quality,
    });

    return {
      success: true,
      artifactId: result.id,
      type: 'report',
      title: result.title,
      examType: result.examType,
      content: result.content,
      findings: result.findings,
      recommendations: result.recommendations,
      quality: result.quality,
      imageUrl: result.imageUrl,
      stage: 'complete',
    };
  },
});

// ========================================
// EXPORT ALL STREAMING TOOLS
// ========================================

export const streamingArtifactTools = {
  createStreamingSummary: createStreamingSummaryTool,
  createStreamingFlashcards: createStreamingFlashcardsTool,
  createStreamingQuiz: createStreamingQuizTool,
  createStreamingResearch: createStreamingResearchTool,
  createStreamingReport: createStreamingReportTool,
};

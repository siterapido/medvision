import { z } from 'zod'
import type { DocumentHandler, QuizDocument, QuizParams, QuizQuestion } from '../types'

const quizSchema = z.object({
  title: z.string().describe('Titulo do quiz'),
  topic: z.string().describe('Topico do quiz'),
  questions: z.array(z.object({
    text: z.string().describe('Texto da pergunta'),
    options: z.array(z.object({
      text: z.string().describe('Texto da opcao'),
      isCorrect: z.boolean().describe('Se esta opcao e a correta'),
    })).describe('Opcoes de resposta'),
    explanation: z.string().describe('Explicacao da resposta correta'),
    difficulty: z.enum(['easy', 'medium', 'hard']).describe('Dificuldade'),
  })).describe('Lista de questoes'),
  specialty: z.string().optional().describe('Especialidade odontologica'),
  tags: z.array(z.string()).optional(),
})

export const quizHandler: DocumentHandler<QuizParams, QuizDocument> = {
  kind: 'quiz',
  schema: quizSchema,

  create(params, id) {
    const questions: QuizQuestion[] = params.questions.map((q, i) => ({
      id: `q-${i + 1}`,
      text: q.text,
      options: q.options.map((opt, j) => ({
        id: `opt-${i + 1}-${j + 1}`,
        text: opt.text,
        isCorrect: opt.isCorrect,
      })),
      explanation: q.explanation,
      difficulty: q.difficulty,
    }))

    return {
      id,
      kind: 'quiz',
      title: params.title,
      topic: params.topic,
      questions,
      specialty: params.specialty,
      tags: params.tags,
      createdAt: new Date().toISOString(),
    }
  },

  toPersistenceRecord(doc, ctx) {
    return {
      user_id: ctx.userId,
      title: doc.title,
      type: 'quiz',
      content: {
        topic: doc.topic,
        questions: doc.questions,
        specialty: doc.specialty,
      },
      description: `Quiz de ${doc.topic} com ${doc.questions.length} questoes`,
      ai_context: {
        agent: ctx.agentId || 'odonto-gpt',
        sessionId: ctx.sessionId,
      },
      metadata: {
        questionCount: doc.questions.length,
        specialty: doc.specialty,
        tags: doc.tags || [],
      },
    }
  },

  getDescription(doc) {
    return `Quiz: ${doc.topic} (${doc.questions.length} questoes)`
  },
}

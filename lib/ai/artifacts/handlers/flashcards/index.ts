import { z } from 'zod'
import type { DocumentHandler, FlashcardsDocument, FlashcardsParams, FlashcardCard } from '../types'

const flashcardsSchema = z.object({
  title: z.string().describe('Titulo do deck de flashcards'),
  topic: z.string().describe('Topico dos flashcards'),
  cards: z.array(z.object({
    front: z.string().describe('Frente do card (pergunta)'),
    back: z.string().describe('Verso do card (resposta)'),
    category: z.string().optional().describe('Categoria do card'),
  })).describe('Lista de flashcards'),
  tags: z.array(z.string()).optional(),
})

export const flashcardsHandler: DocumentHandler<FlashcardsParams, FlashcardsDocument> = {
  kind: 'flashcards',
  schema: flashcardsSchema,

  create(params, id) {
    const cards: FlashcardCard[] = params.cards.map((c, i) => ({
      id: `card-${i + 1}`,
      front: c.front,
      back: c.back,
      category: c.category,
    }))

    return {
      id,
      kind: 'flashcards',
      title: params.title,
      topic: params.topic,
      cards,
      tags: params.tags,
      createdAt: new Date().toISOString(),
    }
  },

  toPersistenceRecord(doc, ctx) {
    return {
      user_id: ctx.userId,
      title: doc.title,
      type: 'flashcards',
      content: {
        topic: doc.topic,
        cards: doc.cards,
      },
      description: `${doc.cards.length} flashcards sobre ${doc.topic}`,
      ai_context: {
        agent: ctx.agentId || 'medvision',
        sessionId: ctx.sessionId,
      },
      metadata: {
        cardCount: doc.cards.length,
        tags: doc.tags || [],
      },
    }
  },

  getDescription(doc) {
    return `Flashcards: ${doc.topic} (${doc.cards.length} cards)`
  },
}

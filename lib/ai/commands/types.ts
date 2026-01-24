/**
 * Command Types for Odonto GPT
 *
 * Defines types for the slash command system
 */

export interface ParsedCommand {
  command: string
  args: string[]
  rawArgs: string
}

export interface CommandResult {
  success: boolean
  message: string
  data?: Record<string, unknown>
  followUp?: string // Message to send to the AI for continuation
  skipAI?: boolean // If true, don't send to AI, just return the message
}

export interface CommandHandler {
  name: string
  description: string
  usage: string
  examples?: string[]
  handler: (args: string[], userId: string, sessionId?: string) => Promise<CommandResult>
}

export interface CommandRegistry {
  [key: string]: CommandHandler
}

/**
 * Setup levels for progressive profile configuration
 */
export interface SetupProgress {
  level: 1 | 2 | 3
  completedAt?: Date
  fieldsCompleted: string[]
  conversationCount: number
}

/**
 * Setup questions for each level
 */
export interface SetupQuestion {
  field: string
  question: string
  options?: string[]
  required: boolean
  level: 1 | 2 | 3
}

export const SETUP_QUESTIONS: SetupQuestion[] = [
  // Level 1 - Basic (initial)
  {
    field: 'university',
    question: 'Em qual universidade voce estuda ou se formou?',
    required: true,
    level: 1,
  },
  {
    field: 'semester',
    question: 'Em qual semestre voce esta? (ou "Formado" se ja se formou)',
    required: true,
    level: 1,
  },
  // Level 2 - Intermediate (after 5 conversations)
  {
    field: 'specialty',
    question: 'Qual area da odontologia mais te interessa?',
    options: [
      'Endodontia',
      'Periodontia',
      'Implantodontia',
      'Ortodontia',
      'Cirurgia',
      'Protese',
      'Odontopediatria',
      'Dentistica',
      'Geral',
    ],
    required: false,
    level: 2,
  },
  {
    field: 'level',
    question: 'Como voce avalia seu nivel de conhecimento geral?',
    options: ['Iniciante', 'Intermediario', 'Avancado'],
    required: false,
    level: 2,
  },
  // Level 3 - Advanced (after 15 conversations)
  {
    field: 'learningStyle',
    question: 'Qual seu estilo de aprendizado preferido?',
    options: [
      'Visual (diagramas, imagens)',
      'Leitura (textos, resumos)',
      'Pratico (casos, exercicios)',
      'Misto',
    ],
    required: false,
    level: 3,
  },
  {
    field: 'responsePreference',
    question: 'Como voce prefere que eu responda suas duvidas?',
    options: [
      'Direto - Respostas objetivas e rapidas',
      'Didatico - Com perguntas guiadas para eu pensar',
      'Hibrido - Depende do tipo de pergunta',
    ],
    required: false,
    level: 3,
  },
]

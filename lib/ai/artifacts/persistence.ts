/**
 * Serviço de Persistência de Artefatos
 * Salva artefatos no Supabase com contexto de IA
 */

import type { SupabaseClient } from '@supabase/supabase-js';

import { createAdminClient } from '@/lib/supabase/admin';
import type { Database } from '@/lib/supabase/types';
import type {
  Artifact,
  SummaryArtifact,
  FlashcardArtifact,
  QuizArtifact,
  ResearchArtifact,
  ReportArtifact,
} from './schemas';
import { getContext, getContextSafe } from './context';
import {
  streamSummary,
  streamFlashcard,
  streamQuiz,
  streamResearch,
  streamReport,
  StreamingArtifact,
} from './streaming';

let supabaseClient: SupabaseClient | null = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  supabaseClient = createAdminClient();
  return supabaseClient;
}

// ========================================
// TIPOS DE PERSISTÊNCIA
// ========================================

interface ArtifactDBRecord {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: string;
  content: Record<string, any>;
  metadata: Record<string, any>;
  ai_context: {
    agent: string;
    model: string;
    sessionId?: string;
    temperature?: number;
  };
}

// ========================================
// MAPEAMENTO ARTIFACT → DB RECORD
// ========================================

function mapSummaryToRecord(
  artifact: SummaryArtifact,
  userId: string,
  agentId: string
): ArtifactDBRecord {
  return {
    id: artifact.id,
    user_id: userId,
    title: artifact.title,
    description: `Resumo sobre ${artifact.topic}`,
    type: 'summary',
    content: {
      topic: artifact.topic,
      markdownContent: artifact.content,
      tags: artifact.tags,
    },
    metadata: {
      keyPoints: artifact.keyPoints,
      wordCount: artifact.wordCount,
    },
    ai_context: {
      agent: agentId,
      model: 'google/gemini-2.0-flash-001',
    },
  };
}

function mapFlashcardToRecord(
  artifact: FlashcardArtifact,
  userId: string,
  agentId: string
): ArtifactDBRecord {
  return {
    id: artifact.id,
    user_id: userId,
    title: artifact.title,
    description: `Flashcards sobre ${artifact.topic}`,
    type: 'flashcards',
    content: {
      topic: artifact.topic,
      cards: artifact.cards,
    },
    metadata: {
      totalCards: artifact.totalCards,
    },
    ai_context: {
      agent: agentId,
      model: 'google/gemini-2.0-flash-001',
    },
  };
}

function mapQuizToRecord(
  artifact: QuizArtifact,
  userId: string,
  agentId: string
): ArtifactDBRecord {
  return {
    id: artifact.id,
    user_id: userId,
    title: artifact.title,
    description: `Simulado de ${artifact.topic}`,
    type: 'exam',
    content: {
      topic: artifact.topic,
      specialty: artifact.specialty,
      difficulty: artifact.difficulty,
      questions: artifact.questions,
    },
    metadata: {
      totalQuestions: artifact.totalQuestions,
      difficulty: artifact.difficulty,
      specialty: artifact.specialty,
    },
    ai_context: {
      agent: agentId,
      model: 'google/gemini-2.0-flash-001',
    },
  };
}

function mapResearchToRecord(
  artifact: ResearchArtifact,
  userId: string,
  agentId: string
): ArtifactDBRecord {
  return {
    id: artifact.id,
    user_id: userId,
    title: artifact.title,
    description: `Pesquisa: ${artifact.query}`,
    type: 'research',
    content: {
      query: artifact.query,
      markdownContent: artifact.content,
      sources: artifact.sources,
      researchType: 'literature_review',
    },
    metadata: {
      sourcesCount: artifact.sourcesCount,
      methodology: artifact.methodology,
    },
    ai_context: {
      agent: agentId,
      model: 'perplexity/sonar',
    },
  };
}

function mapReportToRecord(
  artifact: ReportArtifact,
  userId: string,
  agentId: string
): ArtifactDBRecord {
  return {
    id: artifact.id,
    user_id: userId,
    title: artifact.title,
    description: `Laudo de ${artifact.examType}`,
    type: 'image',
    content: {
      imageUrl: artifact.imageUrl,
      analysis: artifact.content,
      findings: artifact.findings,
      recommendations: artifact.recommendations,
    },
    metadata: {
      examType: artifact.examType,
      quality: artifact.quality,
    },
    ai_context: {
      agent: agentId,
      model: 'anthropic/claude-3.5-sonnet',
    },
  };
}

// ========================================
// FUNÇÃO PRINCIPAL DE PERSISTÊNCIA
// ========================================

/**
 * Persiste um artefato no banco de dados
 * Usado como callback no complete() do StreamingArtifact
 */
export async function persistArtifact(artifact: Artifact): Promise<string> {
  const ctx = getContextSafe();

  if (!ctx) {
    console.warn('[persistArtifact] No context available, skipping persistence');
    return artifact.id;
  }

  const supabase = getSupabase();
  const { userId, agentId = 'medvision', sessionId } = ctx;

  let record: ArtifactDBRecord;

  switch (artifact.type) {
    case 'summary':
      record = mapSummaryToRecord(artifact, userId, agentId);
      break;
    case 'flashcard':
      record = mapFlashcardToRecord(artifact, userId, agentId);
      break;
    case 'quiz':
      record = mapQuizToRecord(artifact, userId, agentId);
      break;
    case 'research':
      record = mapResearchToRecord(artifact, userId, agentId);
      break;
    case 'report':
      record = mapReportToRecord(artifact, userId, agentId);
      break;
    default:
      console.warn(`[persistArtifact] Unknown artifact type: ${(artifact as any).type}`);
      return artifact.id;
  }

  // Adicionar sessionId ao ai_context
  if (sessionId) {
    record.ai_context.sessionId = sessionId;
  }

  try {
    const { data, error } = await supabase
      .from('artifacts')
      .insert(record as any)
      .select('id')
      .single() as { data: { id: string } | null; error: any };

    if (error || !data) {
      console.error('[persistArtifact] Database error:', error);
      throw new Error(`Failed to persist artifact: ${error?.message || 'No data returned'}`);
    }

    console.log(`[persistArtifact] Saved artifact ${artifact.type}: ${data.id}`);
    return data.id;
  } catch (error) {
    console.error('[persistArtifact] Error:', error);
    throw error;
  }
}

/**
 * Wrapper que retorna Promise<void> para compatibilidade com StreamingArtifact
 */
export async function persistArtifactVoid(artifact: Artifact): Promise<void> {
  await persistArtifact(artifact);
}

// ========================================
// FACTORIES COM AUTO-PERSIST
// ========================================

/**
 * Cria StreamingArtifact para Summary com auto-persist
 */
export function createPersistentSummary(
  data: { title: string; topic: string } & Partial<SummaryArtifact>
): StreamingArtifact<SummaryArtifact> {
  return streamSummary(data, persistArtifactVoid);
}

/**
 * Cria StreamingArtifact para Flashcard com auto-persist
 */
export function createPersistentFlashcard(
  data: { title: string; topic: string } & Partial<FlashcardArtifact>
): StreamingArtifact<FlashcardArtifact> {
  return streamFlashcard(data, persistArtifactVoid);
}

/**
 * Cria StreamingArtifact para Quiz com auto-persist
 */
export function createPersistentQuiz(
  data: { title: string; topic: string } & Partial<QuizArtifact>
): StreamingArtifact<QuizArtifact> {
  return streamQuiz(data, persistArtifactVoid);
}

/**
 * Cria StreamingArtifact para Research com auto-persist
 */
export function createPersistentResearch(
  data: { title: string; query: string } & Partial<ResearchArtifact>
): StreamingArtifact<ResearchArtifact> {
  return streamResearch(data, persistArtifactVoid);
}

/**
 * Cria StreamingArtifact para Report com auto-persist
 */
export function createPersistentReport(
  data: { title: string; examType: string } & Partial<ReportArtifact>
): StreamingArtifact<ReportArtifact> {
  return streamReport(data, persistArtifactVoid);
}

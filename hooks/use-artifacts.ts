'use client';

/**
 * Hooks React para consumir artefatos
 * Compatível com AI SDK v6 useChat
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { UIMessage } from 'ai';
import type {
  Artifact,
  ArtifactEvent,
  ArtifactStage,
  SummaryArtifact,
  FlashcardArtifact,
  QuizArtifact,
  ResearchArtifact,
  ReportArtifact,
} from '@/lib/ai/artifacts/schemas';

// ========================================
// TYPES
// ========================================

export interface ArtifactState<T extends Artifact = Artifact> {
  data: T | null;
  status: ArtifactStage;
  progress: number;
  error: string | null;
  isActive: boolean;
}

export interface UseArtifactOptions<T extends Artifact> {
  onUpdate?: (data: T, prevData: T | null) => void;
  onComplete?: (data: T) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export interface UseArtifactsOptions {
  onData?: (artifactType: string, data: Artifact) => void;
}

// ========================================
// TOOL RESULT TO ARTIFACT MAPPING
// ========================================

const TOOL_TO_ARTIFACT_MAP: Record<string, Artifact['type']> = {
  createSummary: 'summary',
  createStreamingSummary: 'summary',
  saveSummary: 'summary',
  createFlashcards: 'flashcard',
  createStreamingFlashcards: 'flashcard',
  saveFlashcards: 'flashcard',
  createQuiz: 'quiz',
  createStreamingQuiz: 'quiz',
  savePracticeExam: 'quiz',
  createResearch: 'research',
  createStreamingResearch: 'research',
  saveResearch: 'research',
  createReport: 'report',
  createStreamingReport: 'report',
  saveImageAnalysis: 'report',
};

/**
 * Converte tool result em Artifact tipado
 */
export function toolResultToArtifact(
  toolName: string,
  result: any
): Artifact | null {
  const artifactType = TOOL_TO_ARTIFACT_MAP[toolName];
  if (!artifactType) return null;

  // Normalizar estrutura
  const baseArtifact = {
    id: result.id || result.artifactId || `art_${Date.now()}`,
    type: artifactType,
    title: result.title || 'Sem título',
    stage: (result.stage || 'complete') as ArtifactStage,
    progress: result.progress ?? 1,
    createdAt: result.createdAt || new Date().toISOString(),
  };

  switch (artifactType) {
    case 'summary':
      return {
        ...baseArtifact,
        type: 'summary',
        topic: result.topic || '',
        content: result.content || result.markdownContent || '',
        keyPoints: result.keyPoints || [],
        tags: result.tags || [],
        wordCount: result.wordCount || 0,
      } as SummaryArtifact;

    case 'flashcard':
      return {
        ...baseArtifact,
        type: 'flashcard',
        topic: result.topic || '',
        cards: (result.cards || []).map((card: any, i: number) => ({
          id: card.id || `card-${i}`,
          front: card.front || '',
          back: card.back || '',
          category: card.category,
        })),
        totalCards: result.cards?.length || 0,
      } as FlashcardArtifact;

    case 'quiz':
      return {
        ...baseArtifact,
        type: 'quiz',
        topic: result.topic || '',
        specialty: result.specialty,
        difficulty: result.difficulty || 'medium',
        questions: (result.questions || []).map((q: any, i: number) => ({
          id: q.id || `q-${i}`,
          text: q.text || q.question_text || '',
          options: (q.options || []).map((opt: any, j: number) => ({
            id: opt.id || String.fromCharCode(65 + j),
            text: opt.text || '',
            isCorrect: opt.isCorrect || false,
          })),
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'medium',
        })),
        totalQuestions: result.questions?.length || 0,
      } as QuizArtifact;

    case 'research':
      return {
        ...baseArtifact,
        type: 'research',
        query: result.query || '',
        content: result.content || result.markdownContent || '',
        sources: (result.sources || []).map((src: any) => ({
          title: src.title || '',
          url: src.url || '',
          summary: src.summary,
          authors: src.authors,
          pubdate: src.pubdate,
        })),
        methodology: result.methodology,
        sourcesCount: result.sources?.length || 0,
      } as ResearchArtifact;

    case 'report':
      return {
        ...baseArtifact,
        type: 'report',
        examType: result.examType || 'Radiografia',
        imageUrl: result.imageUrl,
        content: result.content || result.analysis || '',
        findings: result.findings || [],
        recommendations: result.recommendations || [],
        quality: result.quality,
      } as ReportArtifact;

    default:
      return null;
  }
}

// ========================================
// useArtifact HOOK
// ========================================

/**
 * Hook para gerenciar um artefato específico por tipo
 */
export function useArtifact<T extends Artifact>(
  artifactType: T['type'],
  options: UseArtifactOptions<T> = {}
): ArtifactState<T> & {
  setArtifact: (artifact: T | null) => void;
  updateArtifact: (partial: Partial<T>) => void;
} {
  const [state, setState] = useState<ArtifactState<T>>({
    data: null,
    status: 'initializing',
    progress: 0,
    error: null,
    isActive: false,
  });

  const setArtifact = useCallback(
    (artifact: T | null) => {
      setState((prev) => {
        if (artifact && options.onUpdate) {
          options.onUpdate(artifact, prev.data);
        }
        if (artifact?.stage === 'complete' && options.onComplete) {
          options.onComplete(artifact);
        }
        if (artifact?.progress !== undefined && options.onProgress) {
          options.onProgress(artifact.progress);
        }

        return {
          data: artifact,
          status: artifact?.stage || 'initializing',
          progress: artifact?.progress || 0,
          error: artifact?.error || null,
          isActive:
            artifact !== null &&
            artifact.stage !== 'complete' &&
            artifact.stage !== 'error',
        };
      });
    },
    [options]
  );

  const updateArtifact = useCallback(
    (partial: Partial<T>) => {
      setState((prev) => {
        if (!prev.data) return prev;
        const updated = { ...prev.data, ...partial } as T;

        if (options.onUpdate) {
          options.onUpdate(updated, prev.data);
        }
        if (partial.progress !== undefined && options.onProgress) {
          options.onProgress(partial.progress);
        }

        return {
          ...prev,
          data: updated,
          status: updated.stage || prev.status,
          progress: updated.progress ?? prev.progress,
        };
      });
    },
    [options]
  );

  return {
    ...state,
    setArtifact,
    updateArtifact,
  };
}

// ========================================
// useArtifacts HOOK (múltiplos artefatos)
// ========================================

interface ArtifactsState {
  all: Artifact[];
  latest: Artifact | null;
  current: Artifact | null;
  byType: Record<string, Artifact[]>;
  inProgress: Artifact[];
}

/**
 * Hook para gerenciar múltiplos artefatos
 */
export function useArtifacts(options: UseArtifactsOptions = {}): ArtifactsState & {
  addArtifact: (artifact: Artifact) => void;
  updateArtifact: (id: string, partial: Partial<Artifact>) => void;
  removeArtifact: (id: string) => void;
  clear: () => void;
} {
  const [artifacts, setArtifacts] = useState<Map<string, Artifact>>(new Map());

  const state = useMemo<ArtifactsState>(() => {
    const all = Array.from(artifacts.values());
    const byType: Record<string, Artifact[]> = {};

    all.forEach((artifact) => {
      if (!byType[artifact.type]) {
        byType[artifact.type] = [];
      }
      byType[artifact.type].push(artifact);
    });

    const inProgress = all.filter(
      (a) => a.stage !== 'complete' && a.stage !== 'error'
    );

    return {
      all,
      latest: all[all.length - 1] || null,
      current: inProgress[0] || all[all.length - 1] || null,
      byType,
      inProgress,
    };
  }, [artifacts]);

  const addArtifact = useCallback(
    (artifact: Artifact) => {
      setArtifacts((prev) => {
        const next = new Map(prev);
        next.set(artifact.id, artifact);
        return next;
      });

      if (options.onData) {
        options.onData(artifact.type, artifact);
      }
    },
    [options]
  );

  const updateArtifact = useCallback(
    (id: string, partial: Partial<Artifact>) => {
      setArtifacts((prev) => {
        const existing = prev.get(id);
        if (!existing) return prev;

        const updated = { ...existing, ...partial } as Artifact;
        const next = new Map(prev);
        next.set(id, updated);

        if (options.onData) {
          options.onData(updated.type, updated);
        }

        return next;
      });
    },
    [options]
  );

  const removeArtifact = useCallback((id: string) => {
    setArtifacts((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setArtifacts(new Map());
  }, []);

  return {
    ...state,
    addArtifact,
    updateArtifact,
    removeArtifact,
    clear,
  };
}

// ========================================
// useMessageArtifacts HOOK
// ========================================

/**
 * Hook para extrair artefatos de mensagens do useChat
 */
export function useMessageArtifacts(messages: UIMessage[]): {
  artifacts: Artifact[];
  artifactsByMessage: Map<string, Artifact[]>;
  latestArtifact: Artifact | null;
} {
  return useMemo(() => {
    const artifacts: Artifact[] = [];
    const artifactsByMessage = new Map<string, Artifact[]>();

    messages.forEach((message) => {
      if (message.role !== 'assistant') return;

      const messageArtifacts: Artifact[] = [];

      // Extrair de parts (AI SDK v6)
      const parts = (message as any).parts || [];
      parts.forEach((part: any) => {
        if (
          part.type === 'tool-invocation' &&
          part.toolInvocation?.state === 'result'
        ) {
          const artifact = toolResultToArtifact(
            part.toolInvocation.toolName,
            part.toolInvocation.result
          );
          if (artifact) {
            artifacts.push(artifact);
            messageArtifacts.push(artifact);
          }
        }
      });

      // Extrair de toolInvocations (formato antigo)
      const toolInvocations = (message as any).toolInvocations || [];
      toolInvocations.forEach((invocation: any) => {
        if (invocation.state === 'result') {
          const artifact = toolResultToArtifact(
            invocation.toolName,
            invocation.result
          );
          if (artifact && !artifacts.find((a) => a.id === artifact.id)) {
            artifacts.push(artifact);
            messageArtifacts.push(artifact);
          }
        }
      });

      if (messageArtifacts.length > 0) {
        artifactsByMessage.set(message.id, messageArtifacts);
      }
    });

    return {
      artifacts,
      artifactsByMessage,
      latestArtifact: artifacts[artifacts.length - 1] || null,
    };
  }, [messages]);
}

// ========================================
// SPECIALIZED HOOKS
// ========================================

/**
 * Hook para resumos
 */
export function useSummaryArtifact(options?: UseArtifactOptions<SummaryArtifact>) {
  return useArtifact<SummaryArtifact>('summary', options);
}

/**
 * Hook para flashcards
 */
export function useFlashcardArtifact(options?: UseArtifactOptions<FlashcardArtifact>) {
  return useArtifact<FlashcardArtifact>('flashcard', options);
}

/**
 * Hook para quizzes
 */
export function useQuizArtifact(options?: UseArtifactOptions<QuizArtifact>) {
  return useArtifact<QuizArtifact>('quiz', options);
}

/**
 * Hook para pesquisas
 */
export function useResearchArtifact(options?: UseArtifactOptions<ResearchArtifact>) {
  return useArtifact<ResearchArtifact>('research', options);
}

/**
 * Hook para laudos
 */
export function useReportArtifact(options?: UseArtifactOptions<ReportArtifact>) {
  return useArtifact<ReportArtifact>('report', options);
}

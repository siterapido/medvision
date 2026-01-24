/**
 * Sistema de Streaming de Artefatos
 * Permite atualização progressiva de artefatos durante geração
 */

import type {
  Artifact,
  ArtifactStage,
  ArtifactEvent,
  SummaryArtifact,
  FlashcardArtifact,
  QuizArtifact,
  ResearchArtifact,
  ReportArtifact,
} from './schemas';

// ========================================
// STREAMING ARTIFACT CLASS
// ========================================

export class StreamingArtifact<T extends Artifact> {
  private _data: T;
  private _listeners: Set<(event: ArtifactEvent) => void> = new Set();
  private _onComplete?: (artifact: T) => Promise<void>;

  constructor(
    initialData: T,
    onComplete?: (artifact: T) => Promise<void>
  ) {
    this._data = { ...initialData };
    this._onComplete = onComplete;
    this.emit('start', this._data);
  }

  /**
   * Dados atuais do artefato
   */
  get data(): T {
    return { ...this._data };
  }

  /**
   * Progresso atual (0-1)
   */
  get progress(): number {
    return this._data.progress;
  }

  /**
   * Define progresso (0-1)
   */
  set progress(value: number) {
    this._data.progress = Math.max(0, Math.min(1, value));
    this.emit('progress', { progress: this._data.progress });
  }

  /**
   * Estágio atual
   */
  get stage(): ArtifactStage {
    return this._data.stage;
  }

  /**
   * Define estágio
   */
  set stage(value: ArtifactStage) {
    this._data.stage = value;
    this.emit('update', { stage: value });
  }

  /**
   * Atualiza parcialmente o artefato
   */
  async update(partial: Partial<T>): Promise<void> {
    this._data = { ...this._data, ...partial };
    this.emit('update', partial);
  }

  /**
   * Completa o artefato e dispara callback de persistência
   */
  async complete(finalData?: Partial<T>): Promise<T> {
    if (finalData) {
      this._data = { ...this._data, ...finalData };
    }
    this._data.stage = 'complete';
    this._data.progress = 1;

    this.emit('complete', this._data);

    // Executar callback de persistência
    if (this._onComplete) {
      try {
        await this._onComplete(this._data);
      } catch (error) {
        console.error('[StreamingArtifact] Error in onComplete callback:', error);
      }
    }

    return this._data;
  }

  /**
   * Marca o artefato com erro
   */
  async error(message: string): Promise<void> {
    this._data.stage = 'error';
    this._data.error = message;
    this.emit('error', { error: message });
  }

  /**
   * Adiciona listener para eventos
   */
  subscribe(listener: (event: ArtifactEvent) => void): () => void {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Emite evento para todos os listeners
   */
  private emit(
    eventType: ArtifactEvent['eventType'],
    data: any
  ): void {
    const event: ArtifactEvent = {
      eventType,
      artifactId: this._data.id,
      artifactType: this._data.type,
      data,
      timestamp: new Date().toISOString(),
    };

    this._listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error('[StreamingArtifact] Error in listener:', error);
      }
    });
  }

  /**
   * Converte para objeto JSON serializável
   */
  toJSON(): T {
    return this._data;
  }
}

// ========================================
// FACTORY FUNCTIONS PARA STREAMING
// ========================================

import {
  createSummaryArtifact,
  createFlashcardArtifact,
  createQuizArtifact,
  createResearchArtifact,
  createReportArtifact,
} from './schemas';

/**
 * Cria um StreamingArtifact para Summary
 */
export function streamSummary(
  data: { title: string; topic: string } & Partial<SummaryArtifact>,
  onComplete?: (artifact: SummaryArtifact) => Promise<void>
): StreamingArtifact<SummaryArtifact> {
  const initial = createSummaryArtifact(data);
  return new StreamingArtifact(initial, onComplete);
}

/**
 * Cria um StreamingArtifact para Flashcard
 */
export function streamFlashcard(
  data: { title: string; topic: string } & Partial<FlashcardArtifact>,
  onComplete?: (artifact: FlashcardArtifact) => Promise<void>
): StreamingArtifact<FlashcardArtifact> {
  const initial = createFlashcardArtifact(data);
  return new StreamingArtifact(initial, onComplete);
}

/**
 * Cria um StreamingArtifact para Quiz
 */
export function streamQuiz(
  data: { title: string; topic: string } & Partial<QuizArtifact>,
  onComplete?: (artifact: QuizArtifact) => Promise<void>
): StreamingArtifact<QuizArtifact> {
  const initial = createQuizArtifact(data);
  return new StreamingArtifact(initial, onComplete);
}

/**
 * Cria um StreamingArtifact para Research
 */
export function streamResearch(
  data: { title: string; query: string } & Partial<ResearchArtifact>,
  onComplete?: (artifact: ResearchArtifact) => Promise<void>
): StreamingArtifact<ResearchArtifact> {
  const initial = createResearchArtifact(data);
  return new StreamingArtifact(initial, onComplete);
}

/**
 * Cria um StreamingArtifact para Report
 */
export function streamReport(
  data: { title: string; examType: string } & Partial<ReportArtifact>,
  onComplete?: (artifact: ReportArtifact) => Promise<void>
): StreamingArtifact<ReportArtifact> {
  const initial = createReportArtifact(data);
  return new StreamingArtifact(initial, onComplete);
}

// ========================================
// ARTIFACT STORE (para gerenciar múltiplos artefatos)
// ========================================

export class ArtifactStore {
  private artifacts: Map<string, StreamingArtifact<any>> = new Map();
  private globalListeners: Set<(event: ArtifactEvent) => void> = new Set();

  /**
   * Registra um artefato no store
   */
  register<T extends Artifact>(artifact: StreamingArtifact<T>): void {
    const id = artifact.data.id;
    this.artifacts.set(id, artifact);

    // Propagar eventos para listeners globais
    artifact.subscribe((event) => {
      this.globalListeners.forEach((listener) => listener(event));
    });
  }

  /**
   * Obtém artefato por ID
   */
  get<T extends Artifact>(id: string): StreamingArtifact<T> | undefined {
    return this.artifacts.get(id);
  }

  /**
   * Lista todos os artefatos
   */
  getAll(): Artifact[] {
    return Array.from(this.artifacts.values()).map((a) => a.data);
  }

  /**
   * Filtra artefatos por tipo
   */
  getByType<T extends Artifact>(type: T['type']): T[] {
    return Array.from(this.artifacts.values())
      .filter((a) => a.data.type === type)
      .map((a) => a.data as T);
  }

  /**
   * Artefato mais recente
   */
  getLatest(): Artifact | undefined {
    const all = this.getAll();
    return all[all.length - 1];
  }

  /**
   * Artefatos em progresso
   */
  getInProgress(): Artifact[] {
    return this.getAll().filter(
      (a) => a.stage !== 'complete' && a.stage !== 'error'
    );
  }

  /**
   * Subscribe para todos os eventos
   */
  subscribe(listener: (event: ArtifactEvent) => void): () => void {
    this.globalListeners.add(listener);
    return () => this.globalListeners.delete(listener);
  }

  /**
   * Limpa o store
   */
  clear(): void {
    this.artifacts.clear();
  }
}

// Instância global do store
export const artifactStore = new ArtifactStore();

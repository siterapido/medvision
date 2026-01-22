/**
 * Tipos para o sistema de artefatos do Vercel Chat SDK
 */

export type ArtifactType = 'chat' | 'document' | 'code' | 'image' | 'research' | 'exam' | 'summary' | 'flashcards' | 'mindmap' | 'other'

export interface AIContext {
    model: string
    agent: string
    temperature?: number
    maxTokens?: number
    systemPrompt?: string
    timestamp?: string
}

// Research Artifact Spec
export interface ResearchSource {
    title?: string
    url: string
    status?: string
}

export interface ResearchArtifactContent {
    query: string
    sources: ResearchSource[]
    researchType: string
    markdownContent: string
}

// Practice Exam (Simulado) Artifact Spec
export interface QuestionOption {
    id: string
    text: string
    isCorrect: boolean
}

export interface ExamQuestion {
    question_text: string
    type: 'multiple_choice' | 'true_false' | 'open'
    options?: QuestionOption[] | string[]
    correct_answer: string
    explanation: string
    difficulty: 'easy' | 'medium' | 'hard'
}

export interface PracticeExamArtifactContent {
    topic: string
    specialty: string
    difficulty: string
    questions: ExamQuestion[]
}

// Summary Artifact Spec
export interface SummaryArtifactContent {
    topic: string
    tags: string[]
    markdownContent: string
}

// Flashcards Artifact Spec
export interface Flashcard {
    front: string
    back: string
}

export interface FlashcardDeckArtifactContent {
    topic: string
    cards: Flashcard[]
}

// Mind Map Artifact Spec
export interface MindMapNode {
    id: string
    label: string
    children?: MindMapNode[]
}

export interface MindMapArtifactContent {
    topic: string
    data: any // JSON representation of the map (e.g. React Flow or generic tree)
}

// Image Analysis Artifact Spec
export interface ImageAnalysisArtifactContent {
    imageUrl?: string
    analysis: string
    findings: string[]
    recommendations: string[]
}

export interface Artifact {
    id: string
    userId: string
    title: string
    description: string
    type: ArtifactType
    content: any | ResearchArtifactContent | PracticeExamArtifactContent | SummaryArtifactContent | FlashcardDeckArtifactContent | MindMapArtifactContent | ImageAnalysisArtifactContent
    metadata?: Record<string, any>
    aiContext: AIContext
    createdAt: string
    updatedAt: string
}

export interface CreateArtifactInput {
    title: string
    description: string
    type: ArtifactType
    content: any
    metadata?: Record<string, any>
    aiContext: AIContext
}

export interface UpdateArtifactInput {
    title?: string
    description?: string
    content?: any
    metadata?: Record<string, any>
}

export interface ArtifactFilters {
    type?: ArtifactType
    search?: string
    startDate?: string
    endDate?: string
    model?: string
    agent?: string
}

export interface PaginatedArtifacts {
    data: Artifact[]
    total: number
    page: number
    limit: number
    hasMore: boolean
}

export interface ArtifactListParams {
    page?: number
    limit?: number
    type?: ArtifactType
    search?: string
    sortBy?: 'createdAt' | 'updatedAt' | 'title'
    sortOrder?: 'asc' | 'desc'
}

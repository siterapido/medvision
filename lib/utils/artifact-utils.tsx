import { Artifact } from "@/lib/types/artifacts"
import {
    FileText,
    MessageSquare,
    Code,
    Image as ImageIcon,
    Sparkles,
    Library,
    BookOpen,
    BrainCircuit,
    WalletCards,
    GraduationCap,
    Scan
} from "lucide-react"

export const getIconForType = (type: string) => {
    switch (type) {
        case "chat":
            return <MessageSquare className="h-5 w-5 text-indigo-400" />
        case "document":
            return <FileText className="h-5 w-5 text-blue-400" />
        case "code":
            return <Code className="h-5 w-5 text-emerald-400" />
        case "image":
            return <ImageIcon className="h-5 w-5 text-pink-400" />
        case "vision":
            return <Scan className="h-5 w-5 text-sky-400" />
        case "research":
            return <BookOpen className="h-5 w-5 text-cyan-400" />
        case "exam":
            return <GraduationCap className="h-5 w-5 text-amber-400" />
        case "summary":
            return <Library className="h-5 w-5 text-violet-400" />
        case "flashcards":
            return <WalletCards className="h-5 w-5 text-orange-400" />
        case "mindmap":
            return <BrainCircuit className="h-5 w-5 text-teal-400" />
        default:
            return <Sparkles className="h-5 w-5 text-slate-400" />
    }
}

export const getLabelForType = (type: string) => {
    switch (type) {
        case "chat": return "Conversa"
        case "document": return "Documento"
        case "code": return "Código"
        case "image": return "Imagem"
        case "vision": return "Laudo Vision"
        case "research": return "Pesquisa"
        case "exam": return "Simulado"
        case "summary": return "Resumo"
        case "flashcards": return "Flashcards"
        case "mindmap": return "Mapa Mental"
        default: return "Artefato"
    }
}

// Helper function to convert database artifact to renderer artifact format
export const convertToRenderArtifact = (artifact: Artifact): any => {
    const baseArtifact = {
        id: artifact.id,
        title: artifact.title,
        description: artifact.description,
        createdAt: new Date(artifact.createdAt),
    }

    // Map types to kinds
    const typeToKind: Record<string, string> = {
        'chat': 'text',
        'document': 'document',
        'code': 'code',
        'image': 'image',
        'vision': 'vision',
        'research': 'research',
        'exam': 'quiz',
        'summary': 'summary',
        'flashcards': 'flashcard',
        'mindmap': 'diagram',
    }

    const kind = typeToKind[artifact.type] || 'text'

    // Special handling for vision artifacts (laudos)
    if (artifact.type === 'vision') {
        const content = artifact.content as any
        return {
            ...baseArtifact,
            kind: 'vision',
            thumbnailBase64: content?.thumbnailBase64 || '',
            imageBase64: content?.imageBase64 || '',
            analysis: content?.analysis || { detections: [], findings: [] },
            annotations: content?.annotations || [],
            analyzedAt: content?.analyzedAt || artifact.createdAt,
        }
    }

    // Special handling for exam/quiz artifacts
    if (artifact.type === 'exam') {
        const content = artifact.content as any
        return {
            ...baseArtifact,
            kind: 'quiz',
            topic: content?.topic || artifact.title,
            specialty: content?.specialty,
            questions: (content?.questions || []).map((q: any, idx: number) => ({
                id: q.id || `q-${idx}`,
                text: q.question_text || q.text,
                options: Array.isArray(q.options) ? q.options.map((opt: any, optIdx: number) =>
                    typeof opt === 'string'
                        ? { id: `opt-${optIdx}`, text: opt, isCorrect: opt === q.correct_answer }
                        : opt
                ) : [],
                explanation: q.explanation || '',
                difficulty: q.difficulty || 'medium',
            })),
        }
    }

    // Special handling for research artifacts
    if (artifact.type === 'research') {
        const content = artifact.content as any
        return {
            ...baseArtifact,
            kind: 'research',
            query: content?.query || '',
            content: content?.markdownContent || '',
            sources: content?.sources || [],
            methodology: content?.researchType,
        }
    }

    // Special handling for summary artifacts
    if (artifact.type === 'summary') {
        const content = artifact.content as any
        return {
            ...baseArtifact,
            kind: 'summary',
            content: content?.markdownContent || content || '',
            topic: content?.topic,
            tags: content?.tags || [],
        }
    }

    // Special handling for flashcard artifacts
    if (artifact.type === 'flashcards') {
        const content = artifact.content as any
        return {
            ...baseArtifact,
            kind: 'flashcard',
            topic: content?.topic,
            cards: (content?.cards || []).map((card: any, idx: number) => ({
                id: `card-${idx}`,
                front: card.front,
                back: card.back,
            })),
        }
    }

    // Default: text artifact
    return {
        ...baseArtifact,
        kind,
        content: typeof artifact.content === 'string'
            ? artifact.content
            : artifact.content?.markdownContent || JSON.stringify(artifact.content, null, 2),
        format: 'markdown',
    }
}

'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  FileText, 
  BookOpen, 
  Brain, 
  FlaskConical, 
  CheckCircle,
  Download,
  Copy,
  ExternalLink
} from 'lucide-react'
import { Markdown } from './markdown'
import { toast } from 'sonner'

export type ArtifactType = 
  | 'summary'
  | 'flashcards'
  | 'quiz'
  | 'research-dossier'
  | 'clinical-protocol'
  | 'study-guide'
  | 'case-analysis'
  | 'research'
  | 'exam'
  | 'mindmap'
  | 'image'

export interface Artifact {
  type: ArtifactType
  title: string
  content: any
  topic?: string
  createdAt?: string
  status?: 'generated' | 'saved' | 'error'
}

interface ArtifactRendererProps {
  artifact: Artifact
  onSave?: (artifact: Artifact) => void
  onExport?: (artifact: Artifact, format: 'pdf' | 'md' | 'json') => void
}

const artifactIcons: Record<ArtifactType, React.ElementType> = {
  'summary': FileText,
  'flashcards': BookOpen,
  'quiz': CheckCircle,
  'research-dossier': FlaskConical,
  'clinical-protocol': FileText,
  'study-guide': BookOpen,
  'case-analysis': Brain,
  'research': FlaskConical,
  'exam': CheckCircle,
  'mindmap': Brain,
  'image': FileText,
}

const artifactLabels: Record<ArtifactType, string> = {
  'summary': 'Resumo',
  'flashcards': 'Flashcards',
  'quiz': 'Quiz',
  'research-dossier': 'Dossie de Pesquisa',
  'clinical-protocol': 'Protocolo Clinico',
  'study-guide': 'Guia de Estudo',
  'case-analysis': 'Analise de Caso',
  'research': 'Pesquisa',
  'exam': 'Simulado',
  'mindmap': 'Mapa Mental',
  'image': 'Analise de Imagem',
}

export function ArtifactRenderer({ artifact, onSave, onExport }: ArtifactRendererProps) {
  const Icon = artifactIcons[artifact.type] || FileText
  const label = artifactLabels[artifact.type] || artifact.type

  const handleCopy = async () => {
    try {
      const content = typeof artifact.content === 'string' 
        ? artifact.content 
        : JSON.stringify(artifact.content, null, 2)
      await navigator.clipboard.writeText(content)
      toast.success('Copiado para a area de transferencia')
    } catch {
      toast.error('Erro ao copiar')
    }
  }

  return (
    <Card className="my-4 border-primary/20 bg-card/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Icon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">{artifact.title}</CardTitle>
              {artifact.topic && (
                <p className="text-xs text-muted-foreground">{artifact.topic}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {label}
            </Badge>
            {artifact.status === 'saved' && (
              <Badge variant="default" className="text-xs bg-green-500">
                Salvo
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderContent(artifact)}
        
        <div className="mt-4 flex gap-2 border-t pt-4">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="mr-1 h-3 w-3" />
            Copiar
          </Button>
          {onExport && (
            <Button variant="outline" size="sm" onClick={() => onExport(artifact, 'md')}>
              <Download className="mr-1 h-3 w-3" />
              Exportar
            </Button>
          )}
          {onSave && artifact.status !== 'saved' && (
            <Button variant="default" size="sm" onClick={() => onSave(artifact)}>
              Salvar na Biblioteca
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function renderContent(artifact: Artifact) {
  switch (artifact.type) {
    case 'summary':
    case 'research-dossier':
    case 'research':
    case 'clinical-protocol':
    case 'study-guide':
    case 'case-analysis':
      return <SummaryContent content={artifact.content} />
    
    case 'flashcards':
      return <FlashcardsContent content={artifact.content} />
    
    case 'quiz':
    case 'exam':
      return <QuizContent content={artifact.content} />
    
    case 'mindmap':
      return <MindmapContent content={artifact.content} />
    
    case 'image':
      return <ImageAnalysisContent content={artifact.content} />
    
    default:
      return <GenericContent content={artifact.content} />
  }
}

function SummaryContent({ content }: { content: any }) {
  const markdown = content?.markdownContent || content?.content || (typeof content === 'string' ? content : JSON.stringify(content, null, 2))
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <Markdown>{markdown}</Markdown>
    </div>
  )
}

function FlashcardsContent({ content }: { content: any }) {
  const cards = content?.cards || content || []
  
  if (!Array.isArray(cards) || cards.length === 0) {
    return <p className="text-muted-foreground">Nenhum flashcard disponivel</p>
  }

  return (
    <div className="grid gap-3">
      {cards.slice(0, 5).map((card: any, idx: number) => (
        <div key={idx} className="rounded-lg border bg-background p-3">
          <div className="mb-2 font-medium text-sm">
            <span className="text-primary">Frente:</span> {card.front}
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="text-primary">Verso:</span> {card.back}
          </div>
        </div>
      ))}
      {cards.length > 5 && (
        <p className="text-sm text-muted-foreground text-center">
          + {cards.length - 5} flashcards
        </p>
      )}
    </div>
  )
}

function QuizContent({ content }: { content: any }) {
  const questions = content?.questions || content || []
  
  if (!Array.isArray(questions) || questions.length === 0) {
    return <p className="text-muted-foreground">Nenhuma questao disponivel</p>
  }

  return (
    <div className="space-y-4">
      {questions.slice(0, 3).map((q: any, idx: number) => (
        <div key={idx} className="rounded-lg border bg-background p-3">
          <p className="font-medium text-sm mb-2">
            {idx + 1}. {q.question_text || q.question}
          </p>
          {q.options && (
            <div className="space-y-1 ml-4">
              {Object.entries(q.options).map(([key, value]) => (
                <div key={key} className="text-sm text-muted-foreground">
                  {key}) {String(value)}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {questions.length > 3 && (
        <p className="text-sm text-muted-foreground text-center">
          + {questions.length - 3} questoes
        </p>
      )}
    </div>
  )
}

function MindmapContent({ content }: { content: any }) {
  const data = content?.data || content
  return (
    <div className="rounded-lg border bg-background p-4">
      <p className="text-sm text-muted-foreground mb-2">Estrutura do Mapa Mental:</p>
      <pre className="text-xs overflow-auto max-h-48">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

function ImageAnalysisContent({ content }: { content: any }) {
  return (
    <div className="space-y-3">
      {content?.imageUrl && (
        <div className="rounded-lg overflow-hidden border">
          <img src={content.imageUrl} alt="Imagem analisada" className="w-full max-h-64 object-cover" />
        </div>
      )}
      {content?.analysis && (
        <div className="prose prose-sm dark:prose-invert">
          <Markdown>{content.analysis}</Markdown>
        </div>
      )}
      {content?.findings && content.findings.length > 0 && (
        <div>
          <p className="font-medium text-sm mb-1">Achados:</p>
          <ul className="list-disc list-inside text-sm text-muted-foreground">
            {content.findings.map((f: string, i: number) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function GenericContent({ content }: { content: any }) {
  if (typeof content === 'string') {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <Markdown>{content}</Markdown>
      </div>
    )
  }
  return (
    <pre className="text-xs overflow-auto max-h-64 p-3 bg-muted rounded-lg">
      {JSON.stringify(content, null, 2)}
    </pre>
  )
}

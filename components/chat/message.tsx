'use client'

/**
 * Message - Vercel Chat SDK Pattern with Artifacts Support
 * 
 * Componente de mensagem individual seguindo o padrao oficial.
 * - Mensagens do usuario: bolha azul alinhada a direita
 * - Mensagens do assistente: sem bolha, alinhada a esquerda com icone sparkles
 * - Suporte a artefatos: codigo, imagens, tabelas, flashcards, resumos
 */

import type { UIMessage } from 'ai'
import { cn } from '@/lib/utils'
import { SparklesIcon, LoaderIcon } from './icons'
import { Markdown } from './markdown'
import { getAgentUI } from '@/lib/ai/agents/ui-config'
import {
  ArtifactRenderer,
  InteractiveArtifact,
  type Artifact,
  createCodeArtifact,
  createSummaryArtifact,
  createFlashcardArtifact,
  createTableArtifact,
  createImageArtifact,
  createQuizArtifact,
  createResearchArtifact,
  createReportArtifact
} from '@/components/artifacts'
import { Code, Image, Table, FileText, Layers, Search, Lightbulb, CheckCircle, FlaskConical, ClipboardList } from 'lucide-react'
import { getStreamingComponent, ToolExecutionIndicator } from './stream-components'
import { MessageActions } from './message-actions'
import { uiMessageToBlocks, groupTextBlocks, type MessageBlock, type TextBlock, type FileBlock } from '@/lib/ai/message-blocks'
import { FileBlockRenderer } from './blocks/file-block'

interface MessageProps {
  message: UIMessage
  isLoading?: boolean
  onEdit?: (messageId: string) => void
  onRegenerate?: () => void
  agentId?: string
  channel?: 'web' | 'whatsapp'
}

/**
 * Renderiza um bloco individual (text, tool, artifact, file, etc)
 */
function MessageBlockRenderer({ block, blockKey }: { block: MessageBlock; blockKey: string }) {
  // File block (images and attachments)
  if (block.type === 'file') {
    const fileBlock = block as FileBlock
    return (
      <FileBlockRenderer
        key={blockKey}
        url={fileBlock.url}
        mediaType={fileBlock.mediaType}
        filename={fileBlock.filename}
        className="mb-2"
      />
    )
  }

  if (block.type === 'text') {
    const textBlock = block as TextBlock
    return (
      <div key={blockKey}>
        <div
          className={cn('break-words rounded-2xl', {
            // User messages: cyan-tinted background (system.md)
            'w-fit px-3 py-2 text-right text-black dark:text-white bg-brand/10 border border-brand/20 text-sm sm:text-base':
              textBlock.role === 'user',
            'bg-transparent text-left text-black dark:text-white text-sm sm:text-base': textBlock.role === 'assistant',
          })}
        >
          {textBlock.role === 'assistant' ? (
            <Markdown>{textBlock.content}</Markdown>
          ) : (
            textBlock.content
          )}
        </div>
      </div>
    )
  }

  if (block.type === 'tool') {
    return renderToolBlock(block as any, blockKey)
  }

  // Artifacts and other types handled by existing logic
  return null
}

/**
 * Renderiza um bloco de tool
 */
function renderToolBlock(toolBlock: any, key: string) {
  const { toolName, state, input, output } = toolBlock

  // Loading states - use streaming components for better UX
  if (state === 'streaming' || state === 'input-streaming' || state === 'input-available') {
    const StreamingComponent = getStreamingComponent(toolName)

    if (StreamingComponent) {
      return (
        <StreamingComponent
          key={key}
          title={input?.title || getToolDisplayName(toolName)}
          className="mt-2"
        />
      )
    }

    // Fallback to generic indicator
    return <ToolExecutionIndicator key={key} toolName={toolName} className="mt-2" />
  }

  // Output available - render artifact if applicable
  if (state === 'output-available' || state === 'done') {
    // Try to render as artifact
    const artifact = parseToolOutputAsArtifact(toolName, output, input)
    if (artifact) {
      return <InteractiveArtifact key={key} artifact={artifact} className="mt-2" />
    }

    // Fallback: render generic tool output
    return (
      <div key={key} className="mt-2 rounded-lg border border-border bg-card overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
          {getToolIcon(toolName)}
          <span className="text-sm font-medium">{getToolDisplayName(toolName)}</span>
        </div>
        {output && (
          <div className="p-3 text-sm">
            {typeof output === 'string' ? (
              <p>{output}</p>
            ) : (
              <pre className="text-xs overflow-x-auto">{JSON.stringify(output, null, 2)}</pre>
            )}
          </div>
        )}
      </div>
    )
  }

  return null
}

// Map tool names to artifact rendering (mantido para compatibilidade)
function renderToolPart(part: any, key: string) {
  const toolName = part.type.replace('tool-', '')
  const state = 'state' in part ? part.state : undefined
  const output = 'output' in part ? part.output : undefined
  const input = 'input' in part ? part.input : undefined

  // Loading states - use streaming components for better UX
  if (state === 'streaming' || state === 'input-streaming' || state === 'input-available') {
    const StreamingComponent = getStreamingComponent(toolName)

    if (StreamingComponent) {
      return (
        <StreamingComponent
          key={key}
          title={input?.title || getToolDisplayName(toolName)}
          className="mt-2"
        />
      )
    }

    // Fallback to generic indicator
    return (
      <ToolExecutionIndicator
        key={key}
        toolName={toolName}
        className="mt-2"
      />
    )
  }

  // Output available - render artifact if applicable
  if (state === 'output-available' || state === 'done') {
    // Try to render as artifact
    const artifact = parseToolOutputAsArtifact(toolName, output, input)
    if (artifact) {
      return (
        <InteractiveArtifact 
          key={key} 
          artifact={artifact} 
          className="mt-2" 
        />
      )
    }

    // Fallback: render generic tool output
    return (
      <div
        key={key}
        className="mt-2 rounded-lg border border-border bg-card overflow-hidden"
      >
        <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 border-b border-border">
          {getToolIcon(toolName)}
          <span className="text-sm font-medium">{getToolDisplayName(toolName)}</span>
        </div>
        {output && (
          <div className="p-3 text-sm">
            {typeof output === 'string' ? (
              <p>{output}</p>
            ) : (
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(output, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    )
  }

  return null
}

// Parse tool output to artifact format
function parseToolOutputAsArtifact(
  toolName: string,
  output: any,
  input: any
): Artifact | null {
  if (!output) return null

  // Unified Tool Handler (createDocument)
  if (toolName === 'createDocument') {
    const kind = output.kind || input?.kind
    const base = {
      id: output.id || input?.id || `art-${Date.now()}`,
      title: output.title || input?.title || 'Documento',
      createdAt: new Date(),
    }

    switch (kind) {
      case 'summary':
        return createSummaryArtifact({ 
          id: base.id,
          title: base.title,
          content: output.content, 
          keyPoints: output.keyPoints, 
          topic: output.topic 
        })
      default:
        // Se o tipo não for summary (por enquanto), não renderiza como artifact
        // ou renderiza um fallback se necessário.
        // Dado que restringimos a tool para apenas 'summary', isso deve ser suficiente.
        return null
    }
  }

  switch (toolName) {
    case 'createCode':
    case 'generateCode':
      return createCodeArtifact({
        title: output.title || input?.title || 'Codigo',
        language: output.language || input?.language || 'typescript',
        code: output.code || output.content || '',
        filename: output.filename,
      })

    case 'createSummary':
    case 'generateSummary':
    case 'summarize':
      return createSummaryArtifact({
        title: output.title || input?.title || 'Resumo',
        content: output.content || output.summary || '',
        keyPoints: output.keyPoints || output.key_points || [],
        source: output.source,
      })

    case 'createFlashcards':
    case 'generateFlashcards':
      const cards = output.cards || output.flashcards || []
      if (cards.length === 0) return null
      return createFlashcardArtifact({
        title: output.title || input?.title || 'Flashcards',
        cards: cards.map((card: any, i: number) => ({
          id: card.id || `card-${i}`,
          front: card.front || card.question || '',
          back: card.back || card.answer || '',
          category: card.category,
        })),
      })

    case 'createTable':
    case 'generateTable':
      return createTableArtifact({
        title: output.title || 'Tabela',
        headers: output.headers || [],
        rows: output.rows || [],
      })

    case 'searchPubMed':
    case 'searchArticles':
      // Search results - render as summary with key points
      if (output.results && Array.isArray(output.results)) {
        return createSummaryArtifact({
          title: `Resultados da Pesquisa: ${input?.query || ''}`,
          content: output.summary || 'Artigos encontrados:',
          keyPoints: output.results.slice(0, 5).map((r: any) => 
            r.title || r.name || JSON.stringify(r)
          ),
          source: 'PubMed / Literatura Cientifica',
        })
      }
      return null

    case 'generateImage':
    case 'createImage':
      if (output.url || output.image_url) {
        return createImageArtifact({
          title: output.title || 'Imagem Gerada',
          url: output.url || output.image_url,
          alt: output.alt || output.description,
        })
      }
      return null

    case 'createQuiz':
    case 'generateQuiz':
      const questions = output.questions || []
      if (questions.length === 0) return null
      return createQuizArtifact({
        title: output.title || input?.title || 'Quiz',
        topic: output.topic || input?.topic || '',
        specialty: output.specialty,
        questions: questions.map((q: any, i: number) => ({
          id: q.id || `q-${i}`,
          text: q.text || q.question || '',
          options: (q.options || []).map((opt: any, j: number) => ({
            id: opt.id || String.fromCharCode(65 + j),
            text: opt.text || '',
            isCorrect: opt.isCorrect || false,
          })),
          explanation: q.explanation || '',
          difficulty: q.difficulty || 'medium',
        })),
      })

    case 'createResearch':
    case 'generateResearch':
      return createResearchArtifact({
        title: output.title || input?.title || 'Pesquisa',
        query: output.query || input?.query || '',
        content: output.content || '',
        sources: (output.sources || []).map((s: any) => ({
          title: s.title || '',
          url: s.url || '',
          summary: s.summary,
          authors: s.authors,
          pubdate: s.pubdate,
        })),
        methodology: output.methodology,
      })

    case 'createReport':
    case 'generateReport':
      return createReportArtifact({
        title: output.title || input?.title || 'Laudo',
        examType: output.examType || 'Exame',
        content: output.content || '',
        findings: output.findings || [],
        recommendations: output.recommendations || [],
        imageUrl: output.imageUrl,
        quality: output.quality,
      })

    default:
      return null
  }
}

// Get display name for tool
function getToolDisplayName(toolName: string): string {
  const names: Record<string, string> = {
    createCode: 'Codigo',
    generateCode: 'Codigo',
    createSummary: 'Resumo',
    generateSummary: 'Resumo',
    summarize: 'Resumo',
    createFlashcards: 'Flashcards',
    generateFlashcards: 'Flashcards',
    createTable: 'Tabela',
    generateTable: 'Tabela',
    searchPubMed: 'Pesquisa PubMed',
    searchArticles: 'Pesquisa de Artigos',
    generateImage: 'Imagem',
    createImage: 'Imagem',
    createQuiz: 'Quiz',
    generateQuiz: 'Quiz',
    createResearch: 'Pesquisa',
    generateResearch: 'Pesquisa',
    createReport: 'Laudo',
    generateReport: 'Laudo',
  }
  return names[toolName] || toolName
}

// Get icon for tool
function getToolIcon(toolName: string) {
  const iconClass = 'h-4 w-4 text-primary'

  if (toolName.includes('code') || toolName.includes('Code')) {
    return <Code className={iconClass} />
  }
  if (toolName.includes('image') || toolName.includes('Image')) {
    return <Image className={iconClass} />
  }
  if (toolName.includes('table') || toolName.includes('Table')) {
    return <Table className={iconClass} />
  }
  if (toolName.includes('flashcard') || toolName.includes('Flashcard')) {
    return <Layers className={iconClass} />
  }
  if (toolName.includes('summary') || toolName.includes('Summary') || toolName.includes('summarize')) {
    return <FileText className={iconClass} />
  }
  if (toolName.includes('search') || toolName.includes('Search')) {
    return <Search className={iconClass} />
  }
  if (toolName.includes('quiz') || toolName.includes('Quiz')) {
    return <CheckCircle className={iconClass} />
  }
  if (toolName.includes('research') || toolName.includes('Research')) {
    return <FlaskConical className={iconClass} />
  }
  if (toolName.includes('report') || toolName.includes('Report')) {
    return <ClipboardList className={iconClass} />
  }

  return <Lightbulb className={iconClass} />
}

export function Message({ message, isLoading, onEdit, onRegenerate, agentId = 'odonto-gpt', channel }: MessageProps) {
  // Convert message to blocks
  const blocks = uiMessageToBlocks(message)
  const groupedBlocks = groupTextBlocks(blocks)

  // Extract text content for copy action
  const textContent = message.parts
    ?.filter((p): p is { type: 'text'; text: string } => p.type === 'text' && 'text' in p)
    .map((p) => p.text)
    .join('\n') || ''

  // Get agent config for avatar
  const agentConfig = getAgentUI(agentId)

  // Create a small badge component for WhatsApp messages
  const ChannelBadge = channel === 'whatsapp' ? (
    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 text-xs font-medium border border-green-200 dark:border-green-800">
      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-1.557.821-2.977 1.993-3.996 3.384-1.02 1.39-1.664 2.967-1.909 4.58-.236 1.53-.082 3.15.456 4.642.543 1.491 1.441 2.801 2.67 3.829 1.229.995 2.758 1.657 4.386 1.88 1.628.221 3.275-.132 4.658-.98 1.382-.848 2.462-2.052 3.072-3.46.609-1.407.843-3.03.667-4.616-.168-1.54-.802-2.936-1.834-4.022C16.146 8.386 14.734 7.498 13.256 7.149c-.746-.182-1.522-.21-2.205-.084zm6.042-4.932C16.537.75 9.662.75 5.344 5.067c-4.318 4.318-4.318 11.192 0 15.51 4.318 4.318 11.192 4.318 15.51 0C24.172 16.192 24.172 9.318 19.854 5.067z"/>
      </svg>
      WhatsApp
    </div>
  ) : null

  return (
    <div
      className="group/message fade-in w-full animate-in duration-200"
      data-role={message.role}
    >
      <div
        className={cn('flex w-full items-start gap-2 sm:gap-3', {
          'justify-end': message.role === 'user',
          'justify-start': message.role === 'assistant',
        })}
      >
        {/* Avatar do assistente - Apple/iOS style gradient */}
        {message.role === 'assistant' && (
          <div
            className={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-xl sm:size-8 sm:rounded-xl',
              'bg-gradient-to-br shadow-md transition-all duration-300 hover:shadow-lg',
              `bg-gradient-to-br ${agentConfig.gradient}`
            )}
          >
            {(() => {
              const IconComponent = agentConfig.icon
              return <IconComponent className="size-4 text-white" />
            })()}
          </div>
        )}

        {/* Conteudo da mensagem - renderizado em blocos */}
        <div
          className={cn('flex min-w-0 flex-col', {
            'gap-2 sm:gap-3 md:gap-4': groupedBlocks.length > 0,
            'w-full max-w-[calc(100%-2.25rem)] sm:max-w-[calc(100%-3rem)]':
              message.role === 'assistant',
            'max-w-[85%] xs:max-w-[80%] sm:max-w-[min(fit-content,75%)]': message.role === 'user',
          })}
        >
          {/* Channel badge for WhatsApp messages */}
          {ChannelBadge}

          {/* Renderizar blocos */}
          {groupedBlocks.map((block, index) => (
            <MessageBlockRenderer
              key={`message-${message.id}-block-${index}`}
              block={block}
              blockKey={`message-${message.id}-block-${index}`}
            />
          ))}

          {/* Fallback para mensagens sem blocos (compatibilidade) */}
          {groupedBlocks.length === 0 &&
            message.parts?.map((part, index) => {
              const key = `message-${message.id}-part-${index}`

              // File parts (images, documents)
              if (part.type === 'file' && 'url' in part) {
                return (
                  <FileBlockRenderer
                    key={key}
                    url={(part as any).url}
                    mediaType={(part as any).mediaType}
                    filename={(part as any).filename}
                    className="mb-2"
                  />
                )
              }

              if (part.type === 'text') {
                return (
                  <div key={key}>
                    <div
                      className={cn('break-words rounded-2xl', {
                        // User messages: cyan-tinted background (system.md)
                        'w-fit px-3 py-2 text-right text-black dark:text-white bg-brand/10 border border-brand/20 text-sm sm:text-base':
                          message.role === 'user',
                        'bg-transparent text-left text-black dark:text-white text-sm sm:text-base': message.role === 'assistant',
                      })}
                    >
                      {message.role === 'assistant' ? (
                        <Markdown>{part.text}</Markdown>
                      ) : (
                        part.text
                      )}
                    </div>
                  </div>
                )
              }

              if (part.type.startsWith('tool-')) {
                return renderToolPart(part, key)
              }

              return null
            })}

          {/* Message Actions */}
          {!isLoading && textContent && (
            <MessageActions
              messageId={message.id}
              content={textContent}
              role={message.role as 'user' | 'assistant'}
              onEdit={onEdit}
              onRegenerate={onRegenerate}
              className="mt-1"
            />
          )}
        </div>
      </div>
    </div>
  )
}

export function ThinkingMessage({ agentId = 'odonto-gpt' }: { agentId?: string }) {
  const agentConfig = getAgentUI(agentId)

  return (
    <div
      className="group/message fade-in w-full animate-in duration-300"
      data-role="assistant"
    >
      <div className="flex items-start justify-start gap-2 sm:gap-3">
        <div
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-xl sm:size-8 sm:rounded-xl',
            'bg-gradient-to-br shadow-md transition-all duration-300',
            `bg-gradient-to-br ${agentConfig.gradient}`
          )}
        >
          {(() => {
            const IconComponent = agentConfig.icon
            return <IconComponent className="size-4 text-white animate-pulse" />
          })()}
        </div>

        <div className="flex w-full flex-col gap-2 sm:gap-3 md:gap-4">
          <div className="flex items-center gap-1 p-0 text-muted-foreground text-xs sm:text-sm">
            <span className="animate-pulse">Pensando</span>
            <span className="inline-flex">
              <span className="animate-bounce [animation-delay:0ms]">.</span>
              <span className="animate-bounce [animation-delay:150ms]">.</span>
              <span className="animate-bounce [animation-delay:300ms]">.</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

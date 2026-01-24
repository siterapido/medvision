'use client'

import { useState, useCallback, useEffect } from 'react'
import { FileText, Save, RotateCcw, Edit3, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { artifactVersionService } from '@/lib/artifacts/version-service'
import { useArtifact } from '@/lib/contexts/artifact-context'
import { toast } from 'sonner'
import ReactMarkdown from 'react-markdown'
import { cn } from '@/lib/utils'

interface TextEditorProps {
  id: string
  initialContent: string
  title?: string
  format?: 'plain' | 'markdown' | 'html'
  className?: string
}

export function TextEditor({ id, initialContent, title, format = 'markdown', className }: TextEditorProps) {
  const { setArtifact, currentArtifact } = useArtifact()
  const [content, setContent] = useState(initialContent)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setContent(initialContent)
    setHasChanges(false)
  }, [initialContent])

  const handleSave = useCallback(async () => {
    if (!content.trim()) return
    
    setIsSaving(true)
    try {
      // Create a new version in the database
      await artifactVersionService.createVersion(id, { content, format }, true)
      
      // Update the artifact in the context
      if (currentArtifact) {
        setArtifact({
          ...currentArtifact,
          content,
        } as any)
      }
      
      setHasChanges(false)
      setIsEditing(false)
      toast.success('Documento salvo com sucesso')
    } catch (err) {
      toast.error('Erro ao salvar documento')
    } finally {
      setIsSaving(false)
    }
  }, [id, content, format, currentArtifact, setArtifact])

  const toggleEdit = () => {
    if (isEditing && hasChanges) {
      if (confirm('Você tem alterações não salvas. Deseja descartar?')) {
        setContent(initialContent)
        setIsEditing(false)
      }
    } else {
      setIsEditing(!isEditing)
    }
  }

  return (
    <div className={cn("flex flex-col h-full bg-background rounded-lg border shadow-sm", className)}>
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">{title || 'Documento'}</span>
          {hasChanges && <span className="text-[10px] text-orange-500 font-bold uppercase italic">Modificado</span>}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-8" onClick={toggleEdit}>
            {isEditing ? (
              <><Eye className="mr-2 h-4 w-4" /> Visualizar</>
            ) : (
              <><Edit3 className="mr-2 h-4 w-4" /> Editar</>
            )}
          </Button>
          {isEditing && (
            <Button 
              variant="default" 
              size="sm" 
              className="h-8" 
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar'}
            </Button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isEditing ? (
          <Textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              setHasChanges(true)
            }}
            className="min-h-[400px] font-mono text-sm resize-none focus-visible:ring-0 border-none shadow-none p-0"
            placeholder="Comece a digitar..."
          />
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {format === 'markdown' ? (
              <ReactMarkdown>{content}</ReactMarkdown>
            ) : (
              <div className="whitespace-pre-wrap">{content}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

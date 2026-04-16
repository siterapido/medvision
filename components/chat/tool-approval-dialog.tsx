'use client'

/**
 * Tool Approval Dialog
 *
 * Dialog for approving or rejecting sensitive tool executions.
 * Used when tools require user confirmation before execution.
 */

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CheckCircle, XCircle, AlertTriangle, User, FileText, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ToolApprovalDialogProps {
  toolName: string
  input?: Record<string, unknown>
  onApprove: () => void
  onReject: () => void
  className?: string
}

// Tool display names and descriptions
const TOOL_INFO: Record<string, { name: string; description: string; icon: React.ReactNode }> = {
  updateStudentProfile: {
    name: 'Atualizar Perfil',
    description: 'Esta acao ira atualizar seu perfil academico com as informacoes coletadas.',
    icon: <User className="h-5 w-5 text-blue-500" />,
  },
  updateUserProfile: {
    name: 'Salvar Perfil',
    description: 'Esta acao ira salvar informacoes no seu perfil de usuario.',
    icon: <User className="h-5 w-5 text-blue-500" />,
  },
  saveResearch: {
    name: 'Salvar Pesquisa',
    description: 'Esta acao ira salvar o dossie de pesquisa na sua biblioteca.',
    icon: <FileText className="h-5 w-5 text-green-500" />,
  },
  savePracticeExam: {
    name: 'Salvar Simulado',
    description: 'Esta acao ira salvar o simulado na sua biblioteca de exercicios.',
    icon: <Save className="h-5 w-5 text-purple-500" />,
  },
}

// Format input for display
function formatInput(input: Record<string, unknown>): React.ReactNode {
  const entries = Object.entries(input).filter(
    ([key, value]) => value !== undefined && value !== null && value !== ''
  )

  if (entries.length === 0) return null

  return (
    <div className="mt-3 space-y-1 rounded-md bg-muted/50 p-3 text-sm">
      {entries.map(([key, value]) => (
        <div key={key} className="flex gap-2">
          <span className="font-medium text-muted-foreground">{formatKey(key)}:</span>
          <span className="text-foreground">{formatValue(value)}</span>
        </div>
      ))}
    </div>
  )
}

// Format key for display
function formatKey(key: string): string {
  const keyMap: Record<string, string> = {
    university: 'Universidade',
    semester: 'Semestre',
    specialty: 'Especialidade',
    level: 'Nivel',
    learningStyle: 'Estilo de Aprendizado',
    responsePreference: 'Preferencia de Resposta',
    title: 'Titulo',
    topic: 'Topico',
    content: 'Conteudo',
  }
  return keyMap[key] || key.charAt(0).toUpperCase() + key.slice(1)
}

// Format value for display
function formatValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.length > 100 ? value.substring(0, 100) + '...' : value
  }
  if (Array.isArray(value)) {
    return value.length + ' itens'
  }
  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value).substring(0, 50) + '...'
  }
  return String(value)
}

export function ToolApprovalDialog({
  toolName,
  input,
  onApprove,
  onReject,
  className,
}: ToolApprovalDialogProps) {
  const toolInfo = TOOL_INFO[toolName] || {
    name: toolName,
    description: `Esta acao ira executar "${toolName}".`,
    icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
  }

  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom)+8px)] z-50 mx-auto w-full max-w-lg px-4',
        'animate-in fade-in slide-in-from-bottom-4 duration-300',
        className
      )}
    >
      <Card className="border-2 border-primary/20 shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            {toolInfo.icon}
            <div>
              <CardTitle className="text-lg">{toolInfo.name}</CardTitle>
              <CardDescription className="mt-1">{toolInfo.description}</CardDescription>
            </div>
          </div>
        </CardHeader>

        {input && Object.keys(input).length > 0 && (
          <CardContent className="pb-3">
            <p className="text-sm font-medium text-muted-foreground">Informacoes a serem salvas:</p>
            {formatInput(input)}
          </CardContent>
        )}

        <CardFooter className="flex gap-3 pt-3">
          <Button
            variant="outline"
            className="flex-1 gap-2"
            onClick={onReject}
          >
            <XCircle className="h-4 w-4" />
            Cancelar
          </Button>
          <Button
            variant="default"
            className="flex-1 gap-2"
            onClick={onApprove}
          >
            <CheckCircle className="h-4 w-4" />
            Aprovar
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

// Inline versions for rendering within messages
export function ToolApprovalInline({
  toolName,
  input,
  onApprove,
  onReject,
}: ToolApprovalDialogProps) {
  const toolInfo = TOOL_INFO[toolName] || {
    name: toolName,
    description: `Executar "${toolName}"?`,
    icon: <AlertTriangle className="h-4 w-4 text-yellow-500" />,
  }

  return (
    <div className="my-2 rounded-lg border border-primary/20 bg-card p-4">
      <div className="flex items-start gap-3">
        {toolInfo.icon}
        <div className="flex-1">
          <p className="font-medium">{toolInfo.name}</p>
          <p className="mt-1 text-sm text-muted-foreground">{toolInfo.description}</p>

          {input && Object.keys(input).length > 0 && (
            <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs">
              {Object.entries(input)
                .filter(([_, v]) => v !== undefined && v !== null)
                .slice(0, 3)
                .map(([k, v]) => (
                  <div key={k}>
                    <span className="font-medium">{formatKey(k)}:</span> {formatValue(v)}
                  </div>
                ))}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="outline" onClick={onReject}>
              Cancelar
            </Button>
            <Button size="sm" onClick={onApprove}>
              Aprovar
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Accepted state
export function ToolApprovalAccepted({ toolName }: { toolName: string }) {
  const toolInfo = TOOL_INFO[toolName] || { name: toolName }

  return (
    <div className="my-2 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400">
      <CheckCircle className="h-4 w-4" />
      <span>Voce aprovou: {toolInfo.name}</span>
    </div>
  )
}

// Rejected state
export function ToolApprovalRejected({ toolName }: { toolName: string }) {
  const toolInfo = TOOL_INFO[toolName] || { name: toolName }

  return (
    <div className="my-2 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
      <XCircle className="h-4 w-4" />
      <span>Voce cancelou: {toolInfo.name}</span>
    </div>
  )
}

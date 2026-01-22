'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Check, Copy, Download, FileCode } from 'lucide-react'
import type { CodeArtifact as CodeArtifactType } from './types'

interface CodeArtifactProps {
  artifact: CodeArtifactType
  className?: string
}

// Language display names and colors
const languageConfig: Record<string, { name: string; color: string }> = {
  javascript: { name: 'JavaScript', color: 'text-yellow-500' },
  typescript: { name: 'TypeScript', color: 'text-blue-500' },
  python: { name: 'Python', color: 'text-green-500' },
  java: { name: 'Java', color: 'text-orange-500' },
  csharp: { name: 'C#', color: 'text-purple-500' },
  cpp: { name: 'C++', color: 'text-blue-400' },
  go: { name: 'Go', color: 'text-cyan-500' },
  rust: { name: 'Rust', color: 'text-orange-600' },
  sql: { name: 'SQL', color: 'text-blue-600' },
  html: { name: 'HTML', color: 'text-orange-500' },
  css: { name: 'CSS', color: 'text-blue-500' },
  json: { name: 'JSON', color: 'text-gray-500' },
  yaml: { name: 'YAML', color: 'text-pink-500' },
  markdown: { name: 'Markdown', color: 'text-gray-600' },
  bash: { name: 'Bash', color: 'text-green-600' },
  shell: { name: 'Shell', color: 'text-green-600' },
}

export function CodeArtifact({ artifact, className }: CodeArtifactProps) {
  const [copied, setCopied] = useState(false)
  const langConfig = languageConfig[artifact.language.toLowerCase()] || {
    name: artifact.language,
    color: 'text-gray-500',
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(artifact.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const downloadCode = () => {
    const blob = new Blob([artifact.code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = artifact.filename || `code.${artifact.language}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const lines = artifact.code.split('\n')

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card overflow-hidden',
        'shadow-sm hover:shadow-md transition-shadow',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/50 border-b border-border">
        <div className="flex items-center gap-2">
          <FileCode className={cn('h-4 w-4', langConfig.color)} />
          <span className="text-sm font-medium text-foreground">
            {artifact.filename || artifact.title || langConfig.name}
          </span>
          <span className={cn('text-xs px-2 py-0.5 rounded-full bg-muted', langConfig.color)}>
            {langConfig.name}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={copyToClipboard}
            className={cn(
              'p-1.5 rounded-md text-muted-foreground',
              'hover:bg-accent hover:text-accent-foreground',
              'transition-colors'
            )}
            title="Copiar codigo"
          >
            {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={downloadCode}
            className={cn(
              'p-1.5 rounded-md text-muted-foreground',
              'hover:bg-accent hover:text-accent-foreground',
              'transition-colors'
            )}
            title="Baixar arquivo"
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Code content */}
      <div className="relative overflow-x-auto">
        <pre className="p-4 text-sm font-mono">
          <code>
            {lines.map((line, index) => {
              const lineNumber = index + 1
              const isHighlighted = artifact.highlightLines?.includes(lineNumber)

              return (
                <div
                  key={index}
                  className={cn(
                    'flex',
                    isHighlighted && 'bg-primary/10 -mx-4 px-4'
                  )}
                >
                  <span className="select-none text-muted-foreground w-8 text-right mr-4 shrink-0">
                    {lineNumber}
                  </span>
                  <span className="flex-1 whitespace-pre">{line || ' '}</span>
                </div>
              )
            })}
          </code>
        </pre>
      </div>
    </div>
  )
}

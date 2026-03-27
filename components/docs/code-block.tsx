'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CodeBlockProps {
  code: string
  title?: string
  className?: string
}

export function CodeBlock({ code, title, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('rounded-xl border border-border/40 overflow-hidden', className)}>
      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/20 border-b border-border/40">
        <span className="text-xs text-muted-foreground font-mono">{title ?? 'bash'}</span>
        <button
          onClick={handleCopy}
          className="p-1 rounded-md hover:bg-muted/50 transition-colors"
          aria-label="Copiar código"
        >
          {copied
            ? <Check className="h-3.5 w-3.5 text-green-500" />
            : <Copy className="h-3.5 w-3.5 text-muted-foreground" />
          }
        </button>
      </div>
      <pre className="p-4 text-sm font-mono text-foreground/85 bg-muted/10 overflow-x-auto leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  )
}

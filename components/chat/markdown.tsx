'use client'

/**
 * Markdown - Vercel Chat SDK Pattern
 *
 * Componente para renderizar Markdown nas respostas do assistente.
 */

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MarkdownProps {
  children: string
}

function CodeBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false)

  const language = className?.replace('language-', '') ?? ''
  const code = typeof children === 'string' ? children : String(children ?? '')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code.replace(/\n$/, ''))
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard not available
    }
  }

  return (
    <div className="group relative my-2 overflow-hidden rounded-lg bg-muted">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-1.5">
        <span className="text-[11px] font-medium text-muted-foreground/70 uppercase tracking-wide">
          {language || 'código'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? 'Copiado' : 'Copiar código'}
          className={cn(
            'flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium transition-colors',
            copied
              ? 'text-green-500'
              : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted-foreground/10'
          )}
        >
          {copied ? (
            <>
              <Check className="size-3" />
              Copiado
            </>
          ) : (
            <>
              <Copy className="size-3" />
              Copiar
            </>
          )}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed">
        <code className={className}>{children}</code>
      </pre>
    </div>
  )
}

export function Markdown({ children }: MarkdownProps) {
  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        'break-words',
        'prose-p:leading-7 prose-p:my-3',
        'prose-pre:p-0 prose-pre:bg-transparent prose-pre:my-0',
        'prose-headings:font-semibold',
        'prose-a:text-primary prose-a:underline',
        'prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-code:py-0.5',
        'prose-ul:my-3 prose-ol:my-3 prose-li:my-1',
        'prose-blockquote:my-3',
        'text-justify',
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Links open in new tab
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          // Fenced code blocks → CodeBlock with copy button
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...props }) => {
            const isBlock = !!className
            if (isBlock) {
              return <CodeBlock className={className}>{children}</CodeBlock>
            }
            return (
              <code className="rounded bg-muted px-1 py-0.5 text-sm" {...props}>
                {children}
              </code>
            )
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  )
}

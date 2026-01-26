'use client'

/**
 * Markdown - Vercel Chat SDK Pattern
 * 
 * Componente para renderizar Markdown nas respostas do assistente.
 */

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface MarkdownProps {
  children: string
}

export function Markdown({ children }: MarkdownProps) {
  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        'prose-p:leading-relaxed prose-pre:p-0',
        'prose-headings:font-semibold',
        'prose-a:text-primary prose-a:underline',
        'prose-code:bg-muted prose-code:rounded prose-code:px-1 prose-code:py-0.5',
        'prose-pre:bg-muted prose-pre:rounded-lg',
        // Force black text in light mode
        'prose-p:text-black prose-headings:text-black prose-li:text-black prose-strong:text-black',
        'dark:prose-p:text-white dark:prose-headings:text-white dark:prose-li:text-white dark:prose-strong:text-white'
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Links abrem em nova aba
          a: ({ href, children }) => (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          ),
          // Code blocks com estilo
          pre: ({ children }) => (
            <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-sm">
              {children}
            </pre>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className
            if (isInline) {
              return (
                <code className="rounded bg-muted px-1 py-0.5 text-sm" {...props}>
                  {children}
                </code>
              )
            }
            return (
              <code className={className} {...props}>
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

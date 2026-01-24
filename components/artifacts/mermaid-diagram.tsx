'use client'

import React, { useEffect, useRef, useState } from 'react'
import mermaid from 'mermaid'
import { Maximize2, Download, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

mermaid.initialize({
  startOnLoad: true,
  theme: 'default',
  securityLevel: 'loose',
  fontFamily: 'inherit',
})

interface MermaidDiagramProps {
  code: string
  title?: string
  className?: string
}

export function MermaidDiagram({ code, title, className }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [svg, setSvg] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isRendering, setIsRendering] = useState(true)

  useEffect(() => {
    async function renderDiagram() {
      if (!code) return
      
      setIsRendering(true)
      setError(null)
      
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`
        const { svg } = await mermaid.render(id, code)
        setSvg(svg)
      } catch (err) {
        console.error('Mermaid render error:', err)
        setError('Erro ao renderizar o diagrama. Verifique a sintaxe.')
      } finally {
        setIsRendering(false)
      }
    }

    renderDiagram()
  }, [code])

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast.success('Código copiado!')
  }

  const handleDownload = () => {
    if (!svg) return
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'diagrama'}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between px-1">
        <h4 className="text-sm font-medium">{title || 'Diagrama'}</h4>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleCopy}>
            {isCopied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleDownload} disabled={!svg}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div 
        className="relative min-h-[200px] w-full rounded-lg border bg-white p-4 overflow-auto flex items-center justify-center"
        style={{ minHeight: '300px' }}
      >
        {isRendering && <Skeleton className="h-full w-full absolute inset-0" />}
        
        {error ? (
          <div className="text-center p-4">
            <p className="text-sm text-destructive font-medium">{error}</p>
            <pre className="mt-2 p-2 bg-muted rounded text-[10px] text-left max-h-40 overflow-auto">
              {code}
            </pre>
          </div>
        ) : (
          <div 
            className="w-full h-full flex justify-center"
            dangerouslySetInnerHTML={{ __html: svg }} 
          />
        )}
      </div>
    </div>
  )
}

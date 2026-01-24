'use client'

import { useState, useCallback, useEffect } from 'react'
import { Play, RotateCcw, Terminal, AlertCircle, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface CodeExecutorProps {
  code: string
  language: string
  className?: string
}

export function CodeExecutor({ code, language, className }: CodeExecutorProps) {
  const [output, setOutput] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  const runCode = useCallback(async () => {
    setIsRunning(true)
    setError(null)
    setOutput([])
    setHasRun(true)

    if (language === 'javascript' || language === 'js') {
      try {
        const logs: string[] = []
        const originalLog = console.log
        console.log = (...args) => {
          logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '))
        }

        // Execute JS in a safe-ish way (still on main thread for now)
        // In a real app, use an iframe sandbox
        const result = eval(code)
        if (result !== undefined) logs.push(`=> ${JSON.stringify(result)}`)
        
        setOutput(logs)
        console.log = originalLog
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsRunning(false)
      }
    } else if (language === 'python' || language === 'py') {
      // Python placeholder - would need Pyodide
      try {
        // Simple mock for now
        setOutput(['Python execution requires Pyodide. Attempting to load...', 'Loading runtime...', 'Ready.'])
        setTimeout(() => {
            setOutput(prev => [...prev, 'Python execution is not fully implemented in this preview.'])
            setIsRunning(false)
        }, 1000)
      } catch (err: any) {
        setError(err.message)
        setIsRunning(false)
      }
    } else {
      setError(`Execução não suportada para a linguagem: ${language}`)
      setIsRunning(false)
    }
  }, [code, language])

  const clearOutput = () => {
    setOutput([])
    setError(null)
    setHasRun(false)
  }

  return (
    <div className={cn("flex flex-col gap-2 rounded-lg border bg-muted/20 overflow-hidden", className)}>
      <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium uppercase tracking-wider">{language} Console</span>
        </div>
        <div className="flex gap-1">
          {hasRun && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearOutput}>
              <RotateCcw className="mr-1 h-3 w-3" />
              Limpar
            </Button>
          )}
          <Button 
            variant="default" 
            size="sm" 
            className="h-7 px-2 text-xs bg-green-600 hover:bg-green-700" 
            onClick={runCode}
            disabled={isRunning}
          >
            <Play className="mr-1 h-3 w-3" />
            {isRunning ? 'Executando...' : 'Executar'}
          </Button>
        </div>
      </div>

      <div className="flex-1 min-h-[150px] bg-zinc-950 p-4 font-mono text-sm leading-relaxed overflow-auto max-h-[400px]">
        {output.length === 0 && !error && !isRunning && !hasRun && (
          <div className="text-zinc-600 italic">Clique em Executar para ver o resultado...</div>
        )}
        
        {isRunning && (
          <div className="text-zinc-400 animate-pulse">Running...</div>
        )}

        <div className="space-y-1">
          {output.map((line, i) => (
            <div key={i} className="text-zinc-100 whitespace-pre-wrap">{line}</div>
          ))}
        </div>

        {error && (
          <div className="mt-2 flex items-start gap-2 text-red-400 bg-red-400/10 p-2 rounded border border-red-400/20">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {hasRun && !error && !isRunning && (
          <div className="mt-4 flex items-center gap-2 text-green-400/60 text-xs border-t border-zinc-800 pt-2">
            <CheckCircle2 className="h-3 w-3" />
            <span>Processo finalizado</span>
          </div>
        )}
      </div>
    </div>
  )
}

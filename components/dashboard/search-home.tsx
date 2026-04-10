"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"
import { ArrowRight, Search, Sparkles } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"

const SUGGESTIONS = [
  "Como tratar uma pulpite irreversível?",
  "Quais os protocolos para clareamento dental?",
  "Gerar um termo de consentimento para implante",
  "Resumir o artigo sobre adesivos dentinários",
]

export function SearchHome() {
  const router = useRouter()
  const [query, setQuery] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSearch = () => {
    if (!query.trim()) return
    // Redireciona para o chat com a query inicial (simulando o comportamento do Perplexity)
    // Precisaremos garantir que o componente de chat saiba lidar com query params ou state
    // Por enquanto, vamos assumir que passar via URL query param funciona ou implementar depois
    router.push(`/dashboard/odonto-vision`)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSearch()
    }
  }

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [query])

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] w-full max-w-3xl mx-auto px-4 animate-in fade-in duration-700 slide-in-from-bottom-4">
      
      {/* Logo e Título */}
      <div className="mb-8 flex flex-col items-center gap-4 text-center">
        <Logo width={180} height={50} className="mb-2" />
        <h1 className="text-2xl md:text-3xl font-medium text-foreground/80 font-jakarta tracking-tight">
          O que você quer descobrir hoje?
        </h1>
      </div>

      {/* Caixa de Busca Principal */}
      <div className="w-full relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-500" />
        <div className="relative bg-background border border-border/60 shadow-lg rounded-2xl p-2 transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 hover:border-border/80">
          <Textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pergunte qualquer coisa sobre odontologia..."
            className="w-full min-h-[60px] max-h-[200px] resize-none border-none bg-transparent px-4 py-3 text-lg placeholder:text-muted-foreground/50 focus-visible:ring-0 font-jakarta"
            rows={1}
          />
          
          <div className="flex items-center justify-between px-2 pb-1 mt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-muted-foreground/60 border border-border/50 rounded-md px-2 py-1 bg-muted/20">
                <Sparkles className="w-3 h-3 inline mr-1 text-primary" />
                IA Pro
              </span>
            </div>
            <button
              onClick={handleSearch}
              disabled={!query.trim()}
              className={cn(
                "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                query.trim()
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              )}
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sugestões */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl">
        {SUGGESTIONS.map((suggestion, index) => (
          <button
            key={index}
            onClick={() => {
              setQuery(suggestion)
              // Opcional: auto-submit ou focar
              textareaRef.current?.focus()
            }}
            className="text-left p-3 rounded-xl border border-border/40 bg-background/40 hover:bg-accent/40 hover:border-border/80 transition-all duration-200 text-sm text-muted-foreground hover:text-foreground flex items-center justify-between group"
          >
            <span>{suggestion}</span>
            <Search className="w-3 h-3 opacity-0 group-hover:opacity-50 -translate-x-2 group-hover:translate-x-0 transition-all" />
          </button>
        ))}
      </div>
    </div>
  )
}

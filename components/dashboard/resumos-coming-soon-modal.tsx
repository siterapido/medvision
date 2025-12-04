"use client"

import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Sparkles, X, FileText } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function ResumosComingSoonModal() {
  const [isOpen, setIsOpen] = useState(true)
  const router = useRouter()

  const handleClose = () => {
    setIsOpen(false)
    // Tenta voltar para a página anterior, se não houver histórico (ex: acesso direto), vai para o dashboard
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent 
        showCloseButton={false}
        className="max-w-md border border-[#1E293B] bg-[#0F192F] p-0 text-white shadow-2xl sm:rounded-2xl overflow-hidden"
        onInteractOutside={(e) => {
          e.preventDefault()
          handleClose()
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault()
          handleClose()
        }}
      >
        <button 
          onClick={handleClose}
          className="absolute right-4 top-4 z-50 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
        >
          <X className="h-4 w-4 text-white" />
          <span className="sr-only">Fechar</span>
        </button>

        {/* Background styles mimicking the brand's dark UI/UX */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,_#0F192F_0%,_#131D37_35%,_#1A2847_65%,_#131D37_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1A2847_0%,_transparent_60%)] opacity-80" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-[radial-gradient(ellipse_at_top,_rgba(8,145,178,0.15)_0%,_transparent_70%)]" />
        </div>

        <div className="relative z-10 flex flex-col items-center justify-center space-y-6 px-8 py-12 text-center">
          <div className="relative">
            <div className="absolute -inset-4 animate-pulse rounded-full bg-[#06b6d4]/20 blur-xl" />
            <div className="relative rounded-full bg-[#0891b2]/10 p-4 ring-1 ring-[#06b6d4]/30">
              <FileText className="h-10 w-10 text-[#22d3ee]" />
            </div>
            <div className="absolute -right-1 -top-1 bg-[#0F192F] rounded-full p-1 border border-[#1E293B]">
                <Sparkles className="h-4 w-4 text-yellow-400" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              Resumos Inteligentes
            </h2>
            <p className="text-slate-300">
              Em breve você poderá gerar resumos completos de qualquer especialidade odontológica com nossa IA.
            </p>
          </div>

          <div className="pt-4">
            <div className="rounded-xl bg-white/5 px-6 py-3 backdrop-blur-sm ring-1 ring-white/10">
              <span className="text-sm font-medium text-slate-200">Funcionalidade em desenvolvimento</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

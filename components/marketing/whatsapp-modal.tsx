"use client"

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { MessageSquare, ArrowRight, Brain, Zap, Clock } from "lucide-react"
import Link from "next/link"

interface WhatsAppModalProps {
  children: React.ReactNode
  phoneNumber?: string
  message?: string
}

export function WhatsAppModal({
  children,
  phoneNumber = "5584986260850",
  message = "Olá, gostaria de saber mais sobre a Odonto Suite"
}: WhatsAppModalProps) {
  const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`

  return (
    <Dialog>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-emerald-500/20 bg-slate-950 shadow-2xl shadow-emerald-900/20 gap-0">
        <div className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-6 border-b border-emerald-500/10">
          {/* Decorative background elements matching sidebar style */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 pointer-events-none" />
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 text-white">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-inner shadow-emerald-500/5">
                <MessageSquare className="h-6 w-6" />
              </div>
              <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                Odonto Suite
              </span>
            </h2>
            <p className="text-slate-400 text-sm leading-relaxed pl-[3.25rem]">
              Converse com nossa IA via WhatsApp para suporte clínico imediato.
            </p>
          </div>
        </div>

        <div className="p-6 bg-slate-950/50 space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Brain className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-emerald-100">IA Especializada</h3>
                <p className="text-xs text-slate-400 mt-1">Diagnósticos baseados em evidências.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Zap className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-emerald-100">Respostas Rápidas</h3>
                <p className="text-xs text-slate-400 mt-1">Disponível 24/7 sem filas de espera.</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
                <Clock className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-medium text-sm text-emerald-100">Acesso Fácil</h3>
                <p className="text-xs text-slate-400 mt-1">Use áudio ou texto direto no WhatsApp.</p>
              </div>
            </div>
          </div>

          <Button
            className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold h-12 rounded-xl shadow-lg shadow-emerald-500/20 border border-emerald-400/20 text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            asChild
          >
            <Link href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              Iniciar Conversa
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <p className="text-center text-[10px] text-slate-500 uppercase tracking-wider">
            Redirecionando para WhatsApp
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}


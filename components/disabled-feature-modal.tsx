"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  MonitorPlay,
  FileBadge
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

interface DisabledFeatureModalProps {
  feature: 'biblioteca' | 'odontoflix' | 'certificados'
  onClose?: () => void
}

const featureConfig = {
  biblioteca: {
    icon: BookOpen,
    title: 'Biblioteca em Desenvolvimento',
    description: 'Estamos preparando a Biblioteca de Conhecimento com todos os recursos de RAG integrados.',
    message: 'Em breve você poderá acessar pesquisas científicas, resumos, simulados, flashcards e muito mais!',
  },
  odontoflix: {
    icon: MonitorPlay,
    title: 'OdontoFlix em Desenvolvimento',
    description: 'Estamos finalizando a plataforma de streaming de cursos com novos conteúdos.',
    message: 'Em breve você terá acesso a aulas em vídeo com os melhores especialistas em odontologia.',
  },
  certificados: {
    icon: FileBadge,
    title: 'Certificados em Desenvolvimento',
    description: 'Estamos organizando o sistema de geração e gerenciamento de certificados.',
    message: 'Em breve você poderá gerenciar e baixar seus certificados de conclusão.',
  }
}

export function DisabledFeatureModal({ feature, onClose }: DisabledFeatureModalProps) {
  const router = useRouter()
  const config = featureConfig[feature]
  const Icon = config.icon

  const handleGoBack = () => {
    router.push('/dashboard')
    onClose?.()
  }

  return (
    <Dialog open={true} onOpenChange={(open) => {
      if (!open) handleGoBack()
    }}>
      <DialogContent className="glass-card border-white/10 sm:max-w-[500px] p-0 rounded-[2rem] overflow-hidden bg-card/95 backdrop-blur-2xl">
        {/* Header Background */}
        <div className="relative h-32 bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-b border-white/5">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="absolute inset-0 bg-grid-white/[0.02]" />
            <div className="relative p-4 rounded-2xl bg-amber-500/20 border border-amber-500/30">
              <Icon className="h-8 w-8 text-amber-500" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <DialogTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-amber-500" />
              {config.title}
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              {config.description}
            </DialogDescription>
          </div>

          {/* Message Box */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              ⏰ {config.message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              onClick={handleGoBack}
              variant="default"
              className="flex-1 rounded-lg h-10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 border-t border-white/5 bg-muted/5">
          <p className="text-xs text-muted-foreground text-center">
            Obrigado pela paciência! Estamos trabalhando duro para lançar em breve.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

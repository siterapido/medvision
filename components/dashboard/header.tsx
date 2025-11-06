"use client"

import {
  Context,
  ContextContent,
  ContextContentBody,
  ContextContentFooter,
  ContextContentHeader,
  ContextTrigger,
} from "@/components/ai-elements/context"
import { Actions, Action } from "@/components/ai-elements/actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Bell, Settings2 } from "lucide-react"

export function DashboardHeader() {
  return (
    <header className="border-b border-border/60 bg-white/90 px-6 py-4 shadow-sm backdrop-blur md:px-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Painel clínico</p>
            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary">
              Beta IA
            </Badge>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Bom dia, Dra. Silva</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe suas conversas com IA, progresso nos cursos e recomendações personalizadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Context
            usedTokens={18000}
            maxTokens={60000}
            modelId="gpt-4o-mini"
            usage={{ inputTokens: 12000, outputTokens: 6000 }}
          >
            <ContextTrigger>
              <Button variant="outline" size="sm" className="gap-2">
                Contexto
              </Button>
            </ContextTrigger>
            <ContextContent>
              <ContextContentHeader />
              <ContextContentBody>
                <div className="space-y-2 text-xs text-muted-foreground">
                  <p>Modelo: GPT-4o mini</p>
                  <p>Dias restantes do ciclo: 12</p>
                </div>
              </ContextContentBody>
              <ContextContentFooter />
            </ContextContent>
          </Context>

          <Actions>
            <Action tooltip="Notificações">
              <Bell className="h-4 w-4" />
            </Action>
            <Action tooltip="Preferências">
              <Settings2 className="h-4 w-4" />
            </Action>
          </Actions>

          <div className="hidden items-center gap-3 rounded-full border border-border/80 bg-white px-3 py-1.5 md:flex">
            <div className="h-8 w-8 rounded-full bg-primary/10 text-xs font-semibold uppercase text-primary ring-1 ring-primary/20">
              <div className="flex h-full w-full items-center justify-center">DS</div>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-slate-900">Dra. Daniela</p>
              <p className="text-xs text-muted-foreground">CRM 123456</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

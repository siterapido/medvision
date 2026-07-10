"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function ConfiguracoesPage() {
  return (
    <div
      data-surface="product"
      className="container mx-auto max-w-3xl space-y-8 px-4 py-6 md:py-8"
    >
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink md:text-3xl">
          Configurações
        </h1>
        <p className="text-sm text-ink-muted">
          Preferências da conta e do aplicativo.
        </p>
      </div>

      <div className="space-y-6">
        <section className="rounded-xl border border-rule bg-surface-raised">
          <div className="border-b border-rule px-5 py-4 md:px-6">
            <h2 className="font-heading text-base font-semibold text-ink">Conta</h2>
            <p className="mt-0.5 text-sm text-ink-muted">Dados pessoais e perfil profissional.</p>
          </div>
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-ink">Perfil do usuário</Label>
              <p className="text-sm text-ink-muted">Nome, CRM e especialidade.</p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link href="/dashboard/perfil">Editar perfil</Link>
            </Button>
          </div>
        </section>

        <section className="rounded-xl border border-rule bg-surface-raised">
          <div className="border-b border-rule px-5 py-4 md:px-6">
            <h2 className="font-heading text-base font-semibold text-ink">Notificações</h2>
            <p className="mt-0.5 text-sm text-ink-muted">O que você deseja receber por email.</p>
          </div>
          <div className="divide-y divide-rule px-5 md:px-6">
            <div className="flex items-center justify-between gap-4 py-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-ink">Emails de marketing</Label>
                <p className="text-sm text-ink-muted">Novidades e ofertas do MedVision.</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between gap-4 py-4">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium text-ink">Alertas do sistema</Label>
                <p className="text-sm text-ink-muted">Notificações importantes sobre sua conta.</p>
              </div>
              <Switch defaultChecked disabled />
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-rule bg-surface-raised">
          <div className="border-b border-rule px-5 py-4 md:px-6">
            <h2 className="font-heading text-base font-semibold text-ink">Segurança</h2>
            <p className="mt-0.5 text-sm text-ink-muted">Proteção de acesso à conta.</p>
          </div>
          <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium text-ink">Senha</Label>
              <p className="text-sm text-ink-muted">Alterar senha de acesso.</p>
            </div>
            <Button variant="outline" size="sm" disabled className="shrink-0">
              Em breve
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

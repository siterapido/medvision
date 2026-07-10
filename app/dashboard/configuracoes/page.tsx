"use client"

import * as React from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { toast } from "sonner"
import { Loader2, Building2 } from "lucide-react"

type Organization = {
  id: string
  name: string
  role: string
  createdAt?: string
}

export default function ConfiguracoesPage() {
  const [organizations, setOrganizations] = React.useState<Organization[]>([])
  const [loadingOrgs, setLoadingOrgs] = React.useState(true)
  const [clinicName, setClinicName] = React.useState("")
  const [creating, setCreating] = React.useState(false)

  const loadOrganizations = React.useCallback(async () => {
    setLoadingOrgs(true)
    try {
      const res = await fetch("/api/organizations")
      if (!res.ok) throw new Error("Falha ao carregar clínicas")
      const data = await res.json()
      setOrganizations(data.organizations ?? [])
    } catch {
      setOrganizations([])
    } finally {
      setLoadingOrgs(false)
    }
  }, [])

  React.useEffect(() => {
    void loadOrganizations()
  }, [loadOrganizations])

  const createClinic = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = clinicName.trim()
    if (!name || creating) return
    setCreating(true)
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      const body = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(body?.error || "Falha ao criar clínica")
      }
      setClinicName("")
      toast.success("Clínica criada")
      await loadOrganizations()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar clínica")
    } finally {
      setCreating(false)
    }
  }

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
            <h2 className="font-heading text-base font-semibold text-ink flex items-center gap-2">
              <Building2 className="h-4 w-4 text-signal" aria-hidden />
              Clínica
            </h2>
            <p className="mt-0.5 text-sm text-ink-muted">
              Fundação multi-clínica — associe laudos a uma organização.
            </p>
          </div>
          <div className="space-y-4 px-5 py-4 md:px-6">
            {loadingOrgs ? (
              <p className="flex items-center gap-2 text-sm text-ink-muted">
                <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
              </p>
            ) : organizations.length > 0 ? (
              <ul className="space-y-2">
                {organizations.map((org) => (
                  <li
                    key={org.id}
                    className="flex items-center justify-between rounded-lg border border-rule bg-surface px-3 py-2"
                  >
                    <span className="text-sm font-medium text-ink">{org.name}</span>
                    <span className="text-[11px] uppercase tracking-wide text-ink-muted">
                      {org.role}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">Nenhuma clínica associada ainda.</p>
            )}

            <form onSubmit={createClinic} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="flex-1 space-y-1">
                <Label htmlFor="clinic-name" className="text-xs text-ink-muted">
                  Criar clínica
                </Label>
                <Input
                  id="clinic-name"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Nome da clínica"
                  maxLength={200}
                  className="border-rule bg-surface"
                />
              </div>
              <Button
                type="submit"
                size="sm"
                disabled={creating || !clinicName.trim()}
                className="shrink-0"
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Criando…
                  </>
                ) : (
                  "Criar clínica"
                )}
              </Button>
            </form>
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

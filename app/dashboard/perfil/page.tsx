import { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ProfileForm } from "./profile-form"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata: Metadata = {
  title: "Meu Perfil | MedVision",
  description: "Gerencie suas informações pessoais e assinatura.",
}

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) {
    return <div className="px-4 py-8 text-sm text-ink-muted">Erro ao carregar perfil.</div>
  }

  const trialEnds = profile.trial_ends_at
    ? new Date(profile.trial_ends_at).toLocaleDateString("pt-BR")
    : null
  const isPremium = profile.plan_type !== "free"
  const statusMap: Record<string, string> = {
    active: "Ativo",
    canceled: "Cancelado",
    past_due: "Pendente",
    trialing: "Período de teste",
    free: "Gratuito",
  }

  const statusLabel = statusMap[profile.subscription_status || "free"] || profile.subscription_status
  const planLabel =
    profile.plan_type === "annual"
      ? "Premium anual"
      : profile.plan_type === "monthly"
        ? "Premium mensal"
        : "Gratuito"

  return (
    <div
      data-surface="product"
      className="container mx-auto max-w-3xl space-y-8 px-4 py-6 md:py-8"
    >
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-ink md:text-3xl">
          Meu perfil
        </h1>
        <p className="text-sm text-ink-muted">
          Dados da conta e assinatura.
        </p>
      </div>

      <div className="space-y-6">
        <ProfileForm
          initialData={{
            name: profile.name || profile.full_name,
            email: user.email,
            telefone: profile.telefone,
            cro: profile.cro,
            especialidade: profile.especialidade,
          }}
        />

        <section className="rounded-xl border border-rule bg-surface-raised">
          <div className="border-b border-rule px-5 py-4 md:px-6">
            <h2 className="font-heading text-base font-semibold text-ink">Assinatura</h2>
            <p className="mt-0.5 text-sm text-ink-muted">Plano e status da conta.</p>
          </div>

          <dl className="divide-y divide-rule px-5 md:px-6">
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-ink-muted">Plano</dt>
              <dd className="text-sm font-medium text-ink">{planLabel}</dd>
            </div>
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-ink-muted">Status</dt>
              <dd className="text-sm font-medium text-ink">{statusLabel}</dd>
            </div>
            {trialEnds && (
              <div className="flex items-center justify-between gap-4 py-3">
                <dt className="text-sm text-ink-muted">Fim do teste</dt>
                <dd className="text-sm font-medium text-ink">{trialEnds}</dd>
              </div>
            )}
          </dl>

          {!isPremium && (
            <div className="border-t border-rule px-5 py-4 md:px-6">
              <p className="text-sm text-ink-muted">
                Faça upgrade para laudos e análises ilimitadas no Med Vision.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3">
                <Link href="/assinar">Ver planos</Link>
              </Button>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

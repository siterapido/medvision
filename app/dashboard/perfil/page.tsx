import { ProfileForm } from "@/components/profile/profile-form"
import { createClient } from "@/lib/supabase/server"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DashboardScrollArea } from "@/components/layout/dashboard-scroll-area"

export default async function PerfilPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  const { data: subscription } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).single()

  const displayName = profile?.name || user.email?.split("@")[0] || "Profissional"
  const professionalRole = profile?.profession || "Profissional da odontologia"
  const companyName = profile?.company || "Clínica não informada"

  const initials = displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "OG"

  const planType =
    subscription?.plan_type === "monthly"
      ? "Plano Mensal Pro"
      : subscription?.plan_type === "annual"
        ? "Plano Anual Pro"
        : "Plano Free"

  const memberSince = profile?.created_at
    ? format(new Date(profile.created_at), "MMMM 'de' yyyy", { locale: ptBR })
    : "Recente"

  return (
    <DashboardScrollArea className="px-0">
      <div className="relative mx-auto max-w-5xl space-y-8 px-4 py-6 lg:px-0">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Área do profissional</p>
        <h1 className="text-3xl font-semibold text-slate-900">Seu perfil no Odonto GPT</h1>
        <p className="text-base text-slate-600">
          Centralize informações clínicas e mantenha seus dados alinhados com a experiência premium do app.
        </p>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-[#24324F]/50 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 px-6 py-8 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-60">
          <div className="absolute inset-0 bg-[radial-gradient(75%_65%_at_15%_20%,rgba(8,145,178,0.35),transparent),radial-gradient(60%_60%_at_85%_30%,rgba(6,182,212,0.25),transparent)]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent)] mix-blend-screen" />
        </div>

        <div className="relative">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
            <div className="relative w-fit">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/10 text-3xl font-semibold text-white backdrop-blur">
                {initials}
              </div>
              <span className="absolute -bottom-1 -right-1 rounded-full bg-emerald-500/90 px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
                ativo
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-white/70">Bem-vindo(a) de volta</p>
              <h2 className="text-2xl font-semibold">{displayName}</h2>
              <p className="text-sm text-white/70">{professionalRole}</p>
              <p className="text-sm text-white/60">{companyName}</p>

              <div className="flex flex-wrap gap-3 pt-3 text-xs font-medium">
                <span className="rounded-full bg-white/10 px-3 py-1 text-white">{planType}</span>
                <span className="rounded-full border border-white/20 px-3 py-1 text-white/80">Membro desde {memberSince}</span>
                {profile?.cro && <span className="rounded-full px-3 py-1 text-white/60">CRO {profile.cro}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProfileForm
        initialData={{
          name: profile?.name || "",
          email: profile?.email || user.email || "",
          profession: profile?.profession || "",
          cro: profile?.cro || "",
          company: profile?.company || "",
        }}
      />
    </div>
    </DashboardScrollArea>
  )
}

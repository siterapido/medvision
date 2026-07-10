import Link from "next/link"

import { RegisterForm } from "@/components/auth/register-form"
import { AuthShell } from "@/components/marketing/auth-shell"
import { DEFAULT_TRIAL_DAYS, normalizeTrialDays } from "@/lib/trial"

type RegisterPageProps = {
  searchParams?: Promise<{
    trial?: string
  }>
}

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const resolvedSearchParams = (await searchParams) ?? {}
  const requestedTrial =
    typeof resolvedSearchParams.trial === "string"
      ? Number(resolvedSearchParams.trial)
      : undefined
  const trialDays = normalizeTrialDays(requestedTrial, DEFAULT_TRIAL_DAYS)

  return (
    <AuthShell>
      <div className="w-full max-w-md rounded-xl border border-rule bg-surface-raised p-5 sm:p-7">
        <h2 className="mb-5 text-lg font-semibold tracking-tight text-ink sm:mb-6 sm:text-xl">
          Criar conta
        </h2>
        <RegisterForm trialDays={trialDays} />
        <p className="mt-6 border-t border-rule pt-5 text-center text-sm text-ink-muted">
          Já tem uma conta?{" "}
          <Link
            href="/login"
            className="font-semibold text-signal transition-colors hover:text-signal/80"
          >
            Entrar
          </Link>
        </p>
      </div>
    </AuthShell>
  )
}

import { LoginForm } from "@/components/auth/login-form"
import { AuthShell } from "@/components/marketing/auth-shell"

export default function LoginPage() {
  return (
    <AuthShell>
      <div className="w-full max-w-md rounded-xl border border-rule bg-surface-raised p-5 sm:p-7">
        <h2 className="mb-5 text-lg font-semibold tracking-tight text-ink sm:mb-6 sm:text-xl">
          Acesso
        </h2>
        <LoginForm />
      </div>
    </AuthShell>
  )
}

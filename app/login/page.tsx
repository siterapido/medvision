import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { Logo } from "@/components/logo"
import { Shield, Zap } from "lucide-react"

export default function LoginPage() {
  return (
    <div
      data-surface="product"
      className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-paper"
    >
      <main className="relative z-10 w-full max-w-md px-4 py-8 sm:py-10">
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-block">
            <Logo variant="auto" width={140} height={30} className="text-ink" />
          </Link>
        </div>

        <div className="relative motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300">
          <div className="relative rounded-xl border border-border bg-surface-raised p-5 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="mb-1.5 text-xl font-semibold tracking-tight text-ink sm:mb-2 sm:text-2xl">
                Bem-vindo de volta
              </h1>
              <p className="text-sm text-ink-muted">Acesso ao ambiente clínico MedVision</p>
            </div>

            <LoginForm variant="light" />

            <div className="mt-6 border-t border-border pt-5 sm:mt-8 sm:pt-6">
              <p className="text-center text-sm text-ink-muted">
                Ainda não tem uma conta?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-signal transition-colors hover:text-signal/80"
                >
                  Criar conta
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-ink-muted transition-colors hover:text-signal"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar para o site
          </Link>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-ink-muted sm:mt-8 sm:gap-6 [&_svg]:text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" aria-hidden />
            <span>Dados seguros</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" aria-hidden />
            <span>Acesso 24/7</span>
          </div>
        </div>
      </main>
    </div>
  )
}

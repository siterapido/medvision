import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { Logo } from "@/components/logo"
import { Brain, Sparkles, Shield, Zap } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-white">
      {/* Brilho muito suave no topo — só para não ficar “papel chapado”; quase imperceptível */}
      <div
        className="pointer-events-none fixed inset-0 z-0"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% -20%, rgba(16, 185, 129, 0.06) 0%, transparent 55%)",
        }}
      />

      {/* Content — página e card claros */}
      <main className="relative z-10 w-full max-w-md px-4 py-8 sm:py-10">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="inline-block">
            <Logo variant="white" width={140} height={30} />
          </Link>
        </div>

        {/* Login Card — leve sombra para separar do fundo branco */}
        <div className="relative motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in-95 motion-safe:duration-300">
          <div className="relative rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_12px_40px_-8px_rgba(15,23,42,0.08),0_4px_16px_-4px_rgba(15,23,42,0.04)] sm:p-8">
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-200/90 bg-emerald-50 px-3 py-1.5 sm:mb-4">
                <Sparkles className="h-4 w-4 text-emerald-600" aria-hidden />
                <span className="text-xs font-semibold text-emerald-800">Plataforma de IA</span>
              </div>
              <h1 className="mb-1.5 text-xl font-bold tracking-tight text-slate-900 sm:mb-2 sm:text-2xl">
                Bem-vindo de volta
              </h1>
              <p className="text-sm text-slate-600">Entre para acessar sua conta</p>
            </div>

            {/* Form */}
            <LoginForm variant="light" />

            {/* Divider */}
            <div className="mt-6 border-t border-slate-200 pt-5 sm:mt-8 sm:pt-6">
              <p className="text-center text-sm text-slate-600">
                Ainda não tem uma conta?{" "}
                <Link
                  href="/register"
                  className="font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
                >
                  Criar conta
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-slate-600 transition-colors hover:text-emerald-700"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Voltar para o site
          </Link>
        </div>

        {/* Trust indicators */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-500 sm:mt-8 sm:gap-6 [&_svg]:text-slate-400">
          <div className="flex items-center gap-1.5">
            <Shield className="h-3.5 w-3.5" aria-hidden />
            <span>Dados seguros</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5" aria-hidden />
            <span>Acesso 24/7</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5" aria-hidden />
            <span>IA Especializada</span>
          </div>
        </div>
      </main>
    </div>
  )
}

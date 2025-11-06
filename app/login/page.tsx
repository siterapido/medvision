import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { Logo } from "@/components/logo"
import { Brain, MessageSquare, Shield, Sparkles } from "lucide-react"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex bg-login-page">
      {/* Left Side - Branding & Visual */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-[#0F192F] via-[#131D37] to-[#1A2847] p-12 flex-col justify-between">
        {/* Background Effects */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-grid-pattern"></div>
          <div className="absolute top-20 left-20 w-96 h-96 bg-[#2399B4]/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
        </div>

        {/* Content */}
        <div className="relative z-10">
          <div className="mb-8">
            <Logo width={180} height={40} className="login-logo-white" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 leading-tight">
            Sua Plataforma de IA <br />
            <span className="bg-gradient-to-r from-primary via-accent to-cyan-400 bg-clip-text text-transparent">
              Especializada em Odontologia
            </span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 leading-relaxed">
            Respostas científicas instantâneas, disponíveis 24/7 no seu WhatsApp
          </p>
        </div>

        {/* Features */}
        <div className="relative z-10 space-y-6">
          <div className="flex items-start gap-4 text-white">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">IA Treinada em Odontologia</h3>
              <p className="text-sm text-slate-400">Base de conhecimento especializada com literatura científica atualizada</p>
            </div>
          </div>

          <div className="flex items-start gap-4 text-white">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Acesso via WhatsApp</h3>
              <p className="text-sm text-slate-400">Interface familiar e prática para uso no dia a dia clínico</p>
            </div>
          </div>

          <div className="flex items-start gap-4 text-white">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Shield className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-1">Seguro e Confiável</h3>
              <p className="text-sm text-slate-400">Respostas baseadas em evidências e protocolos reconhecidos</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <Logo width={160} height={38} />
            </div>
          </div>

          {/* Login Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Bem-vindo de volta</h2>
              <p className="text-slate-600 dark:text-slate-400">Entre para acessar sua conta</p>
            </div>

            <LoginForm />

            <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
              <p className="text-center text-sm text-slate-600 dark:text-slate-400">
                Não tem uma conta?{" "}
                <Link
                  href="/register"
                  className="text-primary hover:text-primary-hover font-semibold transition-colors"
                >
                  Criar conta
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Link */}
          <div className="mt-6 text-center">
            <Link
              href="/"
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors"
            >
              ← Voltar para o site
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

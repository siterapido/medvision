import Link from "next/link"
import { RegisterForm } from "@/components/auth/register-form"
import { Logo } from "@/components/logo"

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-[#0F192F] via-[#131D37] to-[#1A2847] p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern"></div>
        <div className="absolute top-20 left-20 w-96 h-96 bg-[#2399B4]/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <Logo width={180} height={42} className="login-logo-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Crie sua conta
          </h1>
          <p className="text-slate-300">
            Comece sua jornada com IA odontológica hoje mesmo
          </p>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8">
          <RegisterForm />
          
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
            <p className="text-center text-sm text-slate-600 dark:text-slate-400">
              Já tem uma conta?{" "}
              <Link 
                href="/login" 
                className="text-primary hover:text-primary-hover font-semibold transition-colors"
              >
                Entrar
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            ← Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  )
}

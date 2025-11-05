import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary mb-4">
            <svg className="w-8 h-8 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Odonto GPT</h1>
          <p className="text-muted-foreground">Sua plataforma de IA para odontologia</p>
        </div>

        <div className="bg-card rounded-2xl shadow-lg border border-border p-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">Entrar</h2>
          <LoginForm />
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Não tem uma conta?{" "}
              <Link href="/register" className="text-primary hover:text-primary-hover font-medium transition-colors">
                Criar conta
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

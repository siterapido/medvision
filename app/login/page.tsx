import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { Logo } from "@/components/logo"

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-teal-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4">
            <Logo width={160} height={38} />
            <span className="sr-only">Odonto GPT</span>
          </div>
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

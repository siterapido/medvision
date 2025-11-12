import Link from "next/link"

export function DashboardFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-4 md:px-6">
      <div className="flex flex-col items-center justify-between gap-3 text-xs text-slate-400 md:flex-row">
        <p className="text-center md:text-left">
          © {currentYear} OdontoGPT. Todos os direitos reservados.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/termos"
            className="transition-colors hover:text-slate-200"
          >
            Termos de Uso
          </Link>
          <span className="text-slate-700">•</span>
          <Link
            href="/privacidade"
            className="transition-colors hover:text-slate-200"
          >
            Política de Privacidade
          </Link>
          <span className="text-slate-700">•</span>
          <Link
            href="/suporte"
            className="transition-colors hover:text-slate-200"
          >
            Suporte
          </Link>
        </div>
      </div>
    </footer>
  )
}

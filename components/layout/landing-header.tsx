import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "../ui/button"
import { Logo } from "../logo"

export const landingNavLinks = [
  { label: "Como Funciona", href: "#como-funciona" },
  { label: "Benefícios", href: "#beneficios" },
  { label: "Planos", href: "#planos" },
  { label: "FAQ", href: "#faq" },
]

export const landingHeaderClassName =
  "site-header landing-header border-b border-white/10 bg-slate-950/80 px-4 py-3 backdrop-blur-xl"

export const landingNavClassName =
  "hidden items-center gap-6 text-sm font-semibold text-white/80 transition-colors lg:flex"

export function LandingHeader() {
  return (
    <header className={landingHeaderClassName} role="banner">
      <div className="container mx-auto flex items-center justify-between gap-4">
        <Link href="/" aria-label="Ir para o topo da página" className="flex items-center">
          <Logo variant="white" width={140} height={38} />
        </Link>

        <nav
          data-testid="landing-nav"
          aria-label="Navegação principal"
          className={landingNavClassName}
        >
          {landingNavLinks.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button asChild variant="cta" size="sm">
            <Link href="#planos" className="flex items-center">
              Garantir Acesso
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

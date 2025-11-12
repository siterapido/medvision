import Link from "next/link"
import { MessageSquare } from "lucide-react"

import { Logo } from "../logo"

export const landingFooterClassName =
  "site-footer landing-footer border-t border-slate-700 bg-footer"

export function LandingFooter() {
  return (
    <footer
      data-testid="landing-footer"
      role="contentinfo"
      className={landingFooterClassName}
    >
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Logo width={180} height={40} className="footer-logo-white" />
              <span className="sr-only">Odonto GPT</span>
            </div>
            <p className="text-sm text-slate-400">Inteligência Artificial especializada em Odontologia</p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white">Produto</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="#como-funciona" className="hover:text-primary transition-colors">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link href="#beneficios" className="hover:text-primary transition-colors">
                  Benefícios
                </Link>
              </li>
              <li>
                <Link href="#planos" className="hover:text-primary transition-colors">
                  Planos
                </Link>
              </li>
              <li>
                <Link href="#faq" className="hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/termos" className="hover:text-primary transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-primary transition-colors">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white">Suporte</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors flex items-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Suporte via WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-slate-700 pt-8 text-center text-sm text-slate-400">
          <p>© 2025 Odonto GPT. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

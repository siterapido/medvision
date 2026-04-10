import Link from "next/link"
import { MessageSquare } from "lucide-react"

import { Logo } from "../logo"

import { WhatsAppModal } from "../marketing/whatsapp-modal"

export const landingFooterClassName =
  "site-footer landing-footer border-t border-slate-700 bg-footer"

export function LandingFooter() {
  return (
    <footer
      data-testid="landing-footer"
      role="contentinfo"
      className="site-footer landing-footer border-t border-slate-800 bg-[#080D19] relative z-20"
    >
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Logo width={160} height={36} variant="white" />
              <span className="sr-only">MedVision</span>
            </div>
            <p className="text-sm text-slate-500">Inteligência Artificial especializada em Odontologia</p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white">Produto</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <Link href="#como-funciona" className="hover:text-[#22d3ee] transition-colors">
                  Como Funciona
                </Link>
              </li>
              <li>
                <Link href="#vantagens" className="hover:text-[#22d3ee] transition-colors">
                  Vantagens
                </Link>
              </li>
              <li>
                <Link href="#planos" className="hover:text-[#22d3ee] transition-colors">
                  Planos
                </Link>
              </li>
              <li>
                <Link href="#faq" className="hover:text-[#22d3ee] transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <Link href="/termos" className="hover:text-[#22d3ee] transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-[#22d3ee] transition-colors">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-white">Suporte</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>
                <WhatsAppModal>
                  <button className="hover:text-[#22d3ee] transition-colors flex items-center gap-2 text-left">
                    <MessageSquare className="h-4 w-4" />
                    Suporte via WhatsApp
                  </button>
                </WhatsAppModal>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-800/50 pt-8 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} MedVision. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  )
}

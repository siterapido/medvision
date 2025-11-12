import Link from "next/link"
import { cn } from "@/lib/utils"

interface FooterLink {
  label: string
  href: string
}

interface FooterProps {
  /**
   * Texto de copyright (sem o ano, que é adicionado automaticamente)
   */
  copyrightText?: string
  /**
   * Links do footer
   */
  links?: FooterLink[]
  /**
   * Mostrar separadores entre links
   */
  showSeparators?: boolean
  /**
   * Conteúdo adicional à esquerda
   */
  leftContent?: React.ReactNode
  /**
   * Conteúdo adicional à direita
   */
  rightContent?: React.ReactNode
  /**
   * Classes CSS adicionais
   */
  className?: string
}

export function Footer({
  copyrightText = "Todos os direitos reservados.",
  links = [],
  showSeparators = true,
  leftContent,
  rightContent,
  className,
}: FooterProps) {
  const currentYear = new Date().getFullYear()

  return (
    <footer
      className={cn(
        "border-t border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 px-4 py-4 md:px-6",
        className
      )}
    >
      <div className="flex flex-col items-center justify-between gap-3 text-xs text-slate-400 md:flex-row">
        <div className="flex items-center gap-3">
          {leftContent || (
            <p className="text-center md:text-left">
              © {currentYear} {copyrightText}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {rightContent || (
            <>
              {links.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-4">
                  {links.map((link, index) => (
                    <div key={link.href} className="flex items-center gap-4">
                      <Link
                        href={link.href}
                        className="transition-colors hover:text-slate-200"
                      >
                        {link.label}
                      </Link>
                      {showSeparators && index < links.length - 1 && (
                        <span className="text-slate-700">•</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </footer>
  )
}

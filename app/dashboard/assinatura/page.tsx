import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function AssinaturaPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Assinatura</h1>
        <p className="text-muted-foreground">Gerencie seu plano e informações de pagamento</p>
      </div>

      <Card className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold mb-2">Plano Atual</h3>
            <div className="flex items-center gap-3">
              <Badge className="bg-muted text-foreground text-base px-3 py-1">Free</Badge>
              <span className="text-sm text-muted-foreground">Acesso limitado</span>
            </div>
          </div>
          <Link href="/pricing">
            <Button className="bg-primary hover:bg-primary-hover text-primary-foreground">Fazer Upgrade</Button>
          </Link>
        </div>

        <div className="border-t border-border pt-6">
          <h4 className="font-semibold mb-4">Recursos do Plano Free</h4>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Chat de IA limitado (10 mensagens/dia)
            </li>
            <li className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Acesso a 3 cursos gratuitos
            </li>
            <li className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Sem certificados
            </li>
          </ul>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Histórico de Pagamentos</h3>
        <div className="text-center py-8 text-muted-foreground">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p>Nenhum pagamento registrado</p>
          <p className="text-sm mt-1">Faça upgrade para começar</p>
        </div>
      </Card>

      <Card className="p-6 bg-primary/5 border-primary/20">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold mb-2">Desbloqueie Todo o Potencial</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Faça upgrade para o plano premium e tenha acesso ilimitado ao chat de IA, todos os cursos, certificados e
              muito mais.
            </p>
            <Link href="/pricing">
              <Button
                variant="outline"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground bg-transparent"
              >
                Ver Planos
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}

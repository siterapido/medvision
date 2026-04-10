import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Documentação Técnica | MedVision',
  description: 'Hub de documentação interna do projeto Odonto GPT',
}

export default function DocumentacaoLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // Cria scroll container próprio dentro do h-screen overflow-hidden do SiteFrame
    <div className="h-full overflow-y-auto bg-background text-foreground">
      {children}
    </div>
  )
}

export default function PerfilPage() {
  return (
    <div className="h-full flex flex-col p-8">
      <div className="max-w-2xl mx-auto w-full">
        <h1 className="text-3xl font-bold mb-2">Perfil</h1>
        <p className="text-muted-foreground mb-8">Gerencie suas informações pessoais e preferências</p>

        <div className="space-y-6">
          <div className="border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Informações Pessoais</h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Nome</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="Seu nome"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <input
                  type="email"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="seu@email.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">CRO</label>
                <input
                  type="text"
                  className="w-full mt-1 px-3 py-2 border border-border rounded-lg bg-background"
                  placeholder="Número do CRO"
                />
              </div>
            </div>
          </div>

          <div className="border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Assinatura</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Plano Free</p>
                <p className="text-sm text-muted-foreground">Acesso limitado aos recursos</p>
              </div>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Fazer upgrade
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

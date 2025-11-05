import { ProfileForm } from "@/components/profile/profile-form"
import { Card } from "@/components/ui/card"

export default function PerfilPage() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Perfil</h1>
        <p className="text-muted-foreground">Gerencie suas informações pessoais e preferências</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-6 mb-8 pb-6 border-b border-border">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-3xl font-bold">
              DS
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center hover:bg-secondary/90 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-1">Dr. João Silva</h3>
            <p className="text-sm text-muted-foreground mb-2">joao.silva@email.com</p>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-muted px-2 py-1 rounded">Plano Free</span>
              <span className="text-xs text-muted-foreground">Membro desde Jan 2025</span>
            </div>
          </div>
        </div>

        <ProfileForm />
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Preferências</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium">Notificações por Email</p>
              <p className="text-sm text-muted-foreground">Receba atualizações sobre novos cursos</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary">
              <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition" />
            </button>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium">Modo Escuro</p>
              <p className="text-sm text-muted-foreground">Ativar tema escuro</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted">
              <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">Notificações Push</p>
              <p className="text-sm text-muted-foreground">Receba alertas no navegador</p>
            </div>
            <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted">
              <span className="translate-x-1 inline-block h-4 w-4 transform rounded-full bg-white transition" />
            </button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4 text-destructive">Zona de Perigo</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <p className="font-medium">Excluir Conta</p>
              <p className="text-sm text-muted-foreground">Remover permanentemente sua conta e todos os dados</p>
            </div>
            <button className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm font-medium">
              Excluir
            </button>
          </div>
        </div>
      </Card>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { User, Bell, Shield, Palette, Loader2, Check, X } from 'lucide-react'
import { normalizePhone, isValidWhatsAppNumber, formatPhoneDisplay } from '@/lib/utils/phone'

interface Profile {
  id: string
  name: string | null
  email: string | null
  whatsapp: string | null
  whatsapp_optin: boolean | null
  avatar_url: string | null
}

export default function ConfiguracoesPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [whatsappOptin, setWhatsappOptin] = useState(false)
  const [whatsappValid, setWhatsappValid] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)

  useEffect(() => {
    async function loadProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, whatsapp, whatsapp_optin, avatar_url')
        .eq('id', user.id)
        .single()

      if (error) {
        toast.error('Erro ao carregar perfil')
        return
      }

      setProfile(data)
      setName(data?.name || '')
      setWhatsapp(data?.whatsapp || '')
      setWhatsappOptin(data?.whatsapp_optin || false)

      // Validate the WhatsApp number if present
      if (data?.whatsapp) {
        setWhatsappValid(isValidWhatsAppNumber(data.whatsapp))
      }

      setLoading(false)
    }

    loadProfile()
  }, [supabase, router])

  const handleSaveProfile = async () => {
    if (!profile) return

    // Validate WhatsApp if provided
    if (whatsapp && !isValidWhatsAppNumber(whatsapp)) {
      toast.error('Numero de WhatsApp invalido')
      return
    }

    setSaving(true)
    const normalizedWhatsapp = whatsapp ? normalizePhone(whatsapp) : null

    const updateData: any = {
      name,
    }

    if (whatsapp) {
      updateData.whatsapp = normalizedWhatsapp
      if (whatsappOptin) {
        updateData.whatsapp_optin = true
        updateData.whatsapp_optin_at = new Date().toISOString()
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id)

    if (error) {
      toast.error('Erro ao salvar alteracoes')
    } else {
      toast.success('Perfil atualizado com sucesso')
      // Update local state
      if (normalizedWhatsapp) {
        setWhatsapp(normalizedWhatsapp)
        setWhatsappValid(isValidWhatsAppNumber(normalizedWhatsapp))
      }
    }
    setSaving(false)
  }

  const handleWhatsappChange = (value: string) => {
    setWhatsapp(value)
    // Validate in real-time
    if (value) {
      setWhatsappValid(isValidWhatsAppNumber(value))
    } else {
      setWhatsappValid(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-4xl py-8 px-4">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Configuracoes</h1>
        <p className="text-muted-foreground">Gerencie suas preferencias e informacoes pessoais</p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="perfil" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificacoes</span>
          </TabsTrigger>
          <TabsTrigger value="seguranca" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Seguranca</span>
          </TabsTrigger>
          <TabsTrigger value="aparencia" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Aparencia</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil">
          <Card>
            <CardHeader>
              <CardTitle>Informacoes do Perfil</CardTitle>
              <CardDescription>Atualize suas informacoes pessoais</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={profile?.email || ''}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">O email nao pode ser alterado</p>
              </div>
              <div className="space-y-3">
                <Label htmlFor="whatsapp">WhatsApp</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="whatsapp"
                      value={whatsapp}
                      onChange={(e) => handleWhatsappChange(e.target.value)}
                      placeholder="(11) 99999-9999"
                      className={whatsapp && (whatsappValid ? 'border-green-500' : 'border-red-500')}
                    />
                  </div>
                  {whatsapp && (
                    <div className="flex items-center pt-2">
                      {whatsappValid ? (
                        <Check className="h-5 w-5 text-green-500" />
                      ) : (
                        <X className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Seu numero de WhatsApp para receber notificacoes e mensagens do Odonto GPT
                </p>

                {whatsapp && whatsappValid && (
                  <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950 p-3">
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium text-green-900 dark:text-green-100">
                        Ativar notificacoes por WhatsApp
                      </Label>
                      <p className="text-xs text-green-700 dark:text-green-300">
                        Receba atualizacoes, lembretes e ofertas especiais no WhatsApp
                      </p>
                    </div>
                    <Switch
                      checked={whatsappOptin}
                      onCheckedChange={setWhatsappOptin}
                    />
                  </div>
                )}
              </div>
              <Button onClick={handleSaveProfile} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alteracoes
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notificacoes">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificacao</CardTitle>
              <CardDescription>Configure como voce deseja receber notificacoes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificacoes por Email</Label>
                  <p className="text-sm text-muted-foreground">Receba atualizacoes importantes por email</p>
                </div>
                <Switch
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Notificacoes Push</Label>
                  <p className="text-sm text-muted-foreground">Receba alertas no navegador</p>
                </div>
                <Switch
                  checked={pushNotifications}
                  onCheckedChange={setPushNotifications}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seguranca">
          <Card>
            <CardHeader>
              <CardTitle>Seguranca da Conta</CardTitle>
              <CardDescription>Gerencie a seguranca da sua conta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Alterar Senha</Label>
                <p className="text-sm text-muted-foreground">Enviaremos um link para redefinir sua senha</p>
                <Button variant="outline" onClick={() => toast.info('Funcionalidade em desenvolvimento')}>
                  Solicitar Alteracao
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="aparencia">
          <Card>
            <CardHeader>
              <CardTitle>Aparencia</CardTitle>
              <CardDescription>Personalize a aparencia do aplicativo</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Use o botao de tema na barra lateral para alternar entre modo claro e escuro.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

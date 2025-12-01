"use client"

import { useState } from "react"
import { Check, Loader2, Send, Search, User, Mail, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"

interface Profile {
  id: string
  name: string | null
  email: string | null
  whatsapp: string | null
}

interface ManualSenderProps {
  initialUsers: Profile[]
}

export function ManualSender({ initialUsers }: ManualSenderProps) {
  const [open, setOpen] = useState(false)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const selectedUser = initialUsers.find((user) => user.id === selectedUserId)
  const recipientContact = channel === "whatsapp" ? selectedUser?.whatsapp : selectedUser?.email
  const messageLength = message.trim().length

  function handleReset() {
    setSelectedUserId("")
    setMessage("")
    setSubject("")
  }

  async function handleSend() {
    if (!selectedUserId || !message) return
    if (channel === "email" && !subject) {
      toast.error("Assunto é obrigatório para email.")
      return
    }

    if (channel === "whatsapp" && !selectedUser?.whatsapp) {
      toast.error("Usuário selecionado não possui WhatsApp cadastrado.")
      return
    }

    if (channel === "email" && !selectedUser?.email) {
      toast.error("Usuário selecionado não possui Email cadastrado.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUserId,
          message,
          channel,
          subject: channel === "email" ? subject : undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erro ao enviar")
      }

      if (data.success) {
        toast.success(`Notificação via ${channel} enviada com sucesso!`)
        setMessage("")
        setSubject("")
      } else {
        toast.error(`Falha no envio: ${data.error}`)
      }
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Envio Manual</CardTitle>
        <CardDescription className="text-slate-400">
          Envie uma mensagem direta para um usuário.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Usuário</label>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                {selectedUserId ? (
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4 text-emerald-500" />
                    <span>
                      {selectedUser?.name || selectedUser?.email}
                      {selectedUser?.whatsapp && <span className="ml-2 text-xs text-slate-400">({selectedUser.whatsapp})</span>}
                    </span>
                  </div>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4 text-slate-400" />
                    Selecione um usuário...
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700 p-0 sm:max-w-[425px]">
              <DialogHeader className="p-4 pb-0">
                <DialogTitle className="text-slate-100">Selecionar Usuário</DialogTitle>
              </DialogHeader>
              <Command className="bg-slate-900 text-slate-200 border-t border-slate-800 mt-2">
                <CommandInput placeholder="Buscar por nome ou email..." className="text-slate-200 placeholder:text-slate-500" />
                <CommandList>
                  <CommandEmpty>Nenhum usuário encontrado.</CommandEmpty>
                  <CommandGroup>
                    {initialUsers.map((user) => (
                      <CommandItem
                        key={user.id}
                        value={`${user.name || ""} ${user.email || ""}`}
                        onSelect={() => {
                          setSelectedUserId(user.id)
                          setOpen(false)
                        }}
                        className="text-slate-200 aria-selected:bg-slate-800 aria-selected:text-white cursor-pointer"
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedUserId === user.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{user.name || "Sem nome"}</span>
                          <span className="text-xs text-slate-400">{user.email}</span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </DialogContent>
          </Dialog>
        </div>

        {/* Channel Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Canal</label>
          <Select value={channel} onValueChange={(val: "whatsapp" | "email") => setChannel(val)}>
            <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="whatsapp" className="text-slate-200">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> WhatsApp
                </div>
              </SelectItem>
              <SelectItem value="email" className="text-slate-200">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" /> Email
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subject (Email Only) */}
        {channel === "email" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
            <label className="text-sm font-medium text-slate-300">Assunto</label>
            <Input
              placeholder="Assunto do Email"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
            />
          </div>
        )}

        {/* Message Body */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">
            {channel === "email" ? "Corpo do Email (HTML aceito)" : "Mensagem de Texto"}
          </label>
          <Textarea
            placeholder={channel === "email" ? "<p>Olá...</p>" : "Digite sua mensagem aqui..."}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:ring-emerald-500 font-mono text-sm"
          />
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs uppercase tracking-wide text-slate-500">Pré-visualização</div>
            <div className="text-xs text-slate-400">{messageLength} caracteres</div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-200">{selectedUser?.name || "Selecione um usuário"}</p>
              <p className="text-xs text-slate-500">{recipientContact || (channel === "whatsapp" ? "WhatsApp pendente" : "Email pendente")}</p>
              <p className="text-xs text-slate-400">Canal: {channel === "whatsapp" ? "WhatsApp" : "Email"}</p>
            </div>
            <div className="rounded-md border border-slate-800 bg-slate-900/70 p-3 text-sm text-slate-200 min-h-[96px] whitespace-pre-wrap">
              {message || "Digite a mensagem para visualizar como o usuário receberá."}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Button 
            onClick={handleSend} 
            disabled={loading || !selectedUserId || !message}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white sm:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Notificação
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            type="button"
            onClick={handleReset}
            disabled={loading}
            className="text-slate-300 hover:text-white"
          >
            Limpar seleção
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

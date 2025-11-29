"use client"

import { useState } from "react"
import { Edit2, Save, Loader2, Mail, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { NotificationTemplate } from "./types"

interface TemplatesManagerProps {
  initialTemplates: NotificationTemplate[]
}

export function TemplatesManager({ initialTemplates }: TemplatesManagerProps) {
  const router = useRouter()
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null)
  const [content, setContent] = useState("")
  const [subject, setSubject] = useState("")
  const [channel, setChannel] = useState<"whatsapp" | "email">("whatsapp")
  const [active, setActive] = useState(true)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  function handleEdit(template: NotificationTemplate) {
    setEditingTemplate(template)
    setContent(template.content)
    setSubject(template.subject || "")
    setChannel(template.channel)
    setActive(template.active)
    setOpen(true)
  }

  async function handleSave() {
    if (!editingTemplate) return

    setLoading(true)
    try {
      const res = await fetch("/api/admin/notifications/templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingTemplate.id,
          content,
          subject: channel === "email" ? subject : null,
          channel,
          active,
        }),
      })

      if (!res.ok) throw new Error("Falha ao salvar template")

      toast.success("Template atualizado com sucesso")
      setOpen(false)
      router.refresh()
    } catch (error) {
      toast.error("Erro ao salvar alterações")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Templates de Mensagem</CardTitle>
        <CardDescription className="text-slate-400">
          Gerencie as mensagens automáticas do sistema.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-slate-700">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800/50">
                <TableHead className="text-slate-400">Nome (Chave)</TableHead>
                <TableHead className="text-slate-400">Canal</TableHead>
                <TableHead className="text-slate-400">Descrição</TableHead>
                <TableHead className="text-slate-400">Conteúdo / Assunto</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-right text-slate-400">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialTemplates.map((template) => (
                <TableRow key={template.id} className="border-slate-700 hover:bg-slate-800/50">
                  <TableCell className="font-medium text-slate-300 font-mono text-xs">
                    {template.name}
                  </TableCell>
                  <TableCell>
                    {template.channel === "whatsapp" ? (
                      <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/10">
                        <MessageSquare className="mr-1 h-3 w-3" /> WhatsApp
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-blue-500/30 text-blue-500 bg-blue-500/10">
                        <Mail className="mr-1 h-3 w-3" /> Email
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {template.description}
                  </TableCell>
                  <TableCell className="text-slate-300 max-w-[300px] text-sm">
                    <div className="truncate">
                      {template.channel === "email" && template.subject ? (
                        <span className="font-semibold text-slate-200 block mb-1">Subject: {template.subject}</span>
                      ) : null}
                      <span className="text-slate-400">{template.content}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={template.active ? "default" : "secondary"} className={template.active ? "bg-emerald-500/20 text-emerald-500" : "bg-slate-700 text-slate-400"}>
                      {template.active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(template)}
                      className="hover:bg-slate-700 text-slate-400 hover:text-white"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="bg-slate-900 border-slate-700 text-slate-100 sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Template: {editingTemplate?.name}</DialogTitle>
              <DialogDescription className="text-slate-400">
                Edite o conteúdo da mensagem enviada automaticamente.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="channel" className="text-slate-300">Canal</Label>
                <Select value={channel} onValueChange={(val: "whatsapp" | "email") => setChannel(val)}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {channel === "email" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
                  <Label htmlFor="subject" className="text-slate-300">Assunto</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-slate-200"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="content" className="text-slate-300">Conteúdo da Mensagem</Label>
                <Textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-200 min-h-[150px] font-mono text-sm"
                />
                <p className="text-xs text-slate-500">
                  Variáveis disponíveis: <code className="bg-slate-800 px-1 rounded">{'{{name}}'}</code>
                </p>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="active"
                  checked={active}
                  onCheckedChange={setActive}
                />
                <Label htmlFor="active" className="text-slate-300">Template Ativo</Label>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

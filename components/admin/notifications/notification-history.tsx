"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CheckCircle, XCircle, Clock } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { NotificationLog } from "./types"

interface NotificationHistoryProps {
  logs: NotificationLog[]
}

export function NotificationHistory({ logs }: NotificationHistoryProps) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <CardTitle className="text-white">Histórico de Envios</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-slate-700">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-800/50">
                <TableHead className="text-slate-400">Data</TableHead>
                <TableHead className="text-slate-400">Usuário</TableHead>
                <TableHead className="text-slate-400">Canal</TableHead>
                <TableHead className="text-slate-400">Template / Conteúdo</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow className="border-slate-700">
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    Nenhuma notificação enviada.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="border-slate-700 hover:bg-slate-800/50">
                    <TableCell className="font-medium text-slate-300">
                      {format(new Date(log.sent_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-slate-300">
                      <div className="flex flex-col">
                        <span>{log.profiles?.name || "Usuário"}</span>
                        <span className="text-xs text-slate-500">{log.profiles?.whatsapp}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300 capitalize">{log.channel}</TableCell>
                    <TableCell className="max-w-[300px] truncate text-slate-300" title={log.content}>
                      {log.notification_templates?.name ? (
                        <Badge variant="outline" className="mr-2 border-slate-600 text-slate-400">
                          {log.notification_templates.name}
                        </Badge>
                      ) : null}
                      <span className="text-sm text-slate-400">{log.content}</span>
                    </TableCell>
                    <TableCell>
                      {log.status === "sent" && (
                        <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20">
                          <CheckCircle className="mr-1 h-3 w-3" /> Enviado
                        </Badge>
                      )}
                      {log.status === "failed" && (
                        <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
                          <XCircle className="mr-1 h-3 w-3" /> Falhou
                        </Badge>
                      )}
                      {log.status === "pending" && (
                        <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20">
                          <Clock className="mr-1 h-3 w-3" /> Pendente
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}


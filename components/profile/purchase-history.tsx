"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ShoppingBag, CreditCard, ExternalLink, Package } from "lucide-react"
import Link from "next/link"

interface Purchase {
  id: string
  transaction_id: string
  amount: number
  status: string
  created_at: string
  course: {
    id: string
    title: string
    image_url: string | null
  } | null
}

interface PurchaseHistoryProps {
  purchases: Purchase[]
}

export function PurchaseHistory({ purchases }: PurchaseHistoryProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
      case "approved":
      case "paid":
        return (
          <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20">
            Concluído
          </Badge>
        )
      case "pending":
      case "waiting":
        return (
          <Badge className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20">
            Pendente
          </Badge>
        )
      case "failed":
      case "refused":
        return (
          <Badge className="border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20">
            Falhou
          </Badge>
        )
      case "refunded":
        return (
          <Badge className="border-purple-500/30 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20">
            Reembolsado
          </Badge>
        )
      default:
        return (
          <Badge className="border-slate-500/30 bg-slate-500/10 text-slate-400 hover:bg-slate-500/20">
            {status}
          </Badge>
        )
    }
  }

  return (
    <Card className="relative overflow-hidden border-[#24324F]/60 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl shadow-[#0B1627]/40">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(75%_60%_at_20%_0%,rgba(8,145,178,0.22),transparent),radial-gradient(55%_45%_at_85%_25%,rgba(6,182,212,0.18),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent)] mix-blend-screen" />
      </div>
      
      <CardHeader className="relative border-b border-white/10 pb-6">
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-white/20 bg-white/10 text-[0.65rem] uppercase tracking-[0.25em] text-white">
              Financeiro
            </Badge>
            <span className="text-xs text-white/60">Histórico de transações</span>
          </div>
          <CardTitle className="flex items-center gap-2 text-2xl font-semibold text-white">
            <ShoppingBag className="h-6 w-6 text-cyan-400" />
            Minhas Compras
          </CardTitle>
          <CardDescription className="max-w-2xl text-white/70">
            Acompanhe aqui o histórico de cursos adquiridos e status de pagamentos.
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="relative pt-6">
        {purchases.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 py-12 text-center">
            <div className="mb-4 rounded-full bg-white/5 p-4">
              <Package className="h-8 w-8 text-white/40" />
            </div>
            <h3 className="text-lg font-medium text-white">Nenhuma compra encontrada</h3>
            <p className="mt-1 max-w-sm text-sm text-white/60">
              Você ainda não adquiriu nenhum curso avulso. Explore nosso catálogo para começar.
            </p>
            <Link
              href="/dashboard/cursos"
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-400 transition-colors hover:bg-cyan-500/20"
            >
              Explorar Cursos
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-white/5">
                  <TableHead className="w-[100px] text-white/70">Data</TableHead>
                  <TableHead className="text-white/70">Curso</TableHead>
                  <TableHead className="text-white/70">ID Transação</TableHead>
                  <TableHead className="text-right text-white/70">Valor</TableHead>
                  <TableHead className="text-right text-white/70">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((purchase) => (
                  <TableRow key={purchase.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="font-medium text-white/90">
                      {format(new Date(purchase.created_at), "dd/MM/yyyy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-white/90">
                      <div className="flex items-center gap-3">
                        {purchase.course?.title || "Curso Removido"}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-white/60">
                      {purchase.transaction_id}
                    </TableCell>
                    <TableCell className="text-right text-white/90">
                      {purchase.amount ? formatCurrency(Number(purchase.amount)) : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {getStatusBadge(purchase.status)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}











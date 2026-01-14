import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, BookOpen, Clock, FileText, MoreVertical } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"

export default async function ResumosPage() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/login")
  }

  // Fetch summaries
  const { data: summaries } = await supabase
    .from("summaries")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meus Resumos</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie seus materiais de estudo gerados por IA.
          </p>
        </div>
        <Link href="/dashboard/resumos/novo">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Resumo
          </Button>
        </Link>
      </div>

      {summaries && summaries.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {summaries.map((summary) => (
            <Card key={summary.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-xl line-clamp-1">{summary.title}</CardTitle>
                    <CardDescription className="line-clamp-1">
                      {new Date(summary.created_at).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="-mr-2">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>Abrir</DropdownMenuItem>
                      <DropdownMenuItem>Exportar PDF</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-600">Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Badge variant="secondary" className="text-xs">
                    {summary.complexity_level === 'advanced' ? 'Avançado' :
                      summary.complexity_level === 'basic' ? 'Básico' : 'Intermédio'}
                  </Badge>
                  <Badge variant={summary.status === 'ready' ? 'default' : 'outline'} className="text-xs">
                    {summary.status === 'ready' ? 'Pronto' :
                      summary.status === 'generating' ? 'Gerando...' : 'Falha'}
                  </Badge>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Link href={`/dashboard/resumos/${summary.id}`} className="w-full">
                  <Button variant="outline" className="w-full">
                    <BookOpen className="mr-2 h-4 w-4" />
                    Visualizar
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/50">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum resumo encontrado</h3>
          <p className="text-muted-foreground text-center max-w-sm mb-6">
            Você ainda não criou nenhum resumo. Comece agora escolhendo um tópico de estudo.
          </p>
          <Link href="/dashboard/resumos/novo">
            <Button>Criar meu primeiro resumo</Button>
          </Link>
        </div>
      )}
    </div>
  )
}

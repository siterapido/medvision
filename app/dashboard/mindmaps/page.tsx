
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, Network, Calendar, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function MindMapsPage() {
    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/login")
    }

    // Fetch mind maps
    const { data: maps } = await supabase
        .from("mind_map_artifacts")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    return (
        <div className="container mx-auto p-6 md:p-8 space-y-8 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                        Mapas Mentais
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-lg">
                        Visualizações hierárquicas para organizar conceitos complexos da odontologia.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/chat?agent=gerador_resumos_odontologicos">
                        <Button className="rounded-full shadow-lg shadow-pink-500/20 hover:shadow-pink-500/30 transition-all duration-300 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Mapa
                        </Button>
                    </Link>
                </div>
            </div>

            {maps && maps.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {maps.map((map) => (
                        <Link key={map.id} href={`/dashboard/mindmaps/${map.id}`} className="block group">
                            <Card className="h-full border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:border-pink-500/50 hover:shadow-md transition-all duration-300">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <Badge variant="outline" className="bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800">
                                            Mapa Mental
                                        </Badge>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(map.created_at), { addSuffix: true, locale: ptBR })}
                                        </span>
                                    </div>
                                    <CardTitle className="line-clamp-2 text-lg group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors">
                                        {map.title}
                                    </CardTitle>
                                    <CardDescription>{map.topic}</CardDescription>
                                </CardHeader>
                                <CardContent className="pb-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Network className="w-4 h-4" />
                                        <span>Conexões Visuais</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-xs text-pink-500 font-medium">
                                        <span>Explorar mapa</span>
                                        <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                </CardFooter>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="relative flex flex-col items-center justify-center min-h-[450px] rounded-3xl overflow-hidden group border border-dashed border-slate-300 dark:border-slate-700">
                    <div className="relative z-10 flex flex-col items-center max-w-lg px-6 text-center">
                        <div className="relative mb-6">
                            <div className="w-16 h-16 rounded-2xl bg-pink-100 dark:bg-pink-900/20 flex items-center justify-center">
                                <Network className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                            </div>
                        </div>

                        <h3 className="text-xl font-bold mb-2">
                            Nenhum mapa mental
                        </h3>

                        <p className="text-muted-foreground mb-6">
                            Visualize conceitos e tratamentos através de mapas mentais dinâmicos. Peça ao Odonto Flow para gerar um.
                        </p>

                        <Link href="/dashboard/chat?agent=gerador_resumos_odontologicos">
                            <Button className="bg-pink-600 hover:bg-pink-700">
                                <Plus className="mr-2 h-4 w-4" />
                                Gerar Mapa Mental
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}

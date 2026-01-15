
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Plus, LayoutGrid, Calendar, Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function FlashcardsPage() {
    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/login")
    }

    // Fetch flashcard decks
    const { data: decks } = await supabase
        .from("flashcard_decks")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

    return (
        <div className="container mx-auto p-6 md:p-8 space-y-8 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                        Meus Flashcards
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-lg">
                        Baralhos de memorização ativa gerados para potencializar seu aprendizado.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/dashboard/chat?agent=gerador_resumos_odontologicos">
                        <Button className="rounded-full shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30 transition-all duration-300 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Novo Baralho
                        </Button>
                    </Link>
                </div>
            </div>

            {decks && decks.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {decks.map((deck) => (
                        <Link key={deck.id} href={`/dashboard/flashcards/${deck.id}`} className="block group">
                            <Card className="h-full border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:border-orange-500/50 hover:shadow-md transition-all duration-300">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <Badge variant="outline" className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                                            Flashcards
                                        </Badge>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(deck.created_at), { addSuffix: true, locale: ptBR })}
                                        </span>
                                    </div>
                                    <CardTitle className="line-clamp-2 text-lg group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                        {deck.title}
                                    </CardTitle>
                                    <CardDescription>{deck.topic}</CardDescription>
                                </CardHeader>
                                <CardContent className="pb-3">
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <LayoutGrid className="w-4 h-4" />
                                        <span>{Array.isArray(deck.cards) ? deck.cards.length : 0} cartas</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between">
                                    <div className="flex items-center gap-1 text-xs text-orange-500 font-medium">
                                        <Play className="w-3 h-3" />
                                        <span>Estudar agora</span>
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
                            <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                                <LayoutGrid className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>

                        <h3 className="text-xl font-bold mb-2">
                            Nenhum baralho encontrado
                        </h3>

                        <p className="text-muted-foreground mb-6">
                            Peça ao Odonto Flow para criar flashcards de qualquer tema para você praticar.
                        </p>

                        <Link href="/dashboard/chat?agent=gerador_resumos_odontologicos">
                            <Button className="bg-orange-600 hover:bg-orange-700">
                                <Plus className="mr-2 h-4 w-4" />
                                Criar Flashcards
                            </Button>
                        </Link>
                    </div>
                </div>
            )}
        </div>
    )
}

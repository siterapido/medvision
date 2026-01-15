
import { createClient } from "@/lib/supabase/server"
import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Share2, MoreHorizontal, GraduationCap } from "lucide-react"

import { Button } from "@/components/ui/button"
import { FlashcardViewer } from "@/components/artifacts/flashcard-viewer"

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function FlashcardDetailPage({ params }: PageProps) {
    const { id } = await params
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect("/login")
    }

    const { data: deck, error } = await supabase
        .from("flashcard_decks")
        .select("*")
        .eq("id", id)
        .single()

    if (error || !deck) {
        notFound()
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
            {/* Top Navigation */}
            <div className="border-b bg-white/50 dark:bg-slate-900/50 backdrop-blur-md sticky top-0 z-30">
                <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                        <Link href="/dashboard/flashcards">
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <ArrowLeft className="w-5 h-5" />
                            </Button>
                        </Link>
                        <div className="flex flex-col min-w-0">
                            <h1 className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">
                                {deck.title}
                            </h1>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                                <GraduationCap className="w-3 h-3 text-orange-500" />
                                <span>{deck.topic || "Geral"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" className="rounded-full hidden sm:flex">
                            <Share2 className="w-5 h-5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreHorizontal className="w-5 h-5" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 container mx-auto px-6 py-12">
                <FlashcardViewer deck={deck as any} />

                {/* Additional Study Info */}
                <div className="mt-20 max-w-2xl mx-auto border-t pt-8 border-slate-200 dark:border-slate-800">
                    <h4 className="text-sm font-semibold mb-4 text-slate-900 dark:text-slate-100">Dicas de Memorização Ativa</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-100 dark:border-orange-500/20">
                            <p className="text-xs text-orange-700 dark:text-orange-400">
                                <strong>Espaçamento:</strong> Revise este baralho amanhã, daqui a 3 dias e depois de uma semana.
                            </p>
                        </div>
                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20">
                            <p className="text-xs text-blue-700 dark:text-blue-400">
                                <strong>Contexto:</strong> Tente explicar a resposta em voz alta com suas próprias palavras antes de revelar.
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}

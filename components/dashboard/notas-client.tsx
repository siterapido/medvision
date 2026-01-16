"use client"

import { useRouter } from "next/navigation"
import { Bookmark, Calendar, MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArtifactPageLayout } from "@/components/dashboard/artifact-page-layout"
import { deleteArtifact } from "@/app/actions/artifacts"
import { DeleteButton } from "@/components/ui/delete-button"

interface Note {
    id: string
    content: string
    created_at: string
}

interface NotasClientProps {
    userId: string
    notes: Note[] | null
}

export function NotasClient({ userId, notes }: NotasClientProps) {
    const router = useRouter()

    return (
        <ArtifactPageLayout
            agentId="odonto-gpt" // Generalist agent for generic notes
            userId={userId}
        >
            <div className="container mx-auto p-6 md:p-8 space-y-8 min-h-screen">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                            Minhas Notas
                        </h1>
                        <p className="text-muted-foreground mt-2 max-w-lg">
                            Fragmentos de conversas e anotações importantes salvas do chat.
                        </p>
                    </div>
                </div>

                {notes && notes.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {notes.map((note) => (
                            <Card key={note.id} className="h-full flex flex-col border-slate-200/60 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/10 transition-all duration-500 hover:-translate-y-1">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start gap-2">
                                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                                            Nota Rápida
                                        </Badge>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                                            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale: ptBR })}
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="pb-3 flex-grow overflow-hidden">
                                    <div className="text-sm text-slate-700 dark:text-slate-300 line-clamp-[10] leading-relaxed whitespace-pre-wrap font-medium">
                                        {note.content}
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-4 border-t border-slate-100 dark:border-slate-800/50 text-xs text-muted-foreground flex items-center gap-2 justify-between bg-slate-50/50 dark:bg-black/20">
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="w-3 h-3" />
                                        <span>Chat salvo</span>
                                    </div>
                                    <div className="flex z-20">
                                        <DeleteButton
                                            itemName="esta nota"
                                            onDelete={async () => {
                                                await deleteArtifact(note.id, 'notes')
                                            }}
                                        />
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="relative flex flex-col items-center justify-center min-h-[350px] rounded-3xl overflow-hidden group border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/20">
                        <div className="relative z-10 flex flex-col items-center max-w-lg px-6 text-center">
                            <div className="relative mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center animate-pulse">
                                    <Bookmark className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">
                                Nenhuma nota salva
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Você pode salvar qualquer resposta do chat clicando no ícone de "Salvar" na mensagem.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </ArtifactPageLayout>
    )
}

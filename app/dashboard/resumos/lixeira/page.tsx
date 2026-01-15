"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, RotateCw, AlertTriangle, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"

export default function TrashPage() {
    const [summaries, setSummaries] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)

    const supabase = createClient()
    const router = useRouter()

    const fetchDeletedSummaries = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from("summaries")
                .select("*")
                .eq("user_id", user.id)
                .not("deleted_at", "is", null)
                .order("deleted_at", { ascending: false })

            if (error) throw error
            setSummaries(data || [])
        } catch (error) {
            console.error("Error fetching trash:", error)
        } finally {
            setLoading(false)
        }
    }, [supabase])

    useEffect(() => {
        fetchDeletedSummaries()
    }, [fetchDeletedSummaries])

    const handleRestore = async (id: string) => {
        setActionLoading(id)
        try {
            await supabase
                .from("summaries")
                .update({ deleted_at: null })
                .eq("id", id)

            await fetchDeletedSummaries()
            router.refresh() // Refresh server components if any
        } catch (error) {
            console.error("Error restoring summary:", error)
        } finally {
            setActionLoading(null)
        }
    }

    const handlePermanentDelete = async (id: string) => {
        setActionLoading(id)
        try {
            await supabase
                .from("summaries")
                .delete()
                .eq("id", id)

            await fetchDeletedSummaries()
        } catch (error) {
            console.error("Error deleting summary:", error)
        } finally {
            setActionLoading(null)
        }
    }

    const handleEmptyTrash = async () => {
        setActionLoading("empty-trash")
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Supabase doesn't support DELETE WHERE ... without a Policy enabling it, 
            // usually we loop or use a broader delete if policy allows.
            // Easiest is to delete individually or if backend supports bulk.
            // Assuming RLS allows "Users can delete their own summaries"

            const { error } = await supabase
                .from("summaries")
                .delete()
                .eq("user_id", user.id)
                .not("deleted_at", "is", null)

            if (error) throw error

            setSummaries([])
        } catch (error) {
            console.error("Error emptying trash:", error)
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) {
        return (
            <div className="container mx-auto p-8 flex justify-center items-center min-h-[500px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="container mx-auto p-6 md:p-8 space-y-8 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/resumos">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-400 flex items-center gap-2">
                            <Trash2 className="h-8 w-8" /> Lixeira
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Itens na lixeira podem ser restaurados ou excluídos permanentemente.
                        </p>
                    </div>
                </div>

                {summaries.length > 0 && (
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" className="rounded-full" disabled={!!actionLoading}>
                                {actionLoading === "empty-trash" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                Esvaziar Lixeira
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta ação não pode ser desfeita. Isso excluirá permanentemente todos os {summaries.length} resumos da sua lixeira.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleEmptyTrash} className="bg-red-600 hover:bg-red-700">
                                    Sim, esvaziar lixeira
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>

            {summaries.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {summaries.map((summary) => (
                        <div
                            key={summary.id}
                            className="group relative bg-muted/30 border border-border/50 rounded-2xl p-6 transition-all duration-300 hover:bg-muted/50"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-1">
                                    <h3 className="text-lg font-semibold leading-tight line-clamp-1 opacity-70">
                                        {summary.title}
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Excluído em {new Date(summary.deleted_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-4 pt-4 border-t border-border/50">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 dark:hover:bg-emerald-950/20 dark:hover:text-emerald-400"
                                    onClick={() => handleRestore(summary.id)}
                                    disabled={!!actionLoading}
                                >
                                    {actionLoading === summary.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="mr-2 h-4 w-4" />}
                                    Restaurar
                                </Button>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="outline" size="icon" className="text-red-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-950/20" disabled={!!actionLoading}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Excluir permanentemente?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                O resumo &quot;{summary.title}&quot; será apagado para sempre.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handlePermanentDelete(summary.id)} className="bg-red-600 hover:bg-red-700">
                                                Excluir
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px] border border-dashed border-border/50 rounded-3xl bg-card/30 backdrop-blur-sm">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
                        <Trash2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">A lixeira está vazia</h3>
                    <p className="text-muted-foreground text-center max-w-sm mb-8">
                        Resumos excluídos aparecerão aqui.
                    </p>
                    <Link href="/dashboard/resumos">
                        <Button variant="outline" className="rounded-full">
                            Voltar para Resumos
                        </Button>
                    </Link>
                </div>
            )}
        </div>
    )
}

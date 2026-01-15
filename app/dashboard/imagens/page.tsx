
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Image as ImageIcon, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"

export default async function ImagensPage() {
    const supabase = await createClient()
    const {
        data: { user },
        error,
    } = await supabase.auth.getUser()

    if (error || !user) {
        redirect("/login")
    }

    return (
        <div className="container mx-auto p-6 md:p-8 space-y-8 min-h-screen">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                        Análise de Imagens
                    </h1>
                    <p className="text-muted-foreground mt-2 max-w-lg">
                        Laudos e análises radiográficas gerados pela Odonto Vision.
                    </p>
                </div>
            </div>

            <div className="relative flex flex-col items-center justify-center min-h-[450px] rounded-3xl overflow-hidden group border border-dashed border-slate-300 dark:border-slate-700">
                <div className="relative z-10 flex flex-col items-center max-w-lg px-6 text-center">
                    <div className="relative mb-6">
                        <div className="w-16 h-16 rounded-2xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                            <ImageIcon className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>

                    <h3 className="text-xl font-bold mb-2">
                        Em breve
                    </h3>

                    <p className="text-muted-foreground mb-6">
                        A galeria de análises está sendo preparada. Você já pode enviar imagens para análise no chat.
                    </p>

                    <Link href="/dashboard/chat?agent=odonto-vision">
                        <Button className="bg-orange-600 hover:bg-orange-700">
                            <Plus className="mr-2 h-4 w-4" />
                            Falar com Odonto Vision
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}

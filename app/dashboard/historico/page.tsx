import { HistoryList } from "@/components/dashboard/history/history-list"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Histórico de Conversas | Odonto GPT",
    description: "Acesse suas conversas anteriores e memórias.",
}

export default function HistoryPage() {
    return (
        <div className="container max-w-5xl mx-auto py-8 px-4 space-y-8">
            <div className="space-y-2">
                <h1 className="text-3xl font-heading font-bold text-foreground">Histórico de Conversas</h1>
                <p className="text-muted-foreground">Gerencie suas sessões e acesse o conhecimento compartilhado entre os agentes.</p>
            </div>

            <HistoryList />
        </div>
    )
}

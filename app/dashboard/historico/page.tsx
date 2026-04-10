import { HistoricoListEnhanced } from "@/components/historico"
import { Metadata } from "next"

export const metadata: Metadata = {
    title: "Historico de Conversas | MedVision",
    description: "Acesse suas conversas anteriores e memorias.",
}

export default function HistoryPage() {
    return (
        <div className="h-full bg-[var(--canvas)]">
            <HistoricoListEnhanced />
        </div>
    )
}

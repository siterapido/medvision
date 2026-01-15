"use client"

import { AgnoChat } from "@/components/agno-chat/agno-chat"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface ChatClientProps {
    userId: string
}

export function ChatClient({ userId }: ChatClientProps) {
    const router = useRouter()

    const handleArtifactCreated = (artifact: any) => {
        const typeMap: Record<string, string> = {
            'literature_review': 'pesquisas',
            'summary': 'resumos',
            'practice_exam': 'questionarios', // Corrigido para questionarios
            'exam': 'questionarios',
            'mind_map': 'mindmaps',
            'flashcards': 'flashcards',
            // Fallbacks para tipos normalizados ou antigos
            'pesquisa': 'pesquisas',
            'resumo': 'resumos',
            'questionario': 'questionarios',
            'mindmap': 'mindmaps'
        }

        const path = typeMap[artifact.type] || 'resumos'

        toast.success(`Artefato criado: ${artifact.title}`, {
            description: "Você já pode visualizá-lo na sua biblioteca.",
            action: {
                label: "Ver agora",
                onClick: () => router.push(`/dashboard/${path}/${artifact.id}`)
            },
        })
    }

    return (
        <div className="flex-1 overflow-hidden h-full">
            <AgnoChat
                userId={userId}
                onArtifactCreated={handleArtifactCreated}
            />
        </div>
    )
}

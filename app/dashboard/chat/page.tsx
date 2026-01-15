"use client"

import { AgnoChat } from "@/components/agno-chat/agno-chat"
import { useAuth } from "@/lib/hooks/useAuth"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function ChatPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  if (loading) return null
  if (!user) {
    router.push("/login")
    return null
  }

  const handleArtifactCreated = (artifact: any) => {
    const typeMap: Record<string, string> = {
      'literature_review': 'pesquisas',
      'summary': 'resumos',
      'practice_exam': 'flashcards',
      'mind_map': 'mindmaps',
      'flashcards': 'flashcards',
      'exam': 'questionarios'
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
        userId={user.id}
        onArtifactCreated={handleArtifactCreated}
      />
    </div>
  )
}

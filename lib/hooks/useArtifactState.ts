import { useCallback, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/lib/hooks/useUser"

export interface ArtifactMeta {
    id: string
    type: "research" | "exam" | "summary" | "flashcard" | "mindmap" | "image"
    title: string
    version: number
    qualityScore?: number
    preview?: string
    sourceType: "chat" | "direct" | "import"
    createdAt: string
    updatedAt: string
}

interface UseArtifactStateReturn {
    artifacts: ArtifactMeta[]
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
    getByType: (type: ArtifactMeta["type"]) => ArtifactMeta[]
}

const TABLE_CONFIG: Record<string, { table: string; type: ArtifactMeta["type"] }> = {
    research_artifacts: { table: "research_artifacts", type: "research" },
    practice_exams: { table: "practice_exams", type: "exam" },
    summaries: { table: "summaries", type: "summary" },
    flashcard_decks: { table: "flashcard_decks", type: "flashcard" },
    mind_map_artifacts: { table: "mind_map_artifacts", type: "mindmap" },
    image_artifacts: { table: "image_artifacts", type: "image" }
}

export function useArtifactState(): UseArtifactStateReturn {
    const [artifacts, setArtifacts] = useState<ArtifactMeta[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const { user } = useUser()
    const supabase = createClient()

    const loadArtifacts = useCallback(async () => {
        if (!user?.id) return

        setIsLoading(true)
        setError(null)

        try {
            const allArtifacts: ArtifactMeta[] = []

            // Carregar de cada tabela em paralelo
            const promises = Object.entries(TABLE_CONFIG).map(async ([_, config]) => {
                try {
                    const { data, error: queryError } = await supabase
                        .from(config.table)
                        .select("id, title, content, created_at, updated_at")
                        .eq("user_id", user.id)
                        .order("updated_at", { ascending: false })
                        .limit(50)

                    if (queryError) {
                        console.warn(`Error loading ${config.table}:`, queryError)
                        return []
                    }

                    return (data || []).map((item: any) => ({
                        id: item.id,
                        type: config.type,
                        title: item.title || "Sem título",
                        version: 1, // TODO: Buscar da tabela artifact_versions
                        preview: item.content?.substring(0, 150) || undefined,
                        sourceType: "chat" as const, // TODO: Buscar da tabela artifact_versions
                        createdAt: item.created_at,
                        updatedAt: item.updated_at || item.created_at
                    }))
                } catch (e) {
                    console.warn(`Failed to load ${config.table}:`, e)
                    return []
                }
            })

            const results = await Promise.all(promises)
            results.forEach((items) => allArtifacts.push(...items))

            // Ordenar por data mais recente
            allArtifacts.sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            )

            setArtifacts(allArtifacts)
        } catch (e) {
            console.error("Error loading artifacts:", e)
            setError("Erro ao carregar artefatos")
        } finally {
            setIsLoading(false)
        }
    }, [user?.id, supabase])

    // Carregar ao montar e quando user mudar
    useEffect(() => {
        if (user?.id) {
            loadArtifacts()
        }
    }, [user?.id, loadArtifacts])

    // Setup realtime subscriptions
    useEffect(() => {
        if (!user?.id) return

        const channels: ReturnType<typeof supabase.channel>[] = []

        // Subscrever a mudanças em cada tabela
        Object.keys(TABLE_CONFIG).forEach((table) => {
            const channel = supabase
                .channel(`${table}-changes`)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: table,
                        filter: `user_id=eq.${user.id}`
                    },
                    () => {
                        // Recarregar artefatos quando houver mudança
                        loadArtifacts()
                    }
                )
                .subscribe()

            channels.push(channel)
        })

        return () => {
            channels.forEach((channel) => {
                supabase.removeChannel(channel)
            })
        }
    }, [user?.id, supabase, loadArtifacts])

    const getByType = useCallback(
        (type: ArtifactMeta["type"]) => {
            return artifacts.filter((a) => a.type === type)
        },
        [artifacts]
    )

    return {
        artifacts,
        isLoading,
        error,
        refetch: loadArtifacts,
        getByType
    }
}

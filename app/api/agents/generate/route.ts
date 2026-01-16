import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const AGNO_SERVICE_URL = process.env.AGNO_SERVICE_URL || "http://localhost:8000"

interface GenerateRequest {
    type: string
    topic: string
    instructions?: string
    difficulty?: string
    num_items?: number
}

export async function POST(request: NextRequest) {
    try {
        // Autenticação
        const supabase = await createClient()
        const {
            data: { user }
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Não autenticado" },
                { status: 401 }
            )
        }

        // Validar body
        const body: GenerateRequest = await request.json()

        if (!body.type || !body.topic) {
            return NextResponse.json(
                { success: false, error: "Tipo e tema são obrigatórios" },
                { status: 400 }
            )
        }

        // Chamar o serviço Agno
        const response = await fetch(`${AGNO_SERVICE_URL}/api/artifacts/generate`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-User-ID": user.id
            },
            body: JSON.stringify({
                artifact_type: body.type,
                topic: body.topic,
                user_id: user.id,
                instructions: body.instructions,
                difficulty: body.difficulty,
                num_items: body.num_items
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("Agno service error:", errorText)
            return NextResponse.json(
                {
                    success: false,
                    error: "Erro no serviço de geração",
                    details: errorText
                },
                { status: response.status }
            )
        }

        const result = await response.json()

        return NextResponse.json({
            success: result.success ?? true,
            artifact_id: result.artifact_id,
            artifact_type: result.artifact_type || body.type,
            title: result.title,
            message: result.message || "Artefato criado com sucesso",
            error: result.error
        })
    } catch (error) {
        console.error("Error in generate API:", error)
        return NextResponse.json(
            {
                success: false,
                error: "Erro interno do servidor",
                details: error instanceof Error ? error.message : "Unknown error"
            },
            { status: 500 }
        )
    }
}

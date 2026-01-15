import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
    try {
        const supabase = await createClient()

        // Verify admin access
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
        }

        // Get all agent configs
        const { data, error } = await supabase
            .from("agent_configs")
            .select("*")
            .order("created_at", { ascending: true })

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error("[API] Error fetching agent configs:", error)
        return NextResponse.json(
            { error: "Erro ao buscar configurações" },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Verify admin access
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
        }

        const body = await request.json()
        const { agent_id, display_name, model_id, temperature, max_tokens, is_enabled, metadata } = body

        if (!agent_id || !display_name || !model_id) {
            return NextResponse.json(
                { error: "Campos obrigatórios: agent_id, display_name, model_id" },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from("agent_configs")
            .insert({
                agent_id,
                display_name,
                model_id,
                temperature: temperature ?? 0.7,
                max_tokens: max_tokens ?? 4096,
                is_enabled: is_enabled ?? true,
                metadata: metadata ?? {}
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error("[API] Error creating agent config:", error)
        return NextResponse.json(
            { error: "Erro ao criar configuração" },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Verify admin access
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
        }

        const body = await request.json()
        const { id, agent_id, display_name, model_id, temperature, max_tokens, is_enabled, metadata } = body

        if (!id && !agent_id) {
            return NextResponse.json(
                { error: "ID ou agent_id é obrigatório" },
                { status: 400 }
            )
        }

        const updateData: Record<string, unknown> = {}
        if (display_name !== undefined) updateData.display_name = display_name
        if (model_id !== undefined) updateData.model_id = model_id
        if (temperature !== undefined) updateData.temperature = temperature
        if (max_tokens !== undefined) updateData.max_tokens = max_tokens
        if (is_enabled !== undefined) updateData.is_enabled = is_enabled
        if (metadata !== undefined) updateData.metadata = metadata

        let query = supabase.from("agent_configs").update(updateData)

        if (id) {
            query = query.eq("id", id)
        } else {
            query = query.eq("agent_id", agent_id)
        }

        const { data, error } = await query.select().single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error("[API] Error updating agent config:", error)
        return NextResponse.json(
            { error: "Erro ao atualizar configuração" },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const supabase = await createClient()

        // Verify admin access
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", user.id)
            .single()

        if (profile?.role !== "admin") {
            return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
        }

        const { searchParams } = new URL(request.url)
        const id = searchParams.get("id")
        const agent_id = searchParams.get("agent_id")

        if (!id && !agent_id) {
            return NextResponse.json(
                { error: "ID ou agent_id é obrigatório" },
                { status: 400 }
            )
        }

        let query = supabase.from("agent_configs").delete()

        if (id) {
            query = query.eq("id", id)
        } else if (agent_id) {
            query = query.eq("agent_id", agent_id)
        }

        const { error } = await query

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("[API] Error deleting agent config:", error)
        return NextResponse.json(
            { error: "Erro ao excluir configuração" },
            { status: 500 }
        )
    }
}

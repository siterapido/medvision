import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Lista de modelos populares do OpenRouter
const OPENROUTER_MODELS = [
    {
        id: "openai/gpt-4o",
        name: "GPT-4 Omni",
        provider: "OpenAI",
        context_length: 128000,
        supports_vision: true,
        pricing: { prompt: 2.5, completion: 10 }
    },
    {
        id: "openai/gpt-4o-mini",
        name: "GPT-4 Omni Mini",
        provider: "OpenAI",
        context_length: 128000,
        supports_vision: true,
        pricing: { prompt: 0.15, completion: 0.6 }
    },
    {
        id: "anthropic/claude-3.5-sonnet",
        name: "Claude 3.5 Sonnet",
        provider: "Anthropic",
        context_length: 200000,
        supports_vision: true,
        pricing: { prompt: 3, completion: 15 }
    },
    {
        id: "anthropic/claude-3-haiku",
        name: "Claude 3 Haiku",
        provider: "Anthropic",
        context_length: 200000,
        supports_vision: true,
        pricing: { prompt: 0.25, completion: 1.25 }
    },
    {
        id: "google/gemini-2.0-flash-exp:free",
        name: "Gemini 2.0 Flash (Gratuito)",
        provider: "Google",
        context_length: 1000000,
        supports_vision: true,
        pricing: { prompt: 0, completion: 0 }
    },
    {
        id: "google/gemma-2-27b-it:free",
        name: "Gemma 2 27B (Gratuito)",
        provider: "Google",
        context_length: 8192,
        supports_vision: false,
        pricing: { prompt: 0, completion: 0 }
    },
    {
        id: "meta-llama/llama-3.3-70b-instruct",
        name: "Llama 3.3 70B Instruct",
        provider: "Meta",
        context_length: 128000,
        supports_vision: false,
        pricing: { prompt: 0.4, completion: 0.4 }
    },
    {
        id: "deepseek/deepseek-chat",
        name: "DeepSeek Chat",
        provider: "DeepSeek",
        context_length: 64000,
        supports_vision: false,
        pricing: { prompt: 0.14, completion: 0.28 }
    },
    {
        id: "qwen/qwen-2.5-72b-instruct",
        name: "Qwen 2.5 72B Instruct",
        provider: "Alibaba",
        context_length: 32000,
        supports_vision: false,
        pricing: { prompt: 0.35, completion: 0.4 }
    },
    {
        id: "mistralai/mistral-large-2411",
        name: "Mistral Large (Nov 2024)",
        provider: "Mistral AI",
        context_length: 128000,
        supports_vision: false,
        pricing: { prompt: 2, completion: 6 }
    }
]

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

        return NextResponse.json(OPENROUTER_MODELS)
    } catch (error) {
        console.error("[API] Error fetching OpenRouter models:", error)
        return NextResponse.json(
            { error: "Erro ao buscar modelos" },
            { status: 500 }
        )
    }
}

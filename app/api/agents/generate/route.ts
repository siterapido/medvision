import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText } from "ai"
import { openrouter } from "@/lib/ai/openrouter"
import { saveSummary, saveFlashcards, saveMindMap } from "@/lib/ai/tools/definitions"

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

        const model = openrouter('google/gemini-2.0-flash-exp:free') // Fast model for generation

        let result: any;
        
        // Construct prompt based on type
        let systemPrompt = `Você é um especialista em educação odontológica. 
        Sua tarefa é criar materiais de estudo de alta qualidade sobre o tema: "${body.topic}".
        ${body.instructions ? `Instruções adicionais: ${body.instructions}` : ""}
        ${body.difficulty ? `Nível de dificuldade: ${body.difficulty}` : ""}
        ${body.num_items ? `Quantidade de itens: ${body.num_items}` : ""}
        `;

        // We inject the user_id into the tool call by prompting or pre-filling?
        // The tool definition requires `userId`. The model doesn't know the userId.
        // We must provide it in the prompt or use a wrapper.
        // Since we can't easily partial apply the tool in `generateText` tools definition, 
        // we will tell the model the userId is "${user.id}".
        
        systemPrompt += `\nID do usuário atual: "${user.id}". Use este ID ao salvar os artefatos.`;

        if (body.type === 'summary' || body.type === 'resumo') {
            const { toolResults } = await generateText({
                model,
                system: systemPrompt,
                prompt: `Gere um resumo completo sobre ${body.topic}. Salve-o usando a ferramenta saveSummary.`,
                tools: { saveSummary },
                toolChoice: 'required', 
                maxSteps: 5, // Allow steps for tool execution
            });
            result = toolResults.find(t => t.toolName === 'saveSummary')?.result;
        } 
        else if (body.type === 'flashcards') {
            const { toolResults } = await generateText({
                model,
                system: systemPrompt,
                prompt: `Crie um deck de flashcards sobre ${body.topic}. Salve-o usando a ferramenta saveFlashcards.`,
                tools: { saveFlashcards },
                toolChoice: 'required',
                maxSteps: 5,
            });
            result = toolResults.find(t => t.toolName === 'saveFlashcards')?.result;
        }
        else if (body.type === 'mindmap' || body.type === 'mind_map') {
            const { toolResults } = await generateText({
                model,
                system: systemPrompt,
                prompt: `Crie um mapa mental sobre ${body.topic}. Salve-o usando a ferramenta saveMindMap.`,
                tools: { saveMindMap },
                toolChoice: 'required',
                maxSteps: 5,
            });
            result = toolResults.find(t => t.toolName === 'saveMindMap')?.result;
        }
        else {
             return NextResponse.json(
                { success: false, error: "Tipo de artefato não suportado para geração automática." },
                { status: 400 }
            )
        }

        // result should be the return string from the tool (e.g. "Resumo salvo com sucesso! ID: ...")
        // or JSON if we changed it to return JSON.
        // In definitions.ts, saveSummary returns a string.
        
        // We can parse the ID from the string or just return success.
        // Ideally the tool should return JSON.
        // I will assume success if result is present.

        return NextResponse.json({
            success: !!result,
            message: result || "Geração concluída",
            // extraction of artifact_id would be better if tool returned JSON
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

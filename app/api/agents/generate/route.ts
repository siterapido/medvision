import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateText, stepCountIs } from "ai"
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
        // Autenticacao
        const supabase = await createClient()
        const {
            data: { user }
        } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { success: false, error: "Nao autenticado" },
                { status: 401 }
            )
        }

        // Validar body
        const body: GenerateRequest = await request.json()

        if (!body.type || !body.topic) {
            return NextResponse.json(
                { success: false, error: "Tipo e tema sao obrigatorios" },
                { status: 400 }
            )
        }

        const model = openrouter('google/gemini-2.0-flash-exp:free') // Fast model for generation

        let result: string | undefined;
        
        // Construct prompt based on type
        let systemPrompt = `Voce e um especialista em educacao odontologica. 
        Sua tarefa e criar materiais de estudo de alta qualidade sobre o tema: "${body.topic}".
        ${body.instructions ? `Instrucoes adicionais: ${body.instructions}` : ""}
        ${body.difficulty ? `Nivel de dificuldade: ${body.difficulty}` : ""}
        ${body.num_items ? `Quantidade de itens: ${body.num_items}` : ""}
        `;

        // We inject the user_id into the tool call by prompting or pre-filling?
        // The tool definition requires `userId`. The model doesn't know the userId.
        // We must provide it in the prompt or use a wrapper.
        // Since we can't easily partial apply the tool in `generateText` tools definition, 
        // we will tell the model the userId is "${user.id}".
        
        systemPrompt += `\nID do usuario atual: "${user.id}". Use este ID ao salvar os artefatos.`;

        if (body.type === 'summary' || body.type === 'resumo') {
            const response = await generateText({
                model: model as any,
                system: systemPrompt,
                prompt: `Gere um resumo completo sobre ${body.topic}. Salve-o usando a ferramenta saveSummary.`,
                tools: { saveSummary },
                toolChoice: 'required', 
                stopWhen: stepCountIs(5),
            });
            // Get result from steps
            const toolResult = response.steps.flatMap(s => s.toolResults).find(t => t.toolName === 'saveSummary');
            result = toolResult?.output as string | undefined;
        } 
        else if (body.type === 'flashcards') {
            const response = await generateText({
                model: model as any,
                system: systemPrompt,
                prompt: `Crie um deck de flashcards sobre ${body.topic}. Salve-o usando a ferramenta saveFlashcards.`,
                tools: { saveFlashcards },
                toolChoice: 'required',
                stopWhen: stepCountIs(5),
            });
            const toolResult = response.steps.flatMap(s => s.toolResults).find(t => t.toolName === 'saveFlashcards');
            result = toolResult?.output as string | undefined;
        }
        else if (body.type === 'mindmap' || body.type === 'mind_map') {
            const response = await generateText({
                model: model as any,
                system: systemPrompt,
                prompt: `Crie um mapa mental sobre ${body.topic}. Salve-o usando a ferramenta saveMindMap.`,
                tools: { saveMindMap },
                toolChoice: 'required',
                stopWhen: stepCountIs(5),
            });
            const toolResult = response.steps.flatMap(s => s.toolResults).find(t => t.toolName === 'saveMindMap');
            result = toolResult?.output as string | undefined;
        }
        else {
             return NextResponse.json(
                { success: false, error: "Tipo de artefato nao suportado para geracao automatica." },
                { status: 400 }
            )
        }

        return NextResponse.json({
            success: !!result,
            message: result || "Geracao concluida",
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

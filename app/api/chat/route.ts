import { streamText, convertToModelMessages, stepCountIs, UIMessage } from 'ai';
import { openrouter } from '@/lib/ai/openrouter';
import { AGENT_CONFIGS } from '@/lib/ai/agents/config';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 60;

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper to extract text from UIMessage parts
function extractTextFromMessage(message: UIMessage): string {
    if (!message.parts) return '';
    for (const part of message.parts) {
        if ('text' in part && typeof part.text === 'string') {
            return part.text;
        }
    }
    return JSON.stringify(message.parts);
}

export async function POST(req: Request) {
    const { messages, agentId, sessionId, userId }: { messages: UIMessage[], agentId: string, sessionId?: string, userId?: string } = await req.json();

    const agentConfig = AGENT_CONFIGS[agentId] || AGENT_CONFIGS['odonto-gpt'];
    const modelId = agentConfig.model || 'google/gemma-2-27b-it:free';

    // --- CONTEXT INJECTION & SETUP MODE ---
    let systemPrompt = agentConfig.system;

    if (userId) {
        // Fetch user profile
        const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();

        if (profile) {
            // 1. Inject Context
            const contextParts = [];
            if (profile.university) contextParts.push(`Universidade: ${profile.university}`);
            if (profile.semester) contextParts.push(`Semestre/Fase: ${profile.semester}`);
            if (profile.level) contextParts.push(`Nivel: ${profile.level}`);
            if (profile.specialty_interest) contextParts.push(`Interesse: ${profile.specialty_interest}`);

            if (contextParts.length > 0) {
                systemPrompt += `\n\n# CONTEXTO DO ALUNO (PRIORITARIO)\n${contextParts.join('\n')}\nAdapte sua linguagem e profundidade para este perfil.`;
            }

            // 2. Setup Mode Trigger
            if (agentId === 'odonto-gpt' && (!profile.semester || !profile.university)) {
                systemPrompt += `\n\n# MODO SETUP ATIVO (MISSING INFO)\nVoce percebeu que nao sabe o semestre ou universidade do aluno.\nNo inicio da sua resposta, pergunte casualmente: "A proposito, em que semestre e faculdade voce esta? Assim posso calibrar melhor as explicacoes."\nUse a ferramenta \`updateUserProfile\` assim que ele responder.`;
            }
        }
    }

    // Map agentId to allowed agent_type in DB
    let dbAgentType = 'qa';
    if (agentId === 'odonto-vision') dbAgentType = 'image-analysis';
    else if (['odonto-summary', 'odonto-practice', 'odonto-research'].includes(agentId)) dbAgentType = 'orchestrated';

    let currentSessionId = sessionId;

    // Create session if needed
    if (!currentSessionId && userId) {
        const lastMsg = messages[messages.length - 1];
        const titleContent = extractTextFromMessage(lastMsg) || "Nova Conversa";

        const { data: session } = await supabase.from('agent_sessions').insert({
            user_id: userId,
            agent_type: dbAgentType,
            metadata: { title: titleContent.substring(0, 50) }
        }).select().single();

        if (session) {
            currentSessionId = session.id;
        }
    }

    // Save User Message
    if (currentSessionId) {
        const lastMsg = messages[messages.length - 1];
        if (lastMsg.role === 'user') {
            const contentStr = extractTextFromMessage(lastMsg);

            await supabase.from('agent_messages').insert({
                session_id: currentSessionId,
                agent_id: agentId,
                role: 'user',
                content: contentStr,
            });
        }
    }

    // Convert UI messages to model messages
    const modelMessages = await convertToModelMessages(messages);

    const result = streamText({
        model: openrouter(modelId) as any,
        system: systemPrompt,
        messages: modelMessages,
        tools: agentConfig.tools,
        stopWhen: stepCountIs(5),
        onFinish: async (event) => {
            if (currentSessionId) {
                await supabase.from('agent_messages').insert({
                    session_id: currentSessionId,
                    agent_id: agentId,
                    role: 'assistant',
                    content: event.text,
                    tool_calls: event.toolCalls as any,
                });
            }
        }
    });

    return result.toUIMessageStreamResponse({
        headers: {
            'x-session-id': currentSessionId || '',
        }
    });

}

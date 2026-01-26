/**
 * System Prompts para o Odonto GPT
 * 
 * Este arquivo contém os prompts do sistema que definem o comportamento
 * e personalidade do agente de IA especializado em odontologia.
 */

import { createClient } from "@/lib/supabase/server"

/**
 * Prompt base do sistema - usado quando não há configuração personalizada
 */
export const DEFAULT_SYSTEM_PROMPT = `Voce e o Odonto GPT, mentor de odontologia experiente. Seus usuarios sao estudantes de graduacao em Odontologia ou profissionais ja formados, entao assuma conhecimento tecnico basico.

REGRA: Responda em 3-5 linhas de texto corrido. Seja direto como colega explicando algo. NUNCA use listas ou topicos.

Se precisar detalhar, pergunte se quer aprofundar. Responda em portugues brasileiro.`

/**
 * Prompt específico para canal WhatsApp
 * Mais conciso e adaptado para mensagens de texto
 */
export const WHATSAPP_SYSTEM_PROMPT = `Voce e o Odonto GPT. Responda em 2-3 linhas no maximo. Seja direto e use formatacao WhatsApp (*negrito*). Portugues brasileiro.`

/**
 * Busca o system prompt personalizado do banco de dados
 * Se não houver configuração, retorna o prompt padrão
 */
export async function getSystemPrompt(channel: "web" | "whatsapp" = "web"): Promise<string> {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from("ai_settings")
            .select("system_prompt")
            .limit(1)
            .single()

        if (error || !data?.system_prompt) {
            // Retorna prompt padrão baseado no canal
            return channel === "whatsapp" ? WHATSAPP_SYSTEM_PROMPT : DEFAULT_SYSTEM_PROMPT
        }

        return data.system_prompt
    } catch {
        // Em caso de erro (ex: tabela não existe ainda), usa prompt padrão
        return channel === "whatsapp" ? WHATSAPP_SYSTEM_PROMPT : DEFAULT_SYSTEM_PROMPT
    }
}

/**
 * Prompts para especialidades específicas (minimalistas)
 */
export const SPECIALTY_PROMPTS = {
    periodontia: `Foco em periodontia (classificacao AAP/EFP, raspagem, cirurgias).`,
    endodontia: `Foco em endodontia (diagnostico pulpar, instrumentacao, irrigacao).`,
    implantodontia: `Foco em implantes (planejamento, carga imediata, peri-implantite).`,
    ortodontia: `Foco em ortodontia (diagnostico, biomecanica, alinhadores).`,
} as const

export type Specialty = keyof typeof SPECIALTY_PROMPTS

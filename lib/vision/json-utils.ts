/**
 * Tenta fechar chaves/colchetes faltantes em JSON truncado.
 * Útil quando o modelo atinge o limite de tokens e a resposta é cortada.
 */
function tryRepairTruncatedJSON(s: string): string {
    let opens = 0
    let openBrackets = 0
    let inString = false
    let escape = false

    for (const ch of s) {
        if (escape) { escape = false; continue }
        if (ch === '\\' && inString) { escape = true; continue }
        if (ch === '"') { inString = !inString; continue }
        if (inString) continue
        if (ch === '{') opens++
        else if (ch === '}') opens--
        else if (ch === '[') openBrackets++
        else if (ch === ']') openBrackets--
    }

    // Fechar string aberta
    let repaired = s
    if (inString) repaired += '"'

    // Fechar arrays e objetos abertos
    for (let i = 0; i < openBrackets; i++) repaired += ']'
    for (let i = 0; i < opens; i++) repaired += '}'

    return repaired
}

/**
 * Extrai JSON válido da resposta do modelo.
 * Aceita JSON puro, blocos markdown, texto ao redor e JSON truncado.
 */
export function extractJSON(text: string): unknown {
    let s = text.trim()

    // Remove blocos markdown ```json ... ```
    if (s.startsWith('```')) {
        s = s.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '').trim()
    }

    // 1. Tenta parse direto
    try {
        return JSON.parse(s)
    } catch {
        /* fall through */
    }

    // 2. Extrai o maior bloco JSON da resposta
    const match = s.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
    if (match) {
        try {
            return JSON.parse(match[1])
        } catch {
            // 3. Tenta reparar JSON truncado
            try {
                return JSON.parse(tryRepairTruncatedJSON(match[1]))
            } catch {
                /* fall through */
            }
        }
    }

    // 4. Última tentativa: encontra início de JSON e repara
    const jsonStart = s.indexOf('{')
    if (jsonStart >= 0) {
        const fragment = s.slice(jsonStart)
        try {
            return JSON.parse(tryRepairTruncatedJSON(fragment))
        } catch {
            /* fall through */
        }
    }

    throw new SyntaxError(`Could not extract valid JSON from AI response. Preview: ${s.slice(0, 200)}`)
}

/** Reduz risco de prompt injection no contexto clínico livre. */
export function sanitizeClinicalContext(ctx: string): string {
    return ctx
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/`{3,}/g, '```')
        .slice(0, 1000)
}

const maxBase64Chars = 10 * 1024 * 1024 // 10MB para acomodar imagens grandes pré-compressão

export function validateImagePayload(imageData: string): { valid: boolean; message?: string } {
    if (imageData.length > maxBase64Chars) {
        return {
            valid: false,
            message: `Image too large (${Math.round((imageData.length / 1024 / 1024) * 0.75)}MB). Please use a smaller or compressed image.`,
        }
    }
    return { valid: true }
}

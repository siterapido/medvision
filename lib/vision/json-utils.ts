/**
 * Extrai JSON válido da resposta do modelo.
 * Aceita JSON puro, blocos markdown e texto ao redor.
 */
export function extractJSON(text: string): unknown {
    let s = text.trim()
    if (s.startsWith('```')) {
        s = s.replace(/^```(?:json)?\s*\n?/, '').replace(/\n?\s*```$/, '').trim()
    }
    try {
        return JSON.parse(s)
    } catch {
        /* fall through */
    }
    const match = s.match(/(\{[\s\S]*\}|\[[\s\S]*\])/)
    if (match) {
        try {
            return JSON.parse(match[1])
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

const maxBase64Chars = 5 * 1024 * 1024

export function validateImagePayload(imageData: string): { valid: boolean; message?: string } {
    if (imageData.length > maxBase64Chars) {
        return {
            valid: false,
            message: `Image too large (${Math.round((imageData.length / 1024 / 1024) * 0.75)}MB). Please use a smaller or compressed image.`,
        }
    }
    return { valid: true }
}

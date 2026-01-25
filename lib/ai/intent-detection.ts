/**
 * Intent Detection - Detect user intent and suggest appropriate tools
 *
 * Helps guide tool selection based on user message patterns.
 * Can be used with toolChoice to force tool execution when intent is clear.
 */

export interface DetectedIntent {
  tool: string
  kind?: string
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

/**
 * Detect user intent from message text
 *
 * Returns suggested tool and parameters if a clear intent is detected.
 */
export function detectIntent(message: string): DetectedIntent | null {
  if (!message || typeof message !== 'string') {
    return null
  }

  const lower = message.toLowerCase().trim()

  // SUMMARY intents
  if (
    lower.match(/\b(crie?|faça?|gere?|monte?|elabore?)\s+(um?|uma?)?\s*resumo/i) ||
    lower.match(/\bresum[oa]\s+(sobre|de|do|da)/i) ||
    lower.match(/\b(sintetiz[ae]|sinopse|sintese)/i)
  ) {
    return {
      tool: 'createDocument',
      kind: 'summary',
      confidence: 'high',
      reason: 'User explicitly requested a summary',
    }
  }

  // FLASHCARDS intents
  if (
    lower.match(/\b(crie?|faça?|gere?)\s+(um?|uma?)?\s*(deck|conjunto)?\s*d[eo]\s*flashcards?/i) ||
    lower.match(/\bflashcards?\s+(sobre|de|do|da)/i) ||
    lower.match(/\bcart[oõ]es\s+de\s+estudo/i)
  ) {
    return {
      tool: 'createDocument',
      kind: 'flashcards',
      confidence: 'high',
      reason: 'User explicitly requested flashcards',
    }
  }

  // QUIZ intents
  if (
    lower.match(/\b(crie?|faça?|gere?)\s+(um?|uma?)?\s*(quiz|simulado|prova|teste)/i) ||
    lower.match(/\bquest[oõ]es\s+(sobre|de|do|da)/i) ||
    lower.match(/\bsimulado\s+de/i) ||
    lower.match(/\bexerc[íi]cios?\s+(sobre|de)/i)
  ) {
    return {
      tool: 'createDocument',
      kind: 'quiz',
      confidence: 'high',
      reason: 'User explicitly requested quiz/questions',
    }
  }

  // RESEARCH intents
  if (
    lower.match(/\bpesquis[ae]\s+(sobre|artigos?|literatura)/i) ||
    lower.match(/\bbusque?\s+(artigos?|literatura|estudos?)/i) ||
    lower.match(/\brevis[aã]o\s+(bibliogr[aá]fica|de\s+literatura)/i) ||
    lower.match(/\bdossi[eê]\s+de\s+pesquisa/i)
  ) {
    return {
      tool: 'createDocument',
      kind: 'research',
      confidence: 'high',
      reason: 'User requested research/literature review',
    }
  }

  // REPORT intents (radiographic reports)
  if (
    lower.match(/\b(analise?|avalie?|interprete?)\s+(a|esta|essa)?\s*(imagem|radiografia|raio-?x)/i) ||
    lower.match(/\blaudo\s+(radiogr[aá]fico|de\s+imagem)/i) ||
    lower.match(/\brelatório\s+de\s+imagem/i)
  ) {
    return {
      tool: 'createDocument',
      kind: 'report',
      confidence: 'high',
      reason: 'User requested image analysis/report',
    }
  }

  // PERPLEXITY search intents
  if (
    lower.match(/\b(busque?|procure?|pesquise?)\s+(na\s+)?internet/i) ||
    lower.match(/\bo\s+que\s+[eé]\s+.+\?\s*$/i) && lower.length < 100 ||
    lower.match(/\bquais?\s+(s[aã]o|foram)/i)
  ) {
    return {
      tool: 'askPerplexity',
      confidence: 'medium',
      reason: 'User asked a factual question that may require web search',
    }
  }

  // MEMORY intents
  if (
    lower.match(/\b(lembre?|guarde?|salve?|memorize?)\s+(que|isso|isto)/i) ||
    lower.match(/\bvoc[eê]\s+(sabe|lembra)\s+(que|meu|minha)/i)
  ) {
    return {
      tool: 'rememberFact',
      confidence: 'medium',
      reason: 'User wants to save information',
    }
  }

  // No clear intent detected
  return null
}

/**
 * Get tool choice configuration based on detected intent
 *
 * Returns toolChoice parameter for generateText.
 * Use 'auto' when no intent is detected.
 */
export function getToolChoice(
  intent: DetectedIntent | null
): { type: 'auto' } | { type: 'tool'; toolName: string } | { type: 'required' } {
  if (!intent) {
    return { type: 'auto' }
  }

  // Force tool execution for high-confidence intents
  if (intent.confidence === 'high' && intent.tool) {
    return {
      type: 'tool',
      toolName: intent.tool,
    }
  }

  // Let model decide for medium/low confidence
  return { type: 'auto' }
}

/**
 * Check if message is a greeting
 */
export function isGreeting(message: string): boolean {
  const lower = message.toLowerCase().trim()

  return !!(
    lower.match(/^(oi|ol[aá]|hey|e a[íi]|tudo bem|como vai|bom dia|boa tarde|boa noite)[\s!?.,]*$/i) ||
    lower.match(/^(hi|hello|hey there)[\s!?.,]*$/i)
  )
}

/**
 * Check if message contains personal information
 */
export function containsPersonalInfo(message: string): boolean {
  const lower = message.toLowerCase()

  return !!(
    lower.match(/\bmeu\s+nome\s+[eé]/i) ||
    lower.match(/\bme\s+chamo/i) ||
    lower.match(/\bestudo\s+(na|no)/i) ||
    lower.match(/\bsou\s+d[ao]/i) ||
    lower.match(/\bestou\s+no\s+\d+[ºo°]?\s*semestre/i)
  )
}

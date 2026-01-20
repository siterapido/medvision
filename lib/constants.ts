
/**
 * Canonical Agent IDs used across Backend and Frontend.
 * Must match the 'name' attribute in Python agent definitions.
 */
export const AGENT_IDS = {
    RESEARCH: 'odonto-research',
    PRACTICE: 'odonto-practice',
    WRITE: 'odonto-write',
    VISION: 'odonto-vision',
    SUMMARY: 'odonto-summary',
    FLOW: 'odonto-gpt', // Unified Agent
    QA: 'odonto-qa',
} as const;

/**
 * Artifact Types produced by agents.
 */
export const ARTIFACT_TYPES = {
    SUMMARY: 'resumo',
    FLASHCARDS: 'flashcards',
    MINDMAP: 'mapa_mental',
    PRACTICE_EXAM: 'simulado',
    RESEARCH: 'pesquisa',
    ACADEMIC_TEXT: 'texto_academico'
} as const;

/**
 * Agent Display Names
 */
export const AGENT_NAMES = {
    [AGENT_IDS.RESEARCH]: 'Odonto Research',
    [AGENT_IDS.PRACTICE]: 'Odonto Practice',
    [AGENT_IDS.WRITE]: 'Odonto Write',
    [AGENT_IDS.VISION]: 'Odonto Vision',
    [AGENT_IDS.SUMMARY]: 'Odonto Summary',
    [AGENT_IDS.FLOW]: 'Odonto GPT', // Unified Name
    [AGENT_IDS.QA]: 'Odonto GPT Legacy',
} as const;

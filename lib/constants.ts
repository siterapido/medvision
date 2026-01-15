
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
    FLOW: 'odonto-flow',
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
    [AGENT_IDS.RESEARCH]: 'Dr. Ciência',
    [AGENT_IDS.PRACTICE]: 'Prof. Estudo',
    [AGENT_IDS.WRITE]: 'Dr. Redator',
    [AGENT_IDS.VISION]: 'Dr. Vision',
    [AGENT_IDS.SUMMARY]: 'Odonto Summary',
    [AGENT_IDS.FLOW]: 'Odonto Flow',
    [AGENT_IDS.QA]: 'Odonto GPT',
} as const;

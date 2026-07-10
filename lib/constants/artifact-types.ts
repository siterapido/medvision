/** Tipos de artifact aceitos pelo service e alinhados ao enum SQL / API Zod. */
export const ARTIFACT_VALID_TYPES = [
  'chat',
  'document',
  'code',
  'image',
  'vision',
  'research',
  'exam',
  'summary',
  'flashcards',
  'mindmap',
  'other',
] as const

export type ArtifactValidType = (typeof ARTIFACT_VALID_TYPES)[number]

export function isValidArtifactType(type: string): type is ArtifactValidType {
  return (ARTIFACT_VALID_TYPES as readonly string[]).includes(type)
}

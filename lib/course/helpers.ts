export const normalizeDifficulty = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

export const DIFFICULTY_VALUES = ["Iniciante", "Intermediário", "Avançado"] as const
export type DifficultyValue = (typeof DIFFICULTY_VALUES)[number]

const DIFFICULTY_CANONICAL_MAP: Record<string, DifficultyValue> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
}

export const toCanonicalDifficulty = (value?: string | null): DifficultyValue | undefined => {
  if (!value) return undefined
  const normalized = normalizeDifficulty(value)
  return DIFFICULTY_CANONICAL_MAP[normalized]
}

export const parsePrice = (price?: string) => {
  if (!price) {
    return null
  }

  const cleaned = price
    .replace(/[^\d.,]/g, "")
    .replace(/\./g, "")
    .replace(/,/, ".")
  const parsed = parseFloat(cleaned)
  return Number.isNaN(parsed) ? null : parsed
}

export const parseTags = (tags?: string) => {
  if (!tags) {
    return null
  }

  const parsed = tags
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)

  return parsed.length > 0 ? parsed : null
}

const decodeIfNeeded = (value: string) => {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export const sanitizeCourseId = (value?: string | null): string | null => {
  if (!value) {
    return null
  }

  const decoded = decodeIfNeeded(value)
  const trimmed = decoded.trim()
  if (trimmed.length === 0) {
    return null
  }

  const withoutQuotes = trimmed.replace(/^["'`]+/, "").replace(/["'`]+$/, "")
  const withoutTrailingSlash = withoutQuotes.replace(/\/$/, "")
  if (withoutTrailingSlash.length === 0) {
    return null
  }

  if (withoutTrailingSlash.toLowerCase() === "undefined") {
    return null
  }

  return withoutTrailingSlash
}

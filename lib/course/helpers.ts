export const normalizeDifficulty = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")

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

export const parseMaterialTags = (value?: string | null) => {
  if (!value) {
    return []
  }

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
}

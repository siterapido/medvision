const extractUrlFromString = (value?: string | null): string | null => {
  if (!value) return null
  const trimmed = value.trim()
  if (trimmed.length === 0) return null
  const matches = trimmed.match(/https?:\/\/[^\s"']+/g)
  if (matches && matches.length > 0) return matches[0]
  return trimmed
}

const trimDuplicateProtocol = (value: string) => {
  const protocols = ["https://", "http://"]
  let secondIndex = -1
  const baseIndex = Math.min(
    ...protocols.map((proto) => value.indexOf(proto)).filter((idx) => idx !== -1),
  )
  if (baseIndex === Infinity || baseIndex === -1) return value
  protocols.forEach((proto) => {
    const nextIndex = value.indexOf(proto, baseIndex + proto.length)
    if (nextIndex > -1) secondIndex = secondIndex === -1 ? nextIndex : Math.min(secondIndex, nextIndex)
  })
  if (secondIndex > -1) return value.slice(0, secondIndex)
  return value
}

export const normalizeVideoUrl = (value?: string | null): string | null => {
  const urlCandidate = extractUrlFromString(value)
  if (!urlCandidate) return null
  const sanitizedUrl = trimDuplicateProtocol(urlCandidate)
  try {
    const parsed = new URL(sanitizedUrl)
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase()
    if (hostname === "youtu.be") {
      const videoId = parsed.pathname.replace(/^\//, "")
      if (videoId) return `https://www.youtube.com/embed/${videoId}`
    }
    if (hostname === "youtube.com" || hostname === "youtube-nocookie.com") {
      const videoId = parsed.searchParams.get("v")
      if (videoId) return `https://www.youtube.com/embed/${videoId}`
    }
    if (hostname.includes("vimeo.com")) {
      const videoId = parsed.pathname.split("/").filter(Boolean).pop()
      if (videoId) return `https://player.vimeo.com/video/${videoId}`
    }
    if (hostname.endsWith("mediadelivery.net")) return sanitizedUrl
    if (hostname.endsWith("b-cdn.net")) return sanitizedUrl
    return urlCandidate
  } catch {
    return urlCandidate
  }
}

export const isVideoFile = (u?: string | null) => !!u && (u.toLowerCase().endsWith(".mp4") || u.toLowerCase().includes(".m3u8"))


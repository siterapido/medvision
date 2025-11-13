export type AttachmentKind =
  | "pdf"
  | "doc"
  | "ppt"
  | "xls"
  | "image"
  | "zip"
  | "other"

export function kindFromMime(mime: string): AttachmentKind {
  if (mime === "application/pdf") return "pdf"
  if (
    mime === "application/msword" ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "doc"
  }
  if (
    mime === "application/vnd.ms-powerpoint" ||
    mime === "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ) {
    return "ppt"
  }
  if (
    mime === "application/vnd.ms-excel" ||
    mime === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  ) {
    return "xls"
  }
  if (mime.startsWith("image/")) return "image"
  if (mime === "application/zip" || mime === "application/x-7z-compressed") return "zip"
  return "other"
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes)) return "—"
  const units = ["B", "KB", "MB", "GB"]
  let idx = 0
  let val = bytes
  while (val >= 1024 && idx < units.length - 1) {
    val = val / 1024
    idx++
  }
  return `${val.toFixed(idx === 0 ? 0 : 1)} ${units[idx]}`
}


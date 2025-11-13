import { z } from "zod"

export const ALLOWED_MIME = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword",
  "application/vnd.ms-powerpoint",
  "application/vnd.ms-excel",
  "application/zip",
  "application/x-7z-compressed",
]

export const allowedMimeSchema = z.union([
  z.literal("application/pdf"),
  z.literal("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
  z.literal("application/vnd.openxmlformats-officedocument.presentationml.presentation"),
  z.literal("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
  z.literal("application/msword"),
  z.literal("application/vnd.ms-powerpoint"),
  z.literal("application/vnd.ms-excel"),
  z.literal("application/zip"),
  z.literal("application/x-7z-compressed"),
  z.string().startsWith("image/"),
])

export function maxBytesFromEnv(defaultMb = 10): number {
  const mb = parseInt(process.env.NEXT_PUBLIC_MAX_ATTACHMENT_MB || String(defaultMb), 10)
  return mb * 1024 * 1024
}


import test from "node:test"
import assert from "node:assert/strict"

import { ALLOWED_MIME, allowedMimeSchema, maxBytesFromEnv } from "../lib/attachments/validate"

test("ALLOWED_MIME includes common types", () => {
  const set = new Set(ALLOWED_MIME)
  for (const m of [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/msword",
    "application/vnd.ms-powerpoint",
    "application/vnd.ms-excel",
    "application/zip",
    "application/x-7z-compressed",
  ]) {
    assert.ok(set.has(m))
  }
})

test("allowedMimeSchema accepts images and rejects unknown", () => {
  assert.equal(allowedMimeSchema.safeParse("image/png").success, true)
  assert.equal(allowedMimeSchema.safeParse("application/octet-stream").success, false)
})

test("maxBytesFromEnv reads env and converts to bytes", () => {
  process.env.NEXT_PUBLIC_MAX_ATTACHMENT_MB = "10"
  assert.equal(maxBytesFromEnv(5), 10 * 1024 * 1024)
  process.env.NEXT_PUBLIC_MAX_ATTACHMENT_MB = "1"
  assert.equal(maxBytesFromEnv(5), 1 * 1024 * 1024)
})


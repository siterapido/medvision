import test from "node:test"
import assert from "node:assert/strict"

import { kindFromMime, formatBytes } from "../lib/attachments/mime"

test("kindFromMime maps common types", () => {
  assert.equal(kindFromMime("application/pdf"), "pdf")
  assert.equal(kindFromMime("application/msword"), "doc")
  assert.equal(
    kindFromMime("application/vnd.openxmlformats-officedocument.wordprocessingml.document"),
    "doc",
  )
  assert.equal(kindFromMime("application/vnd.ms-powerpoint"), "ppt")
  assert.equal(
    kindFromMime("application/vnd.openxmlformats-officedocument.presentationml.presentation"),
    "ppt",
  )
  assert.equal(kindFromMime("application/vnd.ms-excel"), "xls")
  assert.equal(
    kindFromMime("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"),
    "xls",
  )
  assert.equal(kindFromMime("image/png"), "image")
  assert.equal(kindFromMime("application/zip"), "zip")
  assert.equal(kindFromMime("application/x-7z-compressed"), "zip")
  assert.equal(kindFromMime("application/octet-stream"), "other")
})

test("formatBytes formats sizes", () => {
  assert.equal(formatBytes(0), "0 B")
  assert.equal(formatBytes(1023), "1023 B")
  assert.equal(formatBytes(1024), "1.0 KB")
  assert.equal(formatBytes(10 * 1024 * 1024), "10.0 MB")
})


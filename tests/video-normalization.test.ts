import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { normalizeVideoUrl, isVideoFile } from "../lib/video/normalize"

describe("normalizeVideoUrl", () => {
  it("normaliza YouTube curto youtu.be", () => {
    const u = normalizeVideoUrl("https://youtu.be/abc123")
    assert.equal(u, "https://www.youtube.com/embed/abc123")
  })

  it("normaliza YouTube com v=", () => {
    const u = normalizeVideoUrl("https://www.youtube.com/watch?v=xyz789")
    assert.equal(u, "https://www.youtube.com/embed/xyz789")
  })

  it("normaliza Vimeo", () => {
    const u = normalizeVideoUrl("https://vimeo.com/555555")
    assert.equal(u, "https://player.vimeo.com/video/555555")
  })

  it("mantém Bunny mediadelivery", () => {
    const src = "https://vz-12345678.b-cdn.net/abcd/index.m3u8"
    const u = normalizeVideoUrl(src)
    assert.equal(u, src)
  })

  it("mantém Bunny b-cdn", () => {
    const src = "https://video.b-cdn.net/path/file.mp4"
    const u = normalizeVideoUrl(src)
    assert.equal(u, src)
  })

  it("mantém URL direta", () => {
    const src = "https://example.com/video.mp4"
    const u = normalizeVideoUrl(src)
    assert.equal(u, src)
  })
})

describe("isVideoFile", () => {
  it("detecta mp4", () => {
    assert.equal(isVideoFile("https://example.com/a.mp4"), true)
  })
  it("detecta m3u8", () => {
    assert.equal(isVideoFile("https://example.com/stream.m3u8"), true)
  })
  it("ignora outros", () => {
    assert.equal(isVideoFile("https://example.com/index.html"), false)
  })
})


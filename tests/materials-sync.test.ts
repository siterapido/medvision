import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { applyMaterialsChange, mapPayloadToMaterial, type MaterialsPayload } from "../lib/material/realtime"

describe("materials realtime mapping", () => {
  const base = [
    { id: "a", title: "A", description: null, resource_type: "ebook", file_url: "/a.pdf" },
  ]

  it("maps INSERT and appends", () => {
    const payload: MaterialsPayload = { eventType: "INSERT", new: { id: "b", title: "B", resource_type: "slides", file_url: "/b.pdf" }, old: {} }
    const next = applyMaterialsChange(base, payload)
    assert.equal(next.length, 2)
    assert.equal(next.find((m) => m.id === "b")?.title, "B")
  })

  it("maps UPDATE and replaces", () => {
    const payload: MaterialsPayload = { eventType: "UPDATE", new: { id: "a", title: "A2", resource_type: "ebook", file_url: "/a2.pdf" }, old: {} }
    const next = applyMaterialsChange(base, payload)
    assert.equal(next.length, 1)
    assert.equal(next[0].title, "A2")
  })

  it("maps DELETE and removes", () => {
    const payload: MaterialsPayload = { eventType: "DELETE", new: {}, old: { id: "a" } }
    const next = applyMaterialsChange(base, payload)
    assert.equal(next.length, 0)
  })
})


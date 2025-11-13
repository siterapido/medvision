import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { groupByType, filterByQuery } from "../lib/material/grouping"

function gen(n: number) {
  const types = ["ebook", "slides", "checklist", "template", "video", "link", "outro"]
  const arr = [] as { id: string; title: string; resource_type: string; tags: string[] }[]
  for (let i = 0; i < n; i++) {
    const t = types[i % types.length]
    arr.push({ id: String(i), title: `Material ${i} ${t}`, resource_type: t, tags: ["tag" + (i % 10), t] })
  }
  return arr
}

describe("materials grouping performance", () => {
  it("groups and filters 10k items under 500ms", () => {
    const items = gen(10000)
    const start = Date.now()
    const grouped = groupByType(items)
    const filtered = filterByQuery(items, "ebook")
    const elapsed = Date.now() - start
    assert.ok(Object.keys(grouped).length >= 5)
    assert.ok(filtered.length > 0)
    assert.ok(elapsed < 500)
  })
})


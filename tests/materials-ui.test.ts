import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { materialsGridClass, materialsBadgeClass, materialsSectionHeaderLabel } from "../components/materials/ui-constants"

describe("materials ui constants", () => {
  it("grid has responsive classes", () => {
    assert.ok(materialsGridClass.includes("sm:grid-cols-2"))
    assert.ok(materialsGridClass.includes("lg:grid-cols-3"))
  })
  it("badge class includes uppercase tracking", () => {
    assert.ok(materialsBadgeClass.includes("uppercase"))
    assert.ok(materialsBadgeClass.includes("tracking-wider"))
  })
  it("section label is defined", () => {
    assert.equal(materialsSectionHeaderLabel, "Materiais")
  })
})


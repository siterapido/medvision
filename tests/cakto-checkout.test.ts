import assert from "node:assert/strict"
import { describe, it } from "node:test"

describe("generateCheckoutUrl com URL completa no env", () => {
  it("extrai ID e monta a URL corretamente", async () => {
    const prev = process.env.NEXT_PUBLIC_CAKTO_PRODUCT_ID
    process.env.NEXT_PUBLIC_CAKTO_PRODUCT_ID = "https://pay.cakto.com.br/3263gsd_647430"

    const mod = await import("../app/lib/cakto")
    const url = mod.generateCheckoutUrl("user@example.com")

    assert.ok(url.startsWith("https://pay.cakto.com.br/3263gsd_647430?"))
    assert.ok(url.includes("email=user%40example.com"))

    process.env.NEXT_PUBLIC_CAKTO_PRODUCT_ID = prev
  })
})


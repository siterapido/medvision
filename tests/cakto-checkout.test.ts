import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { generateCheckoutUrl } from "../app/lib/cakto"

async function withCaktoProductId(value: string, fn: () => void | Promise<void>) {
  const prevPublic = process.env.NEXT_PUBLIC_CAKTO_PRODUCT_ID
  const prevPrivate = process.env.CAKTO_PRODUCT_ID
  process.env.NEXT_PUBLIC_CAKTO_PRODUCT_ID = value
  delete process.env.CAKTO_PRODUCT_ID
  try {
    await fn()
  } finally {
    if (typeof prevPublic === "undefined") {
      delete process.env.NEXT_PUBLIC_CAKTO_PRODUCT_ID
    } else {
      process.env.NEXT_PUBLIC_CAKTO_PRODUCT_ID = prevPublic
    }
    if (typeof prevPrivate === "undefined") {
      delete process.env.CAKTO_PRODUCT_ID
    } else {
      process.env.CAKTO_PRODUCT_ID = prevPrivate
    }
  }
}

describe("generateCheckoutUrl", () => {
  it("extrai ID quando a env usa a URL completa", async () => {
    await withCaktoProductId("https://pay.cakto.com.br/76x6iou_751311", () => {
      const url = generateCheckoutUrl("user@example.com")
      assert.ok(url.startsWith("https://pay.cakto.com.br/76x6iou_751311?"))
      assert.ok(url.includes("email=user%40example.com"))
    })
  })

  it("aceita IDs com hífen/UUID do produto", async () => {
    await withCaktoProductId("ff3fdf61-e88f-43b5-982a-32d50f112414", () => {
      const url = generateCheckoutUrl("premium-user@example.com")
      assert.ok(
        url.startsWith("https://pay.cakto.com.br/ff3fdf61-e88f-43b5-982a-32d50f112414?"),
      )
      assert.ok(url.includes("email=premium-user%40example.com"))
    })
  })
})

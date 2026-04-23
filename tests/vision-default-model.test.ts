import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { MODELS } from "../lib/ai/openrouter"

const KIMI_K26 = "moonshotai/kimi-k2.6"

describe("Modelo padrão de análise de visão (Med Vision)", () => {
  it("MODELS.vision aponta para Kimi k2.6 (padrão OpenRouter de visão)", () => {
    assert.equal(MODELS.vision, KIMI_K26)
  })
})

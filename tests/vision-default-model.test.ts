import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { MODELS } from "../lib/ai/opencode-go"

const KIMI_K26 = "kimi-k2.6"

describe("Modelo padrão de análise de visão (Med Vision / OpenCode Go)", () => {
  it("MODELS.vision aponta para Kimi k2.6 (padrão OpenCode Go)", () => {
    assert.equal(MODELS.vision, KIMI_K26)
  })
})

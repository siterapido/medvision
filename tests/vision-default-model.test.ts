import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { MODELS } from "../lib/ai/openrouter"

/** Deve coincidir com o slug em https://openrouter.ai/z-ai/glm-5v-turbo */
const GLM_5V_TURBO = "z-ai/glm-5v-turbo"

describe("Modelo padrão de análise de visão (Med Vision)", () => {
  it("MODELS.vision aponta para GLM-5V Turbo (padrão OpenRouter de visão)", () => {
    assert.equal(MODELS.vision, GLM_5V_TURBO)
  })
})

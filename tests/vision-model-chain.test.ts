import assert from "node:assert/strict"
import { describe, it } from "node:test"

process.env.MEDVISION_VISION_LOG = "0"
import {
  buildVisionModelChain,
  DEFAULT_VISION_MODEL_CHAIN,
  MODELS,
  VISION_MODELS_LIST,
} from "../lib/ai/openrouter"
import { callWithFallback } from "../lib/vision/model-fallback"

const GLM = "z-ai/glm-5v-turbo"
const GEMINI = "google/gemini-2.5-pro"

describe("buildVisionModelChain (Med Vision)", () => {
  it("com GLM selecionado, primário + fallback sem duplicar", () => {
    const chain = buildVisionModelChain(GLM)
    assert.deepEqual(chain, [GLM, GEMINI])
  })

  it("com Gemini selecionado, primário primeiro e GLM como fallback", () => {
    const chain = buildVisionModelChain(GEMINI)
    assert.deepEqual(chain, [GEMINI, GLM])
  })

  it("com modelo da lista da UI fora da cadeia padrão, primário + cadeia padrão completa", () => {
    const gpt = VISION_MODELS_LIST.find((m) => m.id === "openai/gpt-5.4-pro")
    assert.ok(gpt, "lista de modelos de visão deve incluir gpt-5.4-pro")
    const chain = buildVisionModelChain(gpt.id)
    assert.deepEqual(chain, [gpt.id, ...DEFAULT_VISION_MODEL_CHAIN])
  })

  it("sem modelo ou inválido: coincide com a cadeia padrão", () => {
    assert.deepEqual(buildVisionModelChain(), [...DEFAULT_VISION_MODEL_CHAIN])
    assert.deepEqual(buildVisionModelChain(undefined), [...DEFAULT_VISION_MODEL_CHAIN])
    assert.deepEqual(buildVisionModelChain(""), [...DEFAULT_VISION_MODEL_CHAIN])
    assert.deepEqual(buildVisionModelChain("not-a-vision-model"), [...DEFAULT_VISION_MODEL_CHAIN])
  })

  it("DEFAULT_VISION_MODEL_CHAIN reflete MODELS.vision e fallback", () => {
    assert.deepEqual(DEFAULT_VISION_MODEL_CHAIN, [MODELS.vision, MODELS.visionFallback])
  })
})

describe("callWithFallback", () => {
  it("erro não-retryable no 1.º modelo tenta o 2.º (não lança cedo demais)", async () => {
    const e = new Error("Bad Request: parameter")
    let calls: string[] = []
    const result = await callWithFallback([GLM, GEMINI] as const, async (modelId) => {
      calls.push(modelId)
      if (modelId === GLM) throw e
      return { ok: true, model: modelId }
    })
    assert.deepEqual(calls, [GLM, GEMINI])
    assert.deepEqual(result, { ok: true, model: GEMINI })
  })

  it("escolhe o 1.º quando responde", async () => {
    const r = await callWithFallback([GLM, GEMINI] as const, async (modelId) => {
      if (modelId === GLM) return "first"
      return "second"
    })
    assert.equal(r, "first")
  })
})

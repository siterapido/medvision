import assert from "node:assert/strict"
import { describe, it } from "node:test"

process.env.MEDVISION_VISION_LOG = "0"
import {
  buildVisionModelChain,
  DEFAULT_VISION_MODEL_CHAIN,
  MODELS,
} from "../lib/ai/openrouter"
import { callWithFallback } from "../lib/vision/model-fallback"

const KIMI = MODELS.vision
const QWEN = MODELS.visionQwen

describe("buildVisionModelChain (Med Vision)", () => {
  it("com Kimi (padrão) selecionado, retorna cadeia padrão Kimi → Qwen", () => {
    const chain = buildVisionModelChain(KIMI)
    assert.deepEqual(chain, [KIMI, QWEN])
  })

  it("com Qwen selecionado, primário primeiro e Kimi como fallback", () => {
    const chain = buildVisionModelChain(QWEN)
    assert.deepEqual(chain, [QWEN, KIMI])
  })

  it("com modelo customizado fora da lista Kimi/Qwen, primário + cadeia padrão completa", () => {
    const custom = "openai/gpt-4o"
    const chain = buildVisionModelChain(custom)
    assert.deepEqual(chain, [custom, ...DEFAULT_VISION_MODEL_CHAIN])
  })

  it("sem seleção (undefined, string vazia): cadeia padrão; id desconhecido vira custom + fallback", () => {
    assert.deepEqual(buildVisionModelChain(), [...DEFAULT_VISION_MODEL_CHAIN])
    assert.deepEqual(buildVisionModelChain(undefined), [...DEFAULT_VISION_MODEL_CHAIN])
    assert.deepEqual(buildVisionModelChain(""), [...DEFAULT_VISION_MODEL_CHAIN])
    assert.deepEqual(buildVisionModelChain("not-a-vision-model"), [
      "not-a-vision-model",
      ...DEFAULT_VISION_MODEL_CHAIN,
    ])
  })

  it("DEFAULT_VISION_MODEL_CHAIN é Kimi → Qwen", () => {
    assert.deepEqual(DEFAULT_VISION_MODEL_CHAIN, [MODELS.vision, MODELS.visionQwen])
  })
})

describe("callWithFallback", () => {
  it("erro retryable no 1.º modelo tenta o 2.º", async () => {
    const e = new Error("timeout after 30s")
    let calls: string[] = []
    const result = await callWithFallback([KIMI, QWEN] as const, async (modelId) => {
      calls.push(modelId)
      if (modelId === KIMI) throw e
      return { ok: true, model: modelId }
    })
    assert.deepEqual(calls, [KIMI, QWEN])
    assert.deepEqual(result, { ok: true, model: QWEN })
  })

  it("escolhe o 1.º quando responde", async () => {
    const r = await callWithFallback([KIMI, QWEN] as const, async (modelId) => {
      if (modelId === KIMI) return "first"
      return "second"
    })
    assert.equal(r, "first")
  })
})

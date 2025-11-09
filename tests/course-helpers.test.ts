import assert from "node:assert/strict"
import { describe, it } from "node:test"
import { normalizeDifficulty, parsePrice, parseTags } from "../lib/course/helpers"

describe("normalizeDifficulty", () => {
  it("lowercases e remove acentos", () => {
    assert.equal(normalizeDifficulty("Iniciante"), "iniciante")
    assert.equal(normalizeDifficulty("Intermediário"), "intermediario")
    assert.equal(normalizeDifficulty("AVANÇADO"), "avancado")
  })
})

describe("parsePrice", () => {
  it("retorna número ao limpar símbolos e formatos", () => {
    assert.equal(parsePrice("R$ 1.234,56"), 1234.56)
    assert.equal(parsePrice("1500"), 1500)
  })

  it("retorna null quando o preço é inválido ou ausente", () => {
    assert.equal(parsePrice("abc"), null)
    assert.equal(parsePrice(""), null)
    assert.equal(parsePrice(undefined), null)
  })
})

describe("parseTags", () => {
  it("divide, remove espaços e filtra valores vazios", () => {
    assert.deepEqual(parseTags("implantes, cirurgias , , estetica"), [
      "implantes",
      "cirurgias",
      "estetica",
    ])
  })

  it("retorna null quando não há tags válidas", () => {
    assert.equal(parseTags(" , ,"), null)
    assert.equal(parseTags(undefined), null)
  })
})

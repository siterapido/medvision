import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { sanitizeNextPath } from "../app/auth/callback/route"

describe("sanitizeNextPath", () => {
  it("mantém caminhos relativos válidos", () => {
    assert.equal(sanitizeNextPath("/dashboard"), "/dashboard")
    assert.equal(sanitizeNextPath("/admin"), "/admin")
  })

  it("retorna fallback quando valor é vazio ou inválido", () => {
    assert.equal(sanitizeNextPath(null), "/dashboard")
    assert.equal(sanitizeNextPath(""), "/dashboard")
  })

  it("bloqueia tentativas de open-redirect", () => {
    assert.equal(sanitizeNextPath("http://example.com"), "/dashboard")
    assert.equal(sanitizeNextPath("https://odontogpt.com"), "/dashboard")
    assert.equal(sanitizeNextPath("//evil.com"), "/dashboard")
  })
})

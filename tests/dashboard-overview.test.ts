import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { formatDurationLabel, getCourseStatus, isCourseNew } from "../lib/dashboard/overview"

describe("formatDurationLabel", () => {
  it("retorna texto preferido quando disponível", () => {
    assert.equal(formatDurationLabel("1h 30m", 90), "1h 30m")
  })

  it("converte minutos em formato legível", () => {
    assert.equal(formatDurationLabel(undefined, 125), "2h 5m")
    assert.equal(formatDurationLabel(undefined, 60), "1h")
    assert.equal(formatDurationLabel(undefined, 45), "45m")
    assert.equal(formatDurationLabel(undefined, 0), "—")
  })
})

describe("getCourseStatus", () => {
  it("identifica o status correto", () => {
    assert.equal(getCourseStatus(0), "not-started")
    assert.equal(getCourseStatus(100), "completed")
    assert.equal(getCourseStatus(50), "in-progress")
  })
})

describe("isCourseNew", () => {
  it("retorna true para aulas publicadas nos últimos 7 dias", () => {
    const recent = new Date()
    recent.setDate(recent.getDate() - 3)
    assert.equal(isCourseNew(recent.toISOString()), true)
  })

  it("retorna false para datas antigas ou inválidas", () => {
    const old = new Date()
    old.setDate(old.getDate() - 20)
    assert.equal(isCourseNew(old.toISOString()), false)
    assert.equal(isCourseNew("not-a-date"), false)
    assert.equal(isCourseNew(undefined), false)
  })
})

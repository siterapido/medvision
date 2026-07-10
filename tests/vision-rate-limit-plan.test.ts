import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  checkUsageLimit,
  getRateLimitForUser,
} from "../lib/vision/rate-limit"

describe("getRateLimitForUser", () => {
  it("plano pro tem limites maiores que free", () => {
    const free = getRateLimitForUser("free")
    const pro = getRateLimitForUser("pro")

    assert.ok(pro.dailyLimit > free.dailyLimit)
    assert.ok(pro.weeklyLimit > free.weeklyLimit)
  })

  it("enterprise usa mesmos limites que pro", () => {
    const pro = getRateLimitForUser("pro")
    const enterprise = getRateLimitForUser("enterprise")
    assert.deepEqual(enterprise, pro)
  })
})

describe("checkUsageLimit", () => {
  it("respeita plano pro via querier mock", async () => {
    const pro = getRateLimitForUser("pro")
    const free = getRateLimitForUser("free")

    // Uso acima do free, abaixo do pro → free bloqueia, pro libera
    const used = free.dailyLimit + 1
    assert.ok(used < pro.dailyLimit)

    const querier = async (_userId: string, _since: string) => used

    const freeCheck = await checkUsageLimit("user-1", querier, "free")
    assert.equal(freeCheck.allowed, false)
    assert.equal(freeCheck.dailyLimit, free.dailyLimit)

    const proCheck = await checkUsageLimit("user-1", querier, "pro")
    assert.equal(proCheck.allowed, true)
    assert.equal(proCheck.dailyLimit, pro.dailyLimit)
    assert.equal(proCheck.dailyUsed, used)
  })

  it("bloqueia quando querier reporta uso no limite diário", async () => {
    const free = getRateLimitForUser("free")
    const querier = async () => free.dailyLimit

    const check = await checkUsageLimit("user-2", querier, "free")
    assert.equal(check.allowed, false)
    assert.match(check.reason ?? "", /diário/i)
  })
})

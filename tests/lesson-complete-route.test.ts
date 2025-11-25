import assert from "node:assert/strict"
import { describe, it } from "node:test"

import * as route from "../app/api/courses/lessons/complete/route"

describe("lesson complete route", () => {
  it("exporta POST handler", () => {
    assert.equal(typeof (route as any).POST, "function")
  })
})


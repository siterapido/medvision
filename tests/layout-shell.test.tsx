import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  appScrollAreaClassName,
  appScrollAreaLabel,
  appScrollAreaRole,
  appScrollAreaTabIndex,
  appScrollAreaTestId,
} from "../components/layout/app-scroll-area"
import {
  dashboardScrollAreaClassName,
  dashboardScrollAreaLabel,
  dashboardScrollAreaRole,
  dashboardScrollAreaStyle,
  dashboardScrollAreaTestId,
} from "../components/layout/dashboard-scroll-area"
import {
  landingHeaderClassName,
  landingNavClassName,
  landingNavLinks,
} from "../components/layout/landing-header"
import { landingFooterClassName } from "../components/layout/landing-footer"

describe("AppScrollArea", () => {
  it("exposes a scrollable region with smooth behavior and mobile compat", () => {
    assert.equal(appScrollAreaRole, "region")
    assert.equal(appScrollAreaTabIndex, -1)
    assert(appScrollAreaClassName.includes("app-scroll-region"))
    assert(appScrollAreaClassName.includes("scroll-smooth"))
    assert(appScrollAreaClassName.includes("flex-1"))
    assert.equal(appScrollAreaLabel, "Conteúdo principal do site")
    assert.equal(appScrollAreaTestId, "app-scroll-area")
  })
})

describe("LandingHeader", () => {
  it("mantém navegação responsiva com links fixos", () => {
    assert(landingHeaderClassName.includes("site-header"))
    assert(landingNavClassName.includes("hidden"))
    assert(landingNavClassName.includes("lg:flex"))
    assert(landingNavLinks.length === 4)
  })
})

describe("LandingFooter", () => {
  it("aplica classe fixa e fundos adequados", () => {
    assert(landingFooterClassName.includes("site-footer"))
    assert(landingFooterClassName.includes("bg-footer"))
  })
})

describe("DashboardScrollArea", () => {
  it("fornece container flexível com scroll suave", () => {
    assert.equal(dashboardScrollAreaRole, "region")
    assert(dashboardScrollAreaClassName.includes("overflow-y-auto"))
    assert(dashboardScrollAreaClassName.includes("flex"))
    assert.equal(dashboardScrollAreaStyle.WebkitOverflowScrolling, "touch")
    assert.equal(dashboardScrollAreaLabel, "Conteúdo da dashboard")
    assert.equal(dashboardScrollAreaTestId, "dashboard-scroll-area")
  })
})

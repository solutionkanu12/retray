import assert from "node:assert/strict"
import test from "node:test"

import {
  heroEyebrow,
  landingSectionIds,
  loopSteps,
  mayaReturnStory,
  navigationTargets,
  primaryCtaTargets,
} from "../lib/landing-model.ts"

test("every landing navigation destination resolves to a declared section", () => {
  const sectionIds = new Set(landingSectionIds)

  assert.equal(landingSectionIds.length, 9)
  for (const target of [...navigationTargets, ...primaryCtaTargets]) {
    assert.equal(sectionIds.has(target), true, `Missing landing section: ${target}`)
  }
})

test("landing section anchors are unique", () => {
  assert.equal(new Set(landingSectionIds).size, landingSectionIds.length)
})

test("the hero eyebrow visibly frames the landing page as a prototype demo", () => {
  assert.equal(heroEyebrow, "Reusable packaging infrastructure. Prototype demo")
})

test("every loop step mentioning the deposit frames it as simulated", () => {
  const depositSteps = loopSteps.filter((step) => /deposit/i.test(step.copy))

  assert.equal(depositSteps.length > 0, true)
  for (const step of depositSteps) {
    assert.match(step.copy, /demo/i, `Loop step "${step.verb}" must frame the deposit action as a demo`)
  }
})

test("no loop step claims a real scan or hardware read", () => {
  for (const step of loopSteps) {
    assert.doesNotMatch(step.copy, /\bscans\b|\breads\b/i)
  }
})

test("the Maya return story frames the deposit release as a demo without changing the product facts", () => {
  assert.match(mayaReturnStory, /demo/i)
  assert.match(mayaReturnStory, /RT-024/)
  assert.match(mayaReturnStory, /Kora Kitchen/)
  assert.match(mayaReturnStory, /EUR 3\.00/)
})

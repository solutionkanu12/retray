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

test("the hero eyebrow frames the landing page as a working demo", () => {
  assert.equal(heroEyebrow, "Reusable packaging infrastructure. Working demo")
})

test("every loop step mentioning the deposit identifies Paystack TEST behavior", () => {
  const depositSteps = loopSteps.filter((step) => /deposit/i.test(step.copy))

  assert.equal(depositSteps.length > 0, true)
  for (const step of depositSteps) {
    assert.match(step.copy, /Paystack TEST/i, `Loop step "${step.verb}" must name Paystack TEST`)
    assert.doesNotMatch(step.copy, /live money|live payment/i, `Loop step "${step.verb}" must not imply live money`)
  }
})

test("no loop step claims a real scan or hardware read", () => {
  for (const step of loopSteps) {
    assert.doesNotMatch(step.copy, /\bscans\b|\breads\b/i)
  }
})

test("the Maya return story preserves the demo fixture and names Paystack TEST verification", () => {
  assert.match(mayaReturnStory, /demo/i)
  assert.match(mayaReturnStory, /RT-024/)
  assert.match(mayaReturnStory, /Kora Kitchen/)
  assert.match(mayaReturnStory, /EUR 3\.00/)
  assert.match(mayaReturnStory, /Paystack TEST/i)
  assert.match(mayaReturnStory, /provider verification/i)
})

test("the return step limits provider verification to paid and refunded states", () => {
  const returnStep = loopSteps.find((step) => step.verb === "Return")

  assert.equal(returnStep?.copy.includes("paid and refunded states"), true)
})

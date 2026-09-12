import assert from "node:assert/strict"
import test from "node:test"

import { initialLoopState, reduceLoop } from "../lib/retray-state.ts"
import { motionPreferenceToBehavior, primaryEventForView, returnSummary, validateNoInput } from "../lib/journey-model.ts"

test("primary actions advance through the complete return journey", () => {
  let state = reduceLoop(initialLoopState, { type: "OPEN_DASHBOARD" })

  state = reduceLoop(state, primaryEventForView(state.view))
  assert.equal(state.view, "issue-scan")

  state = reduceLoop(state, primaryEventForView(state.view))
  assert.equal(state.view, "return-pass")

  state = reduceLoop(state, primaryEventForView(state.view))
  assert.equal(state.view, "checking")

  state = reduceLoop(state, { type: "RETURN_CONFIRMED" })
  assert.equal(state.view, "success")
})

test("the customer and success screens share one return contract", () => {
  assert.deepEqual(returnSummary, {
    containerId: "RT-024",
    customer: "Maya L.",
    venue: "Kora Kitchen",
    deposit: "EUR 3.00",
    finalStatus: "Ready to wash",
  })
})

test("views without a primary journey action reject accidental advancement", () => {
  assert.throws(() => primaryEventForView("landing"), /no primary journey action/i)
  assert.throws(() => primaryEventForView("success"), /no primary journey action/i)
})

test("page tools reject unexpected input before changing the visible journey", () => {
  assert.deepEqual(validateNoInput({}), {})
  assert.throws(() => validateNoInput({ containerId: "RT-999" }), /does not accept input/i)
  assert.throws(() => validateNoInput(null), /empty object/i)
})

test("reduced motion disables scripted smooth scrolling", () => {
  assert.equal(motionPreferenceToBehavior(true), "auto")
  assert.equal(motionPreferenceToBehavior(false), "smooth")
})

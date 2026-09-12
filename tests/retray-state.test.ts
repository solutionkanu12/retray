import assert from "node:assert/strict"
import test from "node:test"

import { initialLoopState, reduceLoop } from "../lib/retray-state.ts"

test("a confirmed return moves RT-024 to washing and updates one circulation", () => {
  const returned = reduceLoop(initialLoopState, { type: "RETURN_CONFIRMED" })

  assert.deepEqual(returned.metrics, {
    containersOut: 17,
    readyToWash: 7,
    packsAvoided: 1285,
  })
  assert.equal(returned.containers[0].id, "RT-024")
  assert.equal(returned.containers[0].status, "Ready to wash")
  assert.equal(returned.depositReleased, true)
})

test("navigation events preserve the confirmed return data", () => {
  const confirmed = reduceLoop(initialLoopState, { type: "RETURN_CONFIRMED" })
  const dashboard = reduceLoop(confirmed, { type: "BACK_TO_DASHBOARD" })

  assert.equal(dashboard.view, "dashboard")
  assert.equal(dashboard.metrics.packsAvoided, 1285)
  assert.equal(dashboard.containers[0].status, "Ready to wash")
})

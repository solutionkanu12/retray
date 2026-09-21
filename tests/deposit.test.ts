import assert from "node:assert/strict"
import test from "node:test"
import { parseExpectedDeposit } from "../lib/deposit.ts"

test("expected deposit defaults to zero and converts exact cents", () => {
  assert.equal(parseExpectedDeposit(""), 0)
  assert.equal(parseExpectedDeposit("3.00"), 300)
  assert.equal(parseExpectedDeposit("0.25"), 25)
})

test("expected deposit rejects negative, excessive, and imprecise values", () => {
  for (const value of ["-1", "1.234", "NaN", "10000", "1e2"]) {
    assert.throws(() => parseExpectedDeposit(value), /deposit/i)
  }
})

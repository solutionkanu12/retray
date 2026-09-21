import assert from "node:assert/strict"
import test from "node:test"

import {
  assertConsumerAccess,
  assertBorrowReturnAccess,
  assertVenueAccess,
  transitionContainer,
} from "../lib/circulation-domain.ts"

test("circulation follows the complete persisted lifecycle", () => {
  assert.equal(transitionContainer("available", "issued"), "borrowed")
  assert.equal(transitionContainer("borrowed", "returned"), "returned")
  assert.equal(
    transitionContainer("returned", "ready_to_wash"),
    "ready_to_wash",
  )
  assert.equal(transitionContainer("ready_to_wash", "washed"), "available")
})

test("only the borrower can return an active borrow", () => {
  assert.doesNotThrow(() => assertBorrowReturnAccess({ id: "consumer-1", accountType: "consumer" }, "consumer-1", "active"))
  assert.throws(() => assertBorrowReturnAccess({ id: "consumer-2", accountType: "consumer" }, "consumer-1", "active"), /another consumer/i)
  assert.throws(() => assertBorrowReturnAccess({ id: "consumer-1", accountType: "consumer" }, "consumer-1", "returned"), /already returned/i)
  assert.throws(() => assertBorrowReturnAccess({ id: "operator-1", accountType: "business_operator" }, "consumer-1", "active"), /consumer account/i)
})

test("circulation rejects skipped and repeated transitions", () => {
  assert.throws(
    () => transitionContainer("available", "returned"),
    /cannot move from available with returned/i,
  )
  assert.throws(
    () => transitionContainer("borrowed", "issued"),
    /cannot move from borrowed with issued/i,
  )
  assert.throws(
    () => transitionContainer("ready_to_wash", "returned"),
    /cannot move from ready_to_wash with returned/i,
  )
})

test("only a business operator who owns a venue can mutate it", () => {
  assert.doesNotThrow(() =>
    assertVenueAccess(
      { id: "operator-1", accountType: "business_operator" },
      "operator-1",
    ),
  )
  assert.throws(
    () =>
      assertVenueAccess(
        { id: "consumer-1", accountType: "consumer" },
        "consumer-1",
      ),
    /business operator/i,
  )
  assert.throws(
    () =>
      assertVenueAccess(
        { id: "operator-2", accountType: "business_operator" },
        "operator-1",
      ),
    /does not belong/i,
  )
})

test("a consumer can read only their own borrow ledger", () => {
  assert.doesNotThrow(() =>
    assertConsumerAccess(
      { id: "consumer-1", accountType: "consumer" },
      "consumer-1",
    ),
  )
  assert.throws(
    () =>
      assertConsumerAccess(
        { id: "consumer-1", accountType: "consumer" },
        "consumer-2",
      ),
    /another consumer/i,
  )
  assert.throws(
    () =>
      assertConsumerAccess(
        { id: "operator-1", accountType: "business_operator" },
        "operator-1",
      ),
    /consumer account/i,
  )
})

import assert from "node:assert/strict"
import test from "node:test"
import { assertConsumerMayInitializePayment } from "../lib/payment-domain.ts"

const ownBorrow = {
  consumerUserId: "consumer-1",
  status: "active" as const,
  depositMinor: 300,
  depositCurrency: "NGN",
  depositStatus: "not_collected" as const,
}

test("only the issued consumer may initialize their own NGN deposit payment", () => {
  assert.doesNotThrow(() =>
    assertConsumerMayInitializePayment({ id: "consumer-1", accountType: "consumer" }, ownBorrow),
  )
})

test("cross-account payment attempts are denied", () => {
  assert.throws(
    () => assertConsumerMayInitializePayment({ id: "consumer-2", accountType: "consumer" }, ownBorrow),
    /another consumer/i,
  )
  assert.throws(
    () => assertConsumerMayInitializePayment({ id: "operator-1", accountType: "business_operator" }, ownBorrow),
    /consumer account/i,
  )
})

test("historical EUR deposits cannot start a Paystack checkout", () => {
  assert.throws(
    () => assertConsumerMayInitializePayment(
      { id: "consumer-1", accountType: "consumer" },
      { ...ownBorrow, depositCurrency: "EUR" },
    ),
    /naira|ngn|test-mode/i,
  )
})

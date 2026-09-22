import assert from "node:assert/strict"
import test from "node:test"
import { NEW_DEPOSIT_CURRENCY } from "../lib/deposit.ts"
import {
  applyBrowserPaymentCallback,
  createPaymentAttemptDraft,
  paystackInitializeBody,
} from "../lib/payment-domain.ts"

test("new Paystack deposits use NGN consistently", () => {
  assert.equal(NEW_DEPOSIT_CURRENCY, "NGN")
  const draft = createPaymentAttemptDraft({
    borrowId: "borrow-1",
    consumerUserId: "consumer-1",
    depositMinor: 300,
    depositCurrency: "NGN",
  })
  assert.equal(draft.currency, "NGN")
  assert.equal(draft.amountMinor, 300)
  assert.equal(draft.status, "pending")
  assert.match(draft.providerReference, /^retray_[a-z0-9]+$/)
  assert.equal(draft.authorizationUrl, null)
})

test("pending payment attempt exists before hosted checkout is returned", () => {
  const draft = createPaymentAttemptDraft({
    borrowId: "borrow-1",
    consumerUserId: "consumer-1",
    depositMinor: 500,
    depositCurrency: "NGN",
  })
  const body = paystackInitializeBody({
    email: "maya@example.com",
    attempt: draft,
    callbackUrl: "http://127.0.0.1:8787/app/payment/return",
  })
  assert.equal(draft.status, "pending")
  assert.equal(body.reference, draft.providerReference)
  assert.equal(body.amount, 500)
  assert.equal(body.currency, "NGN")
  assert.equal(body.callback_url, "http://127.0.0.1:8787/app/payment/return")
})

test("browser callback cannot mark a deposit paid", () => {
  const pending = {
    attempt: { id: "pay-1", providerReference: "retray_abc", status: "pending" as const, amountMinor: 300, currency: "NGN", consumerUserId: "consumer-1" },
    deposit: { status: "not_collected" as const, currency: "NGN", minor: 300 },
    processedEventDigests: [] as string[],
  }
  assert.deepEqual(applyBrowserPaymentCallback(pending), pending)
})

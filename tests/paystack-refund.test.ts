import assert from "node:assert/strict"
import test from "node:test"

import {
  applyBrowserRefundResponse,
  applyPaystackRefundOutcome,
  assertBusinessMayRequestRefund,
  createPendingRefund,
} from "../lib/payment-domain.ts"
import { createPaystackRefund, paystackEventDigest, verifyPaystackSignature } from "../lib/paystack.ts"

const refundSecret = "sk_test_refund_webhook_secret"
const refundEvent = {
  event: "refund.processed",
  data: {
    transaction_reference: "retray_paid_025",
    refund_reference: "refund_025",
    amount: "100000",
    currency: "NGN",
    status: "processed",
  },
}

const paidReturnedRefundable = {
  venueOwnerUserId: "business-1",
  borrowStatus: "returned" as const,
  depositStatus: "paid" as const,
  payment: {
    id: "payment-025",
    providerReference: "retray_paid_025",
    status: "paid" as const,
    amountMinor: 100000,
    currency: "NGN",
  },
}

function newRefundLedger() {
  return { refundable: paidReturnedRefundable, refund: null, processedEventDigests: [] as string[] }
}

test("only the owning Business may request a refund", () => {
  assert.doesNotThrow(() =>
    assertBusinessMayRequestRefund(
      { id: "business-1", accountType: "business_operator" },
      paidReturnedRefundable,
    ),
  )
})

test("another Business cannot refund a paid returned deposit", () => {
  assert.throws(
    () => assertBusinessMayRequestRefund(
      { id: "business-2", accountType: "business_operator" },
      paidReturnedRefundable,
    ),
    /does not belong/i,
  )
})

test("an unpaid deposit cannot be refunded", () => {
  assert.throws(
    () => assertBusinessMayRequestRefund(
      { id: "business-1", accountType: "business_operator" },
      { ...paidReturnedRefundable, depositStatus: "not_collected" },
    ),
    /paid/i,
  )
})

test("a paid but unreturned container cannot be refunded", () => {
  assert.throws(
    () => assertBusinessMayRequestRefund(
      { id: "business-1", accountType: "business_operator" },
      { ...paidReturnedRefundable, borrowStatus: "active" },
    ),
    /returned/i,
  )
})

test("a paid returned container creates one pending refund before provider work", () => {
  const first = createPendingRefund(newRefundLedger())
  assert.equal(first.created, true)
  assert.equal(first.ledger.refund?.status, "pending")
  assert.equal(first.ledger.refund?.amountMinor, 100000)
  assert.equal(first.ledger.refund?.currency, "NGN")
  assert.equal(first.ledger.refund?.providerReference, null)
})

test("repeated refund clicks create only one refund and provider request", () => {
  const first = createPendingRefund(newRefundLedger())
  const second = createPendingRefund(first.ledger)
  assert.equal(first.created, true)
  assert.equal(second.created, false)
  assert.equal(second.ledger.refund?.id, first.ledger.refund?.id)
})

test("a browser refund response cannot complete a pending refund", () => {
  const pending = createPendingRefund(newRefundLedger()).ledger
  assert.deepEqual(applyBrowserRefundResponse(pending), pending)
})

test("the server sends one Paystack test refund request and keeps its provider identifier", async () => {
  let requestedUrl = ""
  let requestedBody: unknown
  const fetchImpl: typeof fetch = async (input, init) => {
    requestedUrl = String(input)
    requestedBody = JSON.parse(String(init?.body))
    return new Response(JSON.stringify({ status: true, data: { id: 302961, status: "pending" } }), { status: 200 })
  }
  const result = await createPaystackRefund({
    source: { PAYSTACK_SECRET_KEY: "sk_test_refund_request_secret" },
    transactionReference: "retray_paid_025",
    amount: 100000,
    currency: "NGN",
    fetchImpl,
  })
  assert.equal(requestedUrl, "https://api.paystack.co/refund")
  assert.deepEqual(requestedBody, { transaction: "retray_paid_025", amount: 100000, currency: "NGN" })
  assert.equal(result.providerReference, "302961")
  assert.equal(result.status, "pending")
})

test("a valid signed provider refund outcome marks one refund and deposit refunded", async () => {
  const pending = createPendingRefund(newRefundLedger()).ledger
  const rawBody = JSON.stringify(refundEvent)
  const signature = await sign(rawBody, refundSecret)
  assert.equal(await verifyPaystackSignature(rawBody, signature, refundSecret), true)
  const digest = await paystackEventDigest(rawBody)
  const result = applyPaystackRefundOutcome(pending, refundEvent, digest)
  assert.equal(result?.duplicate, false)
  assert.equal(result?.ledger.refund?.status, "refunded")
  assert.equal(result?.ledger.refundable.depositStatus, "refunded")
  assert.deepEqual(result?.ledger.processedEventDigests, [digest])
})

test("an invalid provider event changes no refund state", async () => {
  const pending = createPendingRefund(newRefundLedger()).ledger
  const rawBody = JSON.stringify(refundEvent)
  assert.equal(await verifyPaystackSignature(rawBody, "forged", refundSecret), false)
  const digest = await paystackEventDigest(rawBody)
  const invalid = applyPaystackRefundOutcome(
    pending,
    { ...refundEvent, data: { ...refundEvent.data, transaction_reference: "retray_other" } },
    digest,
  )
  assert.equal(invalid, null)
  assert.equal(pending.refund?.status, "pending")
  assert.equal(pending.refundable.depositStatus, "paid")
})

test("a duplicate provider refund outcome is idempotent", async () => {
  const pending = createPendingRefund(newRefundLedger()).ledger
  const digest = await paystackEventDigest(JSON.stringify(refundEvent))
  const first = applyPaystackRefundOutcome(pending, refundEvent, digest)
  const second = applyPaystackRefundOutcome(first!.ledger, refundEvent, digest)
  assert.equal(second?.duplicate, true)
  assert.equal(second?.ledger.refund?.status, "refunded")
  assert.equal(second?.ledger.refundable.depositStatus, "refunded")
  assert.deepEqual(second?.ledger.processedEventDigests, [digest])
})

async function sign(body: string, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-512" }, false, ["sign"])
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(body)))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

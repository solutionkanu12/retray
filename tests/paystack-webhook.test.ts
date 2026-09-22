import assert from "node:assert/strict"
import test from "node:test"
import {
  applyPaystackChargeSuccess,
  paystackEventDigest,
  verifyPaystackSignature,
} from "../lib/paystack.ts"

const secret = "sk_test_webhook_secret_example"
const rawBody = JSON.stringify({
  event: "charge.success",
  data: {
    id: 302961,
    reference: "retray_abc",
    amount: 300,
    currency: "NGN",
    status: "success",
  },
})

const pending = {
  attempt: {
    id: "pay-1",
    providerReference: "retray_abc",
    status: "pending" as const,
    amountMinor: 300,
    currency: "NGN",
    consumerUserId: "consumer-1",
  },
  deposit: { status: "not_collected" as const, currency: "NGN", minor: 300 },
  processedEventDigests: [] as string[],
}

test("valid signed webhook updates the matching NGN deposit to paid", async () => {
  const signature = await sign(rawBody, secret)
  assert.equal(await verifyPaystackSignature(rawBody, signature, secret), true)
  const digest = await paystackEventDigest(rawBody)
  const result = applyPaystackChargeSuccess(pending, JSON.parse(rawBody), digest)
  assert.equal(result?.duplicate, false)
  assert.equal(result?.ledger.attempt.status, "paid")
  assert.equal(result?.ledger.deposit.status, "paid")
  assert.equal(result?.ledger.deposit.currency, "NGN")
  assert.deepEqual(result?.ledger.processedEventDigests, [digest])
})

test("invalid webhook signature changes no state", async () => {
  assert.equal(await verifyPaystackSignature(rawBody, "deadbeef", secret), false)
  assert.equal(await verifyPaystackSignature(rawBody, await sign(rawBody, "sk_test_other"), secret), false)
})

test("duplicate webhook delivery is idempotent", async () => {
  const event = JSON.parse(rawBody)
  const digest = await paystackEventDigest(rawBody)
  const first = applyPaystackChargeSuccess(pending, event, digest)
  const second = applyPaystackChargeSuccess(first!.ledger, event, digest)
  assert.equal(second?.duplicate, true)
  assert.equal(second?.ledger.attempt.status, "paid")
  assert.equal(second?.ledger.deposit.status, "paid")
  assert.deepEqual(second?.ledger.processedEventDigests, [digest])
})

async function sign(body: string, key: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey("raw", new TextEncoder().encode(key), { name: "HMAC", hash: "SHA-512" }, false, ["sign"])
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, new TextEncoder().encode(body)))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

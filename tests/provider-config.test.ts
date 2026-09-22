import assert from "node:assert/strict"
import test from "node:test"
import { readProviderConfig } from "../lib/provider-config.ts"

test("required provider configuration rejects missing and placeholder values without disclosing them", () => {
  assert.throws(() => readProviderConfig({}, "RESEND_API_KEY"), /configuration unavailable/i)
  assert.throws(() => readProviderConfig({ RESEND_API_KEY: "replace-me" }, "RESEND_API_KEY"), /configuration unavailable/i)
  assert.throws(() => readProviderConfig({ PAYSTACK_SECRET_KEY: "sk_live_private" }, "PAYSTACK_SECRET_KEY"), /test-mode configuration/i)
  assert.equal(readProviderConfig({ PAYSTACK_SECRET_KEY: "sk_test_validexample123456" }, "PAYSTACK_SECRET_KEY"), "sk_test_validexample123456")
})

test("application base URL accepts local HTTP and rejects malformed origins", () => {
  assert.equal(readProviderConfig({ APP_BASE_URL: "http://127.0.0.1:8787" }, "APP_BASE_URL"), "http://127.0.0.1:8787")
  assert.throws(() => readProviderConfig({ APP_BASE_URL: "https://example.com/path" }, "APP_BASE_URL"), /configuration unavailable/i)
})

test("Resend sender accepts a bare address or a display name without disclosing it", () => {
  assert.equal(readProviderConfig({ RESEND_FROM_EMAIL: "retray@useiwa.xyz" }, "RESEND_FROM_EMAIL"), "retray@useiwa.xyz")
  assert.equal(
    readProviderConfig({ RESEND_FROM_EMAIL: "ReTray <retray@useiwa.xyz>" }, "RESEND_FROM_EMAIL"),
    "ReTray <retray@useiwa.xyz>",
  )
  assert.throws(() => readProviderConfig({ RESEND_FROM_EMAIL: "useiwa.xyz" }, "RESEND_FROM_EMAIL"), /configuration unavailable/i)
})

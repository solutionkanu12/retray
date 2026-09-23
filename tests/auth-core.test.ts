import assert from "node:assert/strict"
import test from "node:test"
import { normalizeEmail, createSessionToken, digestSessionToken } from "../lib/auth-core.ts"

test("email normalization rejects malformed addresses and normalizes case", () => {
  assert.equal(normalizeEmail("  OWNER@Example.COM "), "owner@example.com")
  assert.throws(() => normalizeEmail("not-an-email"), /valid email/i)
})

test("sessions store only a digest of a random bearer token", async () => {
  const token = createSessionToken()
  assert.match(token, /^[a-f0-9]{64}$/)
  const digest = await digestSessionToken(token)
  assert.match(digest, /^[a-f0-9]{64}$/)
  assert.notEqual(digest, token)
  assert.notEqual(await digestSessionToken(createSessionToken()), digest)
})

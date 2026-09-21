import assert from "node:assert/strict"
import test from "node:test"
import { hashPassword, normalizeEmail, verifyPassword, createSessionToken, digestSessionToken } from "../lib/auth-core.ts"

test("email normalization rejects malformed addresses and normalizes case", () => {
  assert.equal(normalizeEmail("  OWNER@Example.COM "), "owner@example.com")
  assert.throws(() => normalizeEmail("not-an-email"), /valid email/i)
})

test("password verification accepts the right password and rejects another", async () => {
  const credential = await hashPassword("correct horse battery staple")
  assert.notEqual(credential.passwordHash, "correct horse battery staple")
  assert.equal(await verifyPassword("correct horse battery staple", credential), true)
  assert.equal(await verifyPassword("another wrong password", credential), false)
  await assert.rejects(() => hashPassword("short"), /12 to 128 characters/i)
})

test("sessions store only a digest of a random bearer token", async () => {
  const token = createSessionToken()
  assert.match(token, /^[a-f0-9]{64}$/)
  const digest = await digestSessionToken(token)
  assert.match(digest, /^[a-f0-9]{64}$/)
  assert.notEqual(digest, token)
  assert.notEqual(await digestSessionToken(createSessionToken()), digest)
})

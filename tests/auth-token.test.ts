import assert from "node:assert/strict"
import test from "node:test"
import { consumeOneTimeToken, createOneTimeToken, digestOneTimeToken, isTokenUsable } from "../lib/auth-token.ts"

test("auth links use random URL-safe tokens stored only as SHA-256 digests", async () => {
  const token = createOneTimeToken()
  const digest = await digestOneTimeToken(token)
  assert.match(token, /^[A-Za-z0-9_-]{43}$/)
  assert.match(digest, /^[a-f0-9]{64}$/)
  assert.notEqual(digest, token)
  assert.notEqual(await digestOneTimeToken(createOneTimeToken()), digest)
})

test("expired and consumed auth links cannot be used", () => {
  const now = "2026-09-21T12:00:00.000Z"
  assert.equal(isTokenUsable({ expiresAt: "2026-09-21T12:15:00.000Z", consumedAt: null }, now), true)
  assert.equal(isTokenUsable({ expiresAt: now, consumedAt: null }, now), false)
  assert.equal(isTokenUsable({ expiresAt: "2026-09-21T12:15:00.000Z", consumedAt: now }, now), false)
})

test("consuming an auth link makes a replay ineligible", () => {
  const now = "2026-09-21T12:00:00.000Z"
  const unused = { expiresAt: "2026-09-21T12:15:00.000Z", consumedAt: null }
  const consumed = consumeOneTimeToken(unused, now)
  assert.deepEqual(consumed, { expiresAt: unused.expiresAt, consumedAt: now })
  assert.equal(consumeOneTimeToken(consumed!, now), null)
})

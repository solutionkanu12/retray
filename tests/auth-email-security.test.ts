import assert from "node:assert/strict"
import test from "node:test"
import {
  AUTH_LINK_TTL_MS,
  applyEmailVerification,
  authLinkExpiresAt,
  emailLoginLink,
  GENERIC_SIGN_IN_RECEIPT,
  isEmailLinkPurpose,
  unverifiedSignupFields,
  verificationLink,
} from "../lib/auth-email.ts"
import { sendVerificationEmail, signInEmailText } from "../lib/email-service.ts"
import { SIGN_IN_MAX_ATTEMPTS, recordRateLimitAttempt } from "../lib/rate-limit.ts"

const now = "2026-09-21T12:00:00.000Z"
const later = "2026-09-21T12:15:00.000Z"

test("new signup begins unverified", () => {
  assert.equal(unverifiedSignupFields().emailVerifiedAt, null)
})

test("valid verification consumes the link and verifies the account", () => {
  const result = applyEmailVerification(
    { emailVerifiedAt: null },
    { expiresAt: later, consumedAt: null },
    now,
  )
  assert.deepEqual(result, {
    user: { emailVerifiedAt: now },
    record: { expiresAt: later, consumedAt: now },
  })
})

test("expired verification does not change the account", () => {
  const user = { emailVerifiedAt: null }
  assert.equal(applyEmailVerification(user, { expiresAt: now, consumedAt: null }, now), null)
  assert.equal(user.emailVerifiedAt, null)
})

test("replayed verification does not change the account", () => {
  const user = { emailVerifiedAt: null }
  assert.equal(
    applyEmailVerification(user, { expiresAt: later, consumedAt: now }, now),
    null,
  )
  assert.equal(user.emailVerifiedAt, null)
})

test("email-only sign-in keeps the same response for known and unknown accounts", () => {
  assert.match(GENERIC_SIGN_IN_RECEIPT, /if this email can sign in/i)
  assert.equal(GENERIC_SIGN_IN_RECEIPT, GENERIC_SIGN_IN_RECEIPT)
})

test("repeated sign-in attempts are blocked inside the window", () => {
  let current = null
  for (let attempt = 1; attempt <= SIGN_IN_MAX_ATTEMPTS; attempt += 1) {
    const result = recordRateLimitAttempt(current, {
      keyDigest: "abc",
      action: "sign_in",
      now,
    })
    assert.equal(result.allowed, true)
    current = result.record
  }
  assert.equal(recordRateLimitAttempt(current, { keyDigest: "abc", action: "sign_in", now }).allowed, false)
  assert.equal(
    recordRateLimitAttempt(current, { keyDigest: "abc", action: "sign_in", now: "2026-09-21T12:15:01.000Z" }).allowed,
    true,
  )
})

test("verification links use APP_BASE_URL and expire after 15 minutes", () => {
  assert.equal(AUTH_LINK_TTL_MS, 15 * 60 * 1000)
  assert.equal(authLinkExpiresAt(Date.parse(now)), later)
  assert.equal(
    verificationLink("http://127.0.0.1:8787", "token-value"),
    "http://127.0.0.1:8787/api/auth/link?token=token-value&purpose=verification",
  )
})

test("email sign-in links use a separate explicit purpose", () => {
  assert.equal(isEmailLinkPurpose("verification"), true)
  assert.equal(isEmailLinkPurpose("sign_in"), true)
  assert.equal(isEmailLinkPurpose("password_reset"), false)
  assert.equal(
    emailLoginLink("http://127.0.0.1:8787", "token-value"),
    "http://127.0.0.1:8787/api/auth/link?token=token-value&purpose=sign_in",
  )
  assert.match(signInEmailText("http://127.0.0.1:8787", "token-value"), /purpose=sign_in/)
})

test("passwordless signup sends one Resend verification email without exposing provider secrets", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = []
  await sendVerificationEmail({
    source: {
      RESEND_API_KEY: "re_testkey123456",
      RESEND_FROM_EMAIL: "retray@example.com",
      APP_BASE_URL: "http://127.0.0.1:8787",
    },
    to: "maya@example.com",
    token: "token-value",
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init: init ?? {} })
      return new Response("{}", { status: 200 })
    },
  })
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, "https://api.resend.com/emails")
  const headers = new Headers(calls[0].init.headers)
  assert.equal(headers.get("authorization"), "Bearer re_testkey123456")
  const body = JSON.parse(String(calls[0].init.body))
  assert.equal(body.from, "retray@example.com")
  assert.deepEqual(body.to, ["maya@example.com"])
  assert.equal(body.subject, "Verify your ReTray account")
  assert.match(body.text, /http:\/\/127\.0\.0\.1:8787\/api\/auth\/link\?token=token-value&purpose=verification/)

  await assert.rejects(
    () => sendVerificationEmail({
      source: { RESEND_API_KEY: "replace-me", RESEND_FROM_EMAIL: "retray@example.com", APP_BASE_URL: "http://127.0.0.1:8787" },
      to: "maya@example.com",
      token: "token-value",
    }),
    /configuration unavailable/i,
  )
})

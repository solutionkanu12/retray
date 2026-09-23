import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

import {
  applyGoogleOAuthState,
  googleAuthorizationUrl,
  resolveGoogleAccount,
  validateGoogleIdentity,
} from "../lib/google-oauth.ts"

const source = {
  APP_BASE_URL: "https://retray.solutiono1.workers.dev",
  GOOGLE_CLIENT_ID: "1234567890-example.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: "google-client-secret-for-test-only",
}

test("Google OAuth uses the deployed callback URL and a server-side authorization code flow", () => {
  const url = new URL(googleAuthorizationUrl(source, "state-value", "nonce-value"))
  assert.equal(url.origin, "https://accounts.google.com")
  assert.equal(url.pathname, "/o/oauth2/v2/auth")
  assert.equal(url.searchParams.get("redirect_uri"), "https://retray.solutiono1.workers.dev/api/auth/google/callback")
  assert.equal(url.searchParams.get("response_type"), "code")
  assert.equal(url.searchParams.get("state"), "state-value")
  assert.equal(url.searchParams.get("nonce"), "nonce-value")
  assert.equal(url.searchParams.get("scope"), "openid email profile")
})

test("tampered, expired, and replayed OAuth state is rejected before sign-in", async () => {
  const record = {
    stateDigest: await digest("correct-state"),
    nonceDigest: await digest("nonce-value"),
    expiresAt: "2026-09-23T12:15:00.000Z",
    consumedAt: null,
  }
  assert.equal(await applyGoogleOAuthState(record, "wrong-state", "2026-09-23T12:00:00.000Z"), null)
  assert.equal(await applyGoogleOAuthState({ ...record, expiresAt: "2026-09-23T12:00:00.000Z" }, "correct-state", "2026-09-23T12:00:00.000Z"), null)
  assert.equal(await applyGoogleOAuthState({ ...record, consumedAt: "2026-09-23T12:01:00.000Z" }, "correct-state", "2026-09-23T12:00:00.000Z"), null)
})

test("Google identity requires the configured audience, verified email, issuer, expiry, and nonce", async () => {
  const nonceDigest = await digest("nonce-value")
  const valid = await validateGoogleIdentity({
    aud: source.GOOGLE_CLIENT_ID,
    iss: "https://accounts.google.com",
    exp: "1800000000",
    email: "MAYA@EXAMPLE.COM",
    email_verified: "true",
    sub: "google-subject-1",
    nonce: "nonce-value",
    name: "Maya L.",
  }, source.GOOGLE_CLIENT_ID, nonceDigest, "2026-09-23T12:00:00.000Z")
  assert.deepEqual(valid, { email: "maya@example.com", subject: "google-subject-1", displayName: "Maya L." })

  await assert.rejects(
    () => validateGoogleIdentity({ ...valid, aud: "another-client", nonce: "nonce-value", exp: "1800000000", iss: "accounts.google.com", email_verified: true }, source.GOOGLE_CLIENT_ID, nonceDigest, "2026-09-23T12:00:00.000Z"),
    /Google identity could not be verified/i,
  )
  await assert.rejects(
    () => validateGoogleIdentity({ ...valid, aud: source.GOOGLE_CLIENT_ID, nonce: "tampered", exp: "1800000000", iss: "accounts.google.com", email_verified: true }, source.GOOGLE_CLIENT_ID, nonceDigest, "2026-09-23T12:00:00.000Z"),
    /Google identity could not be verified/i,
  )
})

test("the authorization code is exchanged server-side and its Google result is validated", async () => {
  const nonce = "nonce-value"
  const idToken = `header.${base64Url({ nonce, name: "Maya L." })}.signature`
  const calls: Array<{ url: string; init?: RequestInit }> = []
  const { exchangeGoogleAuthorizationCode } = await import("../lib/google-oauth.ts")
  const identity = await exchangeGoogleAuthorizationCode({
    code: "server-side-code",
    source,
    nonceDigest: await digest(nonce),
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init })
      if (String(url) === "https://oauth2.googleapis.com/token") {
        return new Response(JSON.stringify({ id_token: idToken }), { status: 200 })
      }
      return new Response(JSON.stringify({
        aud: source.GOOGLE_CLIENT_ID,
        iss: "accounts.google.com",
        exp: "1800000000",
        email: "maya@example.com",
        email_verified: "true",
        sub: "google-subject-1",
      }), { status: 200 })
    },
  })
  assert.deepEqual(identity, { email: "maya@example.com", subject: "google-subject-1", displayName: "Maya L." })
  assert.equal(calls.length, 2)
  assert.equal(calls[0].url, "https://oauth2.googleapis.com/token")
  assert.match(String(calls[0].init?.body), /grant_type=authorization_code/)
  assert.match(String(calls[0].init?.body), /redirect_uri=https%3A%2F%2Fretray.solutiono1.workers.dev%2Fapi%2Fauth%2Fgoogle%2Fcallback/)
})

test("a verified Google email links an existing account without changing its role", () => {
  const existing = { id: "business-1", email: "owner@example.com", accountType: "business_operator" as const }
  const result = resolveGoogleAccount({ linkedUser: null, emailUser: existing, signUp: { accountType: "consumer", venueName: null } })
  assert.deepEqual(result, { action: "link_existing", user: existing })
})

test("a linked Google identity and a matching email both resolve to one existing account", () => {
  const existing = { id: "consumer-1", email: "maya@example.com", accountType: "consumer" as const }
  assert.deepEqual(
    resolveGoogleAccount({ linkedUser: existing, emailUser: existing, signUp: { accountType: "consumer", venueName: null } }),
    { action: "use_linked", user: existing },
  )
})

test("a new Google account follows the selected ReTray role and venue model", () => {
  assert.deepEqual(
    resolveGoogleAccount({
      linkedUser: null,
      emailUser: null,
      signUp: { accountType: "business_operator", venueName: "Kora Kitchen" },
    }),
    { action: "create", accountType: "business_operator", venueName: "Kora Kitchen" },
  )
})

test("the callback has no open redirect and preserves protected app access", async () => {
  const [callback, appPage] = await Promise.all([
    readFile(new URL("../app/api/auth/google/callback/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/app/page.tsx", import.meta.url), "utf8"),
  ])
  assert.match(callback, /consumeGoogleOAuthState/)
  assert.match(callback, /exchangeGoogleAuthorizationCode/)
  assert.match(callback, /new URL\("\/app", request\.url\)/)
  assert.doesNotMatch(callback, /searchParams\.get\("(?:next|redirect|returnTo)"\)/)
  assert.match(appPage, /requireVerifiedUser/)
})

async function digest(value: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

function base64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString("base64url")
}

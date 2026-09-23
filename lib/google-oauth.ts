import { normalizeEmail } from "./auth-core.ts"
import { digestOneTimeToken } from "./auth-token.ts"
import { readProviderConfig } from "./provider-config.ts"

export const GOOGLE_OAUTH_STATE_TTL_MS = 15 * 60 * 1000

export type GoogleOAuthIntent = "sign_in" | "sign_up"

export type GoogleOAuthStateRecord = {
  stateDigest: string
  nonceDigest: string
  expiresAt: string
  consumedAt: string | null
}

export type GoogleIdentity = {
  email: string
  subject: string
  displayName: string
}

type ReTrayAccount = {
  id: string
  email: string
  accountType: "consumer" | "business_operator" | null
}

type GoogleSignup = {
  accountType: "consumer" | "business_operator"
  venueName: string | null
}

export function googleCallbackUrl(source: Record<string, unknown>): string {
  const baseUrl = readProviderConfig(source, "APP_BASE_URL")
  return new URL("/api/auth/google/callback", `${baseUrl}/`).toString()
}

export function googleAuthorizationUrl(
  source: Record<string, unknown>,
  state: string,
  nonce: string,
): string {
  const clientId = readProviderConfig(source, "GOOGLE_CLIENT_ID")
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", googleCallbackUrl(source))
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", "openid email profile")
  url.searchParams.set("state", state)
  url.searchParams.set("nonce", nonce)
  url.searchParams.set("prompt", "select_account")
  return url.toString()
}

export function googleOAuthStateExpiresAt(nowMs = Date.now()): string {
  return new Date(nowMs + GOOGLE_OAUTH_STATE_TTL_MS).toISOString()
}

export async function applyGoogleOAuthState(
  record: GoogleOAuthStateRecord,
  state: string,
  now: string,
): Promise<GoogleOAuthStateRecord | null> {
  if (!state || record.consumedAt || record.expiresAt <= now) return null
  const stateDigest = await digestOneTimeToken(state)
  if (!sameDigest(stateDigest, record.stateDigest)) return null
  return { ...record, consumedAt: now }
}

export async function exchangeGoogleAuthorizationCode(input: {
  code: string
  source: Record<string, unknown>
  nonceDigest: string
  fetchImpl?: typeof fetch
}): Promise<GoogleIdentity> {
  if (!input.code) throw unavailable()
  const fetchImpl = input.fetchImpl ?? fetch
  const clientId = readProviderConfig(input.source, "GOOGLE_CLIENT_ID")
  const clientSecret = readProviderConfig(input.source, "GOOGLE_CLIENT_SECRET")
  const tokenResponse = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: googleCallbackUrl(input.source),
      grant_type: "authorization_code",
    }),
  })
  const tokenPayload = await jsonRecord(tokenResponse)
  const idToken = stringField(tokenPayload, "id_token")
  if (!tokenResponse.ok || !idToken) throw unavailable()

  const verificationResponse = await fetchImpl(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  )
  const verifiedClaims = await jsonRecord(verificationResponse)
  if (!verificationResponse.ok) throw unavailable()
  const tokenClaims = decodeJwtClaims(idToken)
  const claims = {
    ...tokenClaims,
    ...verifiedClaims,
    nonce: stringField(verifiedClaims, "nonce") || stringField(tokenClaims, "nonce"),
    name: stringField(verifiedClaims, "name") || stringField(tokenClaims, "name"),
  }
  return validateGoogleIdentity(claims, clientId, input.nonceDigest, new Date().toISOString())
}

export async function validateGoogleIdentity(
  claims: Record<string, unknown>,
  clientId: string,
  nonceDigest: string,
  now: string,
): Promise<GoogleIdentity> {
  const issuer = stringField(claims, "iss")
  const audience = stringField(claims, "aud")
  const email = stringField(claims, "email")
  const subject = stringField(claims, "sub")
  const nonce = stringField(claims, "nonce")
  const expiresAt = Number(stringField(claims, "exp"))
  const emailVerified = claims.email_verified === true || claims.email_verified === "true"
  if (
    audience !== clientId
    || !["accounts.google.com", "https://accounts.google.com"].includes(issuer)
    || !Number.isFinite(expiresAt)
    || expiresAt * 1000 <= Date.parse(now)
    || !emailVerified
    || !subject
    || subject.length > 255
    || !nonce
    || !sameDigest(await digestOneTimeToken(nonce), nonceDigest)
  ) {
    throw unavailable()
  }
  try {
    const normalizedEmail = normalizeEmail(email)
    return {
      email: normalizedEmail,
      subject,
      displayName: displayNameFromGoogle(stringField(claims, "name"), normalizedEmail),
    }
  } catch {
    throw unavailable()
  }
}

export function resolveGoogleAccount(input: {
  linkedUser: ReTrayAccount | null
  emailUser: ReTrayAccount | null
  signUp: GoogleSignup
}):
  | { action: "use_linked"; user: ReTrayAccount }
  | { action: "link_existing"; user: ReTrayAccount }
  | { action: "create"; accountType: GoogleSignup["accountType"]; venueName: string | null } {
  if (input.linkedUser) return { action: "use_linked", user: input.linkedUser }
  if (input.emailUser) return { action: "link_existing", user: input.emailUser }
  return { action: "create", accountType: input.signUp.accountType, venueName: input.signUp.venueName }
}

function stringField(value: Record<string, unknown>, key: string): string {
  const field = value[key]
  return typeof field === "string" ? field : ""
}

async function jsonRecord(response: Response): Promise<Record<string, unknown>> {
  try {
    const value: unknown = await response.json()
    return value && typeof value === "object" ? value as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

function decodeJwtClaims(idToken: string): Record<string, unknown> {
  const payload = idToken.split(".")[1]
  if (!payload) return {}
  try {
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")
    const value: unknown = JSON.parse(atob(padded))
    return value && typeof value === "object" ? value as Record<string, unknown> : {}
  } catch {
    return {}
  }
}

function displayNameFromGoogle(name: string, email: string): string {
  const clean = name.trim()
  if (clean && clean.length <= 80) return clean
  return email.split("@", 1)[0] || "ReTray account"
}

function sameDigest(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let different = 0
  for (let index = 0; index < left.length; index += 1) different |= left.charCodeAt(index) ^ right.charCodeAt(index)
  return different === 0
}

function unavailable(): Error {
  return new Error("Google identity could not be verified.")
}

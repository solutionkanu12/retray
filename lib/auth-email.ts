import { consumeOneTimeToken } from "./auth-token.ts"

export const AUTH_LINK_TTL_MS = 15 * 60 * 1000
export const GENERIC_SIGN_IN_RECEIPT =
  "If this email can sign in, a link will arrive shortly."
export const AUTH_LINK_INVALID = "This link is no longer valid."
export const VERIFY_EMAIL_REQUIRED = "Verify your email to continue."

export type EmailLinkPurpose = "verification" | "sign_in"

export function unverifiedSignupFields(): { emailVerifiedAt: null } {
  return { emailVerifiedAt: null }
}

export function isEmailVerified(user: { emailVerifiedAt: string | null }): boolean {
  return Boolean(user.emailVerifiedAt)
}

export function authLinkExpiresAt(nowMs = Date.now()): string {
  return new Date(nowMs + AUTH_LINK_TTL_MS).toISOString()
}

export function verificationLink(baseUrl: string, token: string): string {
  return emailLink(baseUrl, token, "verification")
}

export function emailLoginLink(baseUrl: string, token: string): string {
  return emailLink(baseUrl, token, "sign_in")
}

export function isEmailLinkPurpose(value: string | null | undefined): value is EmailLinkPurpose {
  return value === "verification" || value === "sign_in"
}

function emailLink(baseUrl: string, token: string, purpose: EmailLinkPurpose): string {
  const url = new URL("/api/auth/link", `${baseUrl}/`)
  url.searchParams.set("token", token)
  url.searchParams.set("purpose", purpose)
  return url.toString()
}

export function applyEmailVerification<
  U extends { emailVerifiedAt: string | null },
  R extends { expiresAt: string; consumedAt: string | null },
>(user: U, record: R, now: string): { user: U; record: R } | null {
  const consumed = consumeOneTimeToken(record, now)
  if (!consumed) return null
  return {
    user: { ...user, emailVerifiedAt: user.emailVerifiedAt ?? now },
    record: consumed,
  }
}

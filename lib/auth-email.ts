import { consumeOneTimeToken } from "./auth-token.ts"

export const AUTH_LINK_TTL_MS = 15 * 60 * 1000
export const GENERIC_PASSWORD_RESET_RECEIPT =
  "If that email is registered, a reset link will be sent."
export const GENERIC_SIGN_IN_ERROR = "Email or password is incorrect."
export const AUTH_LINK_INVALID = "This link is no longer valid."
export const VERIFY_EMAIL_REQUIRED = "Verify your email to continue."

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
  const url = new URL("/verify", `${baseUrl}/`)
  url.searchParams.set("token", token)
  return url.toString()
}

export function passwordResetLink(baseUrl: string, token: string): string {
  const url = new URL("/reset/confirm", `${baseUrl}/`)
  url.searchParams.set("token", token)
  return url.toString()
}

export function passwordResetReceipt(emailKnown: boolean): string {
  void emailKnown
  return GENERIC_PASSWORD_RESET_RECEIPT
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

export function applyPasswordReset<R extends { expiresAt: string; consumedAt: string | null }>(
  record: R,
  now: string,
): R | null {
  return consumeOneTimeToken(record, now)
}

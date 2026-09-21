export const SIGN_IN_MAX_ATTEMPTS = 5
export const PASSWORD_RESET_MAX_ATTEMPTS = 5
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000

export type RateLimitAction = "sign_in" | "password_reset"

export type RateLimitRecord = {
  keyDigest: string
  action: RateLimitAction
  windowStartedAt: string
  attempts: number
  expiresAt: string
}

export function recordRateLimitAttempt(
  current: RateLimitRecord | null,
  input: {
    keyDigest: string
    action: RateLimitAction
    now: string
    maxAttempts?: number
    windowMs?: number
  },
): { allowed: boolean; record: RateLimitRecord } {
  const maxAttempts = input.maxAttempts ?? (
    input.action === "password_reset" ? PASSWORD_RESET_MAX_ATTEMPTS : SIGN_IN_MAX_ATTEMPTS
  )
  const windowMs = input.windowMs ?? RATE_LIMIT_WINDOW_MS
  const nowMs = Date.parse(input.now)
  const active = current !== null && Date.parse(current.expiresAt) > nowMs
  if (!active) {
    return {
      allowed: true,
      record: {
        keyDigest: input.keyDigest,
        action: input.action,
        windowStartedAt: input.now,
        attempts: 1,
        expiresAt: new Date(nowMs + windowMs).toISOString(),
      },
    }
  }
  if (current.attempts >= maxAttempts) {
    return { allowed: false, record: current }
  }
  return {
    allowed: true,
    record: { ...current, attempts: current.attempts + 1 },
  }
}

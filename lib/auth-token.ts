const encoder = new TextEncoder()

export function createOneTimeToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

export async function digestOneTimeToken(token: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(token)))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export function isTokenUsable(record: { expiresAt: string; consumedAt: string | null }, now: string): boolean {
  return record.consumedAt === null && Number.isFinite(Date.parse(record.expiresAt)) && Date.parse(record.expiresAt) > Date.parse(now)
}

export function consumeOneTimeToken<T extends { expiresAt: string; consumedAt: string | null }>(record: T, now: string): T | null {
  return isTokenUsable(record, now) ? { ...record, consumedAt: now } : null
}

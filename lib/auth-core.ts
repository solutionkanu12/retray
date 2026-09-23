const encoder = new TextEncoder()

export function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase()
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.")
  }
  return email
}

export function createSessionToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)))
}

export async function digestSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token))
  return toHex(new Uint8Array(digest))
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("")
}

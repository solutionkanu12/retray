const PASSWORD_ITERATIONS = 210_000
const encoder = new TextEncoder()

export type PasswordCredential = {
  passwordHash: string
  passwordSalt: string
  passwordIterations: number
}

export function normalizeEmail(value: string): string {
  const email = value.trim().toLowerCase()
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.")
  }
  return email
}

export async function hashPassword(password: string): Promise<PasswordCredential> {
  if (password.length < 12 || password.length > 128) {
    throw new Error("Password must be 12 to 128 characters.")
  }
  const salt = crypto.getRandomValues(new Uint8Array(16))
  return {
    passwordHash: await derivePassword(password, salt, PASSWORD_ITERATIONS),
    passwordSalt: toHex(salt),
    passwordIterations: PASSWORD_ITERATIONS,
  }
}

export async function verifyPassword(password: string, credential: PasswordCredential): Promise<boolean> {
  if (typeof password !== "string" || password.length > 128) return false
  if (!/^[a-f0-9]{32}$/.test(credential.passwordSalt) || !/^[a-f0-9]{64}$/.test(credential.passwordHash)) return false
  if (!Number.isSafeInteger(credential.passwordIterations) || credential.passwordIterations < 100_000) return false
  const actual = await derivePassword(password, fromHex(credential.passwordSalt), credential.passwordIterations)
  let difference = 0
  for (let i = 0; i < actual.length; i += 1) {
    difference |= actual.charCodeAt(i) ^ credential.passwordHash.charCodeAt(i)
  }
  return difference === 0
}

export function createSessionToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)))
}

export async function digestSessionToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(token))
  return toHex(new Uint8Array(digest))
}

async function derivePassword(password: string, salt: Uint8Array, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"])
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" }, key, 256)
  return toHex(new Uint8Array(bits))
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("")
}

function fromHex(value: string): Uint8Array {
  return new Uint8Array(value.match(/../g)!.map((pair) => Number.parseInt(pair, 16)))
}

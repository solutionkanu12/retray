export type ProviderConfigKey =
  | "RESEND_API_KEY"
  | "RESEND_FROM_EMAIL"
  | "PAYSTACK_PUBLIC_KEY"
  | "PAYSTACK_SECRET_KEY"
  | "APP_BASE_URL"
  | "GOOGLE_CLIENT_ID"
  | "GOOGLE_CLIENT_SECRET"

const unavailable = () => new Error("Provider configuration unavailable.")

export function readProviderConfig(source: Record<string, unknown>, name: ProviderConfigKey): string {
  const value = source[name]
  if (typeof value !== "string" || !value.trim()) throw unavailable()
  const clean = value.trim()
  if (/^(your|replace|placeholder|changeme|example)([-_\s]|$)/i.test(clean)) throw unavailable()

  if (name === "PAYSTACK_PUBLIC_KEY" || name === "PAYSTACK_SECRET_KEY") {
    const prefix = name === "PAYSTACK_PUBLIC_KEY" ? "pk_test_" : "sk_test_"
    if (!clean.startsWith(prefix) || clean.length <= prefix.length + 8) {
      throw new Error("Paystack test-mode configuration unavailable.")
    }
  }
  if (name === "RESEND_API_KEY" && (!clean.startsWith("re_") || clean.length < 15)) throw unavailable()
  if (name === "RESEND_FROM_EMAIL" && !isResendFrom(clean)) throw unavailable()
  if (name === "APP_BASE_URL") {
    let url: URL
    try { url = new URL(clean) } catch { throw unavailable() }
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1"
    if ((url.protocol !== "https:" && !(local && url.protocol === "http:")) || url.origin !== clean || url.username || url.password) {
      throw unavailable()
    }
  }
  return clean
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isResendFrom(value: string): boolean {
  const angled = value.match(/^(?:"[^"]+"|[\w .'-]+)\s<([^>]+)>$/)
  return emailPattern.test(angled?.[1] ?? value)
}

export function providerEnv(source: object): Record<string, unknown> {
  const names: ProviderConfigKey[] = [
    "RESEND_API_KEY",
    "RESEND_FROM_EMAIL",
    "PAYSTACK_PUBLIC_KEY",
    "PAYSTACK_SECRET_KEY",
    "APP_BASE_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ]
  const record: Record<string, unknown> = {}
  for (const name of names) {
    const value = Reflect.get(source, name)
    if (typeof value === "string") record[name] = value
  }
  return record
}

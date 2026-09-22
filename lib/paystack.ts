import { applyPaystackChargeSuccess } from "./payment-domain.ts"
import { digestOneTimeToken } from "./auth-token.ts"
import { readProviderConfig } from "./provider-config.ts"

const encoder = new TextEncoder()

export { applyPaystackChargeSuccess }

export async function verifyPaystackSignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  if (!signature || !secret.startsWith("sk_test_")) return false
  const expected = await hmacSha512Hex(secret, rawBody)
  return timingSafeEqual(expected, signature.trim().toLowerCase())
}

export async function paystackEventDigest(rawBody: string): Promise<string> {
  return digestOneTimeToken(rawBody)
}

export async function hmacSha512Hex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"])
  const bytes = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(body)))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

export async function initializePaystackCheckout(input: {
  source: Record<string, unknown>
  email: string
  amount: number
  currency: "NGN"
  reference: string
  callbackUrl: string
  fetchImpl?: typeof fetch
}): Promise<string> {
  const secret = readProviderConfig(input.source, "PAYSTACK_SECRET_KEY")
  const fetchImpl = input.fetchImpl ?? fetch
  let response: Response
  try {
    response = await fetchImpl("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        email: input.email,
        amount: input.amount,
        currency: input.currency,
        reference: input.reference,
        callback_url: input.callbackUrl,
      }),
    })
  } catch {
    throw new Error("Paystack test checkout could not be started.")
  }
  const payload = await response.json().catch(() => null) as { status?: boolean; data?: { authorization_url?: string } } | null
  const url = payload?.data?.authorization_url
  if (!response.ok || !payload?.status || typeof url !== "string" || !url.startsWith("https://")) {
    throw new Error("Paystack test checkout could not be started.")
  }
  return url
}

export async function createPaystackRefund(input: {
  source: Record<string, unknown>
  transactionReference: string
  amount: number
  currency: "NGN"
  fetchImpl?: typeof fetch
}): Promise<{ providerReference: string; status: "pending" }> {
  const secret = readProviderConfig(input.source, "PAYSTACK_SECRET_KEY")
  const fetchImpl = input.fetchImpl ?? fetch
  let response: Response
  try {
    response = await fetchImpl("https://api.paystack.co/refund", {
      method: "POST",
      headers: {
        authorization: `Bearer ${secret}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        transaction: input.transactionReference,
        amount: input.amount,
        currency: input.currency,
      }),
    })
  } catch {
    throw new Error("Paystack test refund could not be requested.")
  }
  const payload = await response.json().catch(() => null) as { status?: boolean; data?: { id?: number | string } } | null
  const providerReference = payload?.data?.id
  if (!response.ok || !payload?.status || (typeof providerReference !== "number" && typeof providerReference !== "string")) {
    throw new Error("Paystack test refund could not be requested.")
  }
  return { providerReference: String(providerReference), status: "pending" }
}

export type PaystackWebhookEvent = {
  event?: string
  data?: {
    id?: number | string
    reference?: string
    transaction_reference?: string
    refund_reference?: string | number | null
    amount?: number | string
    currency?: string
    status?: string
  }
}

export function parsePaystackWebhook(rawBody: string): PaystackWebhookEvent | null {
  try {
    const parsed = JSON.parse(rawBody) as PaystackWebhookEvent
    return parsed && typeof parsed === "object" ? parsed : null
  } catch {
    return null
  }
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let difference = 0
  for (let index = 0; index < left.length; index += 1) {
    difference |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return difference === 0
}

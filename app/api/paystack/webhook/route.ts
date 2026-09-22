import { env } from "cloudflare:workers"
import { applyPaystackWebhook } from "@/lib/retray-data"
import { providerEnv } from "@/lib/provider-config"

export async function POST(request: Request) {
  const signature = request.headers.get("x-paystack-signature") ?? ""
  const rawBody = await request.text()
  try {
    const outcome = await applyPaystackWebhook(rawBody, signature, providerEnv(env))
    return Response.json({ status: true, outcome })
  } catch {
    return new Response("Invalid Paystack webhook signature.", { status: 400 })
  }
}

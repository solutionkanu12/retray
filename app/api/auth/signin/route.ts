import { env } from "cloudflare:workers"
import { NextResponse } from "next/server"
import { requestSignInLink } from "@/lib/auth-data"
import { GENERIC_SIGN_IN_RECEIPT } from "@/lib/auth-email"
import { sendSignInEmail } from "@/lib/email-service"
import { providerEnv } from "@/lib/provider-config"
import { isSameOriginRequest, requestClientIdentity } from "@/lib/request-origin"

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return new Response("Invalid request origin.", { status: 403 })
  const form = await request.formData()
  const email = form.get("email")
  try {
    const account = await requestSignInLink(
      typeof email === "string" ? email : "",
      requestClientIdentity(request),
    )
    if (account) {
      await sendSignInEmail({
        source: providerEnv(env),
        to: account.email,
        token: account.token,
      })
    }
  } catch {
    // The generic response intentionally does not reveal account or provider state.
  }
  const destination = new URL("/sign-in", request.url)
  destination.searchParams.set("notice", GENERIC_SIGN_IN_RECEIPT)
  return NextResponse.redirect(destination, 303)
}

import { env } from "cloudflare:workers"
import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth-data"
import { VERIFY_EMAIL_REQUIRED } from "@/lib/auth-email"
import { providerEnv } from "@/lib/provider-config"
import { initializeDepositCheckout } from "@/lib/retray-data"
import { isSameOriginRequest } from "@/lib/request-origin"

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return new Response("Invalid request origin.", { status: 403 })
  const token = request.headers.get("cookie")?.match(/(?:^|;\s*)retray_session=([a-f0-9]{64})(?:;|$)/)?.[1]
  const user = await getSessionUser(token)
  if (!user) return NextResponse.redirect(new URL("/sign-in", request.url), 303)
  if (!user.emailVerifiedAt) return NextResponse.redirect(new URL("/verify", request.url), 303)
  const form = await request.formData()
  const borrowId = form.get("borrowId")
  try {
    const authorizationUrl = await initializeDepositCheckout(
      user,
      typeof borrowId === "string" ? borrowId : "",
      providerEnv(env),
    )
    return NextResponse.redirect(authorizationUrl, 303)
  } catch (error) {
    const destination = new URL("/app", request.url)
    destination.searchParams.set(
      "error",
      error instanceof Error && error.message === VERIFY_EMAIL_REQUIRED
        ? error.message
        : error instanceof Error
          ? error.message
          : "Paystack test checkout could not be started.",
    )
    return NextResponse.redirect(destination, 303)
  }
}

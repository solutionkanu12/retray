import { env } from "cloudflare:workers"
import { NextResponse } from "next/server"
import { getSessionUser, issueVerificationToken } from "@/lib/auth-data"
import { sendVerificationEmail } from "@/lib/email-service"
import { providerEnv } from "@/lib/provider-config"
import { isSameOriginRequest } from "@/lib/request-origin"

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return new Response("Invalid request origin.", { status: 403 })
  const token = request.headers.get("cookie")?.match(/(?:^|;\s*)retray_session=([a-f0-9]{64})(?:;|$)/)?.[1]
  const user = await getSessionUser(token)
  const destination = new URL("/verify", request.url)
  if (!user) {
    destination.searchParams.set("error", "Sign in to continue.")
    return NextResponse.redirect(destination, 303)
  }
  if (user.emailVerifiedAt) return NextResponse.redirect(new URL("/app", request.url), 303)
  try {
    const token = await issueVerificationToken(user)
    await sendVerificationEmail({
      source: providerEnv(env),
      to: user.email,
      token,
    })
    destination.searchParams.set("notice", "Check this account email for a verification link.")
  } catch (error) {
    destination.searchParams.set(
      "error",
      error instanceof Error && /configuration unavailable/i.test(error.message)
        ? "Provider configuration unavailable."
        : "Email could not be sent.",
    )
  }
  return NextResponse.redirect(destination, 303)
}

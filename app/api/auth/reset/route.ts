import { env } from "cloudflare:workers"
import { NextResponse } from "next/server"
import { requestPasswordReset } from "@/lib/auth-data"
import { passwordResetReceipt } from "@/lib/auth-email"
import { sendPasswordResetEmail } from "@/lib/email-service"
import { readProviderConfig } from "@/lib/provider-config"
import { isSameOriginRequest, requestClientIdentity } from "@/lib/request-origin"

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return new Response("Invalid request origin.", { status: 403 })
  const form = await request.formData()
  const email = form.get("email")
  const destination = new URL("/reset", request.url)
  const source = env as unknown as Record<string, unknown>
  try {
    readProviderConfig(source, "RESEND_API_KEY")
    readProviderConfig(source, "RESEND_FROM_EMAIL")
    readProviderConfig(source, "APP_BASE_URL")
  } catch {
    destination.searchParams.set("error", "Provider configuration unavailable.")
    return NextResponse.redirect(destination, 303)
  }
  try {
    const reset = await requestPasswordReset(
      typeof email === "string" ? email : "",
      requestClientIdentity(request),
    )
    if (reset) {
      await sendPasswordResetEmail({
        source,
        to: reset.email,
        token: reset.resetToken,
      })
    }
  } catch {
    destination.searchParams.set("notice", passwordResetReceipt(false))
    return NextResponse.redirect(destination, 303)
  }
  destination.searchParams.set("notice", passwordResetReceipt(false))
  return NextResponse.redirect(destination, 303)
}

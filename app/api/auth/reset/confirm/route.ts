import { NextResponse } from "next/server"
import { completePasswordReset } from "@/lib/auth-data"
import { AUTH_LINK_INVALID } from "@/lib/auth-email"
import { isSameOriginRequest } from "@/lib/request-origin"

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return new Response("Invalid request origin.", { status: 403 })
  const form = await request.formData()
  const token = form.get("token")
  const password = form.get("password")
  const tokenValue = typeof token === "string" ? token : ""
  try {
    await completePasswordReset(tokenValue, typeof password === "string" ? password : "")
    const destination = new URL("/sign-in", request.url)
    destination.searchParams.set("notice", "Password updated. Sign in with your new password.")
    return NextResponse.redirect(destination, 303)
  } catch (error) {
    const destination = new URL("/reset/confirm", request.url)
    if (tokenValue) destination.searchParams.set("token", tokenValue)
    const detail = error instanceof Error ? error.message : AUTH_LINK_INVALID
    destination.searchParams.set(
      "error",
      detail === "Password must be 12 to 128 characters." ? detail : AUTH_LINK_INVALID,
    )
    return NextResponse.redirect(destination, 303)
  }
}

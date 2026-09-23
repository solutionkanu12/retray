import { NextResponse } from "next/server"
import { consumeEmailLink } from "@/lib/auth-data"
import { AUTH_LINK_INVALID, isEmailLinkPurpose } from "@/lib/auth-email"
import { SESSION_COOKIE } from "@/lib/auth-session"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get("token") ?? ""
  const purpose = url.searchParams.get("purpose")
  if (!isEmailLinkPurpose(purpose)) return invalidLink(request)
  try {
    const { sessionToken } = await consumeEmailLink(token, purpose)
    const response = NextResponse.redirect(new URL("/app", request.url), 303)
    response.cookies.set(SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: url.protocol === "https:",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    })
    return response
  } catch {
    return invalidLink(request)
  }
}

function invalidLink(request: Request) {
  const destination = new URL("/verify", request.url)
  destination.searchParams.set("error", AUTH_LINK_INVALID)
  return NextResponse.redirect(destination, 303)
}

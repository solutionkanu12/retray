import { NextResponse } from "next/server"
import { signInAccount } from "@/lib/auth-data"
import { GENERIC_SIGN_IN_ERROR } from "@/lib/auth-email"
import { SESSION_COOKIE } from "@/lib/auth-session"
import { isSameOriginRequest, requestClientIdentity } from "@/lib/request-origin"

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return new Response("Invalid request origin.", { status: 403 })
  const form = await request.formData()
  const email = form.get("email")
  const password = form.get("password")
  try {
    const result = await signInAccount(
      typeof email === "string" ? email : "",
      typeof password === "string" ? password : "",
      requestClientIdentity(request),
    )
    const response = NextResponse.redirect(new URL(result.emailVerified ? "/app" : "/verify", request.url), 303)
    response.cookies.set(SESSION_COOKIE, result.sessionToken, {
      httpOnly: true, sameSite: "lax", secure: new URL(request.url).protocol === "https:",
      path: "/", maxAge: 30 * 24 * 60 * 60,
    })
    return response
  } catch {
    const destination = new URL("/sign-in", request.url)
    destination.searchParams.set("error", GENERIC_SIGN_IN_ERROR)
    return NextResponse.redirect(destination, 303)
  }
}

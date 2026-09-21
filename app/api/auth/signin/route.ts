import { NextResponse } from "next/server"
import { signInAccount } from "@/lib/auth-data"
import { SESSION_COOKIE } from "@/lib/auth-session"
import { isSameOriginRequest } from "@/lib/request-origin"

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return new Response("Invalid request origin.", { status: 403 })
  const form = await request.formData()
  const email = form.get("email")
  const password = form.get("password")
  try {
    const token = await signInAccount(typeof email === "string" ? email : "", typeof password === "string" ? password : "")
    const response = NextResponse.redirect(new URL("/app", request.url), 303)
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true, sameSite: "lax", secure: new URL(request.url).protocol === "https:",
      path: "/", maxAge: 30 * 24 * 60 * 60,
    })
    return response
  } catch {
    return NextResponse.redirect(new URL("/sign-in?error=Email+or+password+is+incorrect.", request.url), 303)
  }
}

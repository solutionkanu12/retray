import { NextResponse } from "next/server"
import { registerAccount } from "@/lib/auth-data"
import { SESSION_COOKIE } from "@/lib/auth-session"
import { isSameOriginRequest } from "@/lib/request-origin"

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return new Response("Invalid request origin.", { status: 403 })
  const form = await request.formData()
  try {
    const token = await registerAccount({
      email: field(form, "email"),
      password: field(form, "password"),
      displayName: field(form, "displayName"),
      accountType: field(form, "accountType") as "consumer" | "business_operator",
      venueName: field(form, "venueName"),
    })
    const response = NextResponse.redirect(new URL("/app", request.url), 303)
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true, sameSite: "lax", secure: new URL(request.url).protocol === "https:",
      path: "/", maxAge: 30 * 24 * 60 * 60,
    })
    return response
  } catch (error) {
    const detail = error instanceof Error ? error.message : ""
    const message = /^(Enter a valid email address\.|Password must be 12 to 128 characters\.|Choose an account type\.|Name must be 1 to 80 characters\.|Venue name must be 1 to 80 characters\.|This email is already in use\.)$/.test(detail)
      ? detail
      : "Account could not be created."
    const destination = new URL("/sign-up", request.url)
    destination.searchParams.set("error", message)
    return NextResponse.redirect(destination, 303)
  }
}

function field(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === "string" ? value : ""
}

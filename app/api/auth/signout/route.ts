import { NextResponse } from "next/server"
import { revokeSession } from "@/lib/auth-data"
import { SESSION_COOKIE } from "@/lib/auth-session"
import { isSameOriginRequest } from "@/lib/request-origin"

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return new Response("Invalid request origin.", { status: 403 })
  const token = request.headers.get("cookie")?.match(/(?:^|;\s*)retray_session=([a-f0-9]{64})(?:;|$)/)?.[1]
  await revokeSession(token)
  const response = NextResponse.redirect(new URL("/", request.url), 303)
  response.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 })
  return response
}

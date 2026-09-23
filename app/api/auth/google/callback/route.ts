import { env } from "cloudflare:workers"
import { NextResponse } from "next/server"
import { completeGoogleSignIn, consumeGoogleOAuthState } from "@/lib/auth-data"
import { exchangeGoogleAuthorizationCode } from "@/lib/google-oauth"
import { SESSION_COOKIE } from "@/lib/auth-session"
import { providerEnv } from "@/lib/provider-config"

export async function GET(request: Request) {
  const url = new URL(request.url)
  try {
    const state = await consumeGoogleOAuthState(url.searchParams.get("state") ?? "")
    const code = url.searchParams.get("code")
    if (!code || url.searchParams.has("error")) throw new Error("Google sign-in could not be completed.")
    const identity = await exchangeGoogleAuthorizationCode({
      code,
      source: providerEnv(env),
      nonceDigest: state.nonceDigest,
    })
    const { sessionToken } = await completeGoogleSignIn({ identity, state })
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
    const destination = new URL("/sign-in", request.url)
    destination.searchParams.set("error", "Google sign-in could not be completed.")
    return NextResponse.redirect(destination, 303)
  }
}

import { env } from "cloudflare:workers"
import { NextResponse } from "next/server"
import { beginGoogleOAuth } from "@/lib/auth-data"
import { providerEnv } from "@/lib/provider-config"
import { isSameOriginRequest } from "@/lib/request-origin"

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return new Response("Invalid request origin.", { status: 403 })
  const form = await request.formData()
  const intent = form.get("intent") === "sign_up" ? "sign_up" : "sign_in"
  const destination = new URL(intent === "sign_up" ? "/sign-up" : "/sign-in", request.url)
  try {
    const authorizationUrl = await beginGoogleOAuth({
      source: providerEnv(env),
      intent,
      accountType: field(form, "accountType") as "consumer" | "business_operator",
      venueName: field(form, "venueName"),
    })
    return NextResponse.redirect(authorizationUrl, 303)
  } catch {
    destination.searchParams.set("error", "Google sign-in could not be started.")
    return NextResponse.redirect(destination, 303)
  }
}

function field(form: FormData, name: string): string {
  const value = form.get(name)
  return typeof value === "string" ? value : ""
}

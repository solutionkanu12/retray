import {
  AUTH_LINK_TTL_MS,
  passwordResetLink,
  verificationLink,
} from "./auth-email.ts"
import { readProviderConfig } from "./provider-config.ts"

type EmailSource = Record<string, unknown>
type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

function minutesLabel(): string {
  return `${AUTH_LINK_TTL_MS / 60000}`
}

export function verificationEmailText(baseUrl: string, token: string): string {
  return [
    "Use this link to verify your ReTray email.",
    `It expires in ${minutesLabel()} minutes and can be used once.`,
    "",
    verificationLink(baseUrl, token),
    "",
    "If you did not create this account, ignore this message.",
  ].join("\n")
}

export function passwordResetEmailText(baseUrl: string, token: string): string {
  return [
    "Use this link to choose a new ReTray password.",
    `It expires in ${minutesLabel()} minutes and can be used once.`,
    "",
    passwordResetLink(baseUrl, token),
    "",
    "If you did not request this, ignore this message.",
  ].join("\n")
}

export async function sendVerificationEmail(input: {
  source: EmailSource
  to: string
  token: string
  fetchImpl?: FetchLike
}): Promise<void> {
  const baseUrl = readProviderConfig(input.source, "APP_BASE_URL")
  await sendAccountEmail({
    source: input.source,
    to: input.to,
    subject: "Verify your ReTray account",
    text: verificationEmailText(baseUrl, input.token),
    fetchImpl: input.fetchImpl,
  })
}

export async function sendPasswordResetEmail(input: {
  source: EmailSource
  to: string
  token: string
  fetchImpl?: FetchLike
}): Promise<void> {
  const baseUrl = readProviderConfig(input.source, "APP_BASE_URL")
  await sendAccountEmail({
    source: input.source,
    to: input.to,
    subject: "Reset your ReTray password",
    text: passwordResetEmailText(baseUrl, input.token),
    fetchImpl: input.fetchImpl,
  })
}

export async function sendAccountEmail(input: {
  source: EmailSource
  to: string
  subject: string
  text: string
  fetchImpl?: FetchLike
}): Promise<void> {
  const apiKey = readProviderConfig(input.source, "RESEND_API_KEY")
  const from = readProviderConfig(input.source, "RESEND_FROM_EMAIL")
  readProviderConfig(input.source, "APP_BASE_URL")
  const fetchImpl = input.fetchImpl ?? fetch
  let response: Response
  try {
    response = await fetchImpl("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
      }),
    })
  } catch {
    throw new Error("Email could not be sent.")
  }
  if (!response.ok) throw new Error("Email could not be sent.")
}

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { getSessionUser } from "./auth-data"

export const SESSION_COOKIE = "retray_session"

export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  return getSessionUser(token)
}

export async function requireUser() {
  const user = await currentUser()
  if (!user) redirect("/sign-in")
  return user
}

export async function requireVerifiedUser() {
  const user = await requireUser()
  if (!user.emailVerifiedAt) redirect("/verify")
  return user
}

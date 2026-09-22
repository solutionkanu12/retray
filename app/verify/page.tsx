import Link from "next/link"
import { redirect } from "next/navigation"
import { DismissibleMessage } from "@/components/dismissible-message"
import { ReTrayMark } from "@/components/retray-mark"
import { consumeEmailVerification } from "@/lib/auth-data"
import { AUTH_LINK_INVALID, isEmailVerified } from "@/lib/auth-email"
import { currentUser } from "@/lib/auth-session"

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string; notice?: string }>
}) {
  const params = await searchParams
  if (params.token) {
    try {
      await consumeEmailVerification(params.token)
    } catch {
      redirect(`/verify?error=${encodeURIComponent(AUTH_LINK_INVALID)}`)
    }
    const verifiedUser = await currentUser()
    if (verifiedUser) redirect("/app")
    redirect("/sign-in?notice=Email+verified.+Sign+in+to+continue.")
  }

  const user = await currentUser()
  if (user && isEmailVerified(user)) redirect("/app")

  return (
    <main className="product-shell product-shell--narrow auth-page">
      <Link className="product-brand" href="/"><ReTrayMark className="brand-mark" /><span className="brand-word">ReTray</span></Link>
      <section className="onboarding-panel">
        <p className="eyebrow">Email verification</p>
        <h1>Verify your email to continue.</h1>
        <p>Open the verification link from this account email. The link expires in 15 minutes and can be used once.</p>
        {params.error ? <DismissibleMessage tone="error">{params.error}</DismissibleMessage> : null}
        {params.notice ? <DismissibleMessage>{params.notice}</DismissibleMessage> : null}
        {user ? (
          <form action="/api/auth/verify/resend" className="stacked-form auth-form" method="post">
            <button className="button button--rose" type="submit">Send a new link</button>
          </form>
        ) : (
          <p>Already have a verified account? <Link className="text-link" href="/sign-in">Sign in</Link></p>
        )}
      </section>
    </main>
  )
}

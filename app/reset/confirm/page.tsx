import Link from "next/link"
import { DismissibleMessage } from "@/components/dismissible-message"
import { ReTrayMark } from "@/components/retray-mark"
import { AUTH_LINK_INVALID } from "@/lib/auth-email"

export default async function ResetConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>
}) {
  const { token, error } = await searchParams
  return (
    <main className="product-shell product-shell--narrow auth-page">
      <Link className="product-brand" href="/"><ReTrayMark className="brand-mark" /><span className="brand-word">ReTray</span></Link>
      <section className="onboarding-panel">
        <p className="eyebrow">Password reset</p>
        <h1>Choose a new password.</h1>
        <p>This link expires in 15 minutes and can be used once.</p>
        {error ? <DismissibleMessage tone="error">{error}</DismissibleMessage> : null}
        {!token ? (
          <DismissibleMessage tone="error">{AUTH_LINK_INVALID}</DismissibleMessage>
        ) : (
          <form action="/api/auth/reset/confirm" className="stacked-form auth-form" method="post">
            <input name="token" type="hidden" value={token} />
            <label>New password<input autoComplete="new-password" minLength={12} name="password" required type="password" /><span>Use at least 12 characters.</span></label>
            <button className="button button--rose" type="submit">Save password</button>
          </form>
        )}
        <p><Link className="text-link" href="/sign-in">Sign in</Link></p>
      </section>
    </main>
  )
}

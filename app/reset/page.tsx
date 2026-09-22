import Link from "next/link"
import { DismissibleMessage } from "@/components/dismissible-message"
import { ReTrayMark } from "@/components/retray-mark"

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>
}) {
  const { error, notice } = await searchParams
  return (
    <main className="product-shell product-shell--narrow auth-page">
      <Link className="product-brand" href="/"><ReTrayMark className="brand-mark" /><span className="brand-word">ReTray</span></Link>
      <section className="onboarding-panel">
        <p className="eyebrow">Password reset</p>
        <h1>Reset your password.</h1>
        <p>Enter the email for your ReTray account. If it is registered, a reset link will be sent.</p>
        {error ? <DismissibleMessage tone="error">{error}</DismissibleMessage> : null}
        {notice ? <DismissibleMessage>{notice}</DismissibleMessage> : null}
        <form action="/api/auth/reset" className="stacked-form auth-form" method="post">
          <label>Email<input autoComplete="email" name="email" required type="email" /></label>
          <button className="button button--rose" type="submit">Send reset link</button>
        </form>
        <p>Remembered it? <Link className="text-link" href="/sign-in">Sign in</Link></p>
      </section>
    </main>
  )
}

import Link from "next/link"
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
        {error ? <p className="product-message is-error" role="alert">{error}</p> : null}
        {notice ? <p className="product-message" role="status">{notice}</p> : null}
        <form action="/api/auth/reset" className="stacked-form auth-form" method="post">
          <label>Email<input autoComplete="email" name="email" required type="email" /></label>
          <button className="button button--rose" type="submit">Send reset link</button>
        </form>
        <p>Remembered it? <Link className="text-link" href="/sign-in">Sign in</Link></p>
      </section>
    </main>
  )
}

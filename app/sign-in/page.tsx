import Link from "next/link"
import { DismissibleMessage } from "@/components/dismissible-message"
import { ReTrayMark } from "@/components/retray-mark"

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { error, notice } = await searchParams
  return (
    <main className="product-shell product-shell--narrow auth-page">
      <Link className="product-brand" href="/"><ReTrayMark className="brand-mark" /><span className="brand-word">ReTray</span></Link>
      <section className="onboarding-panel">
        <p className="eyebrow">Account access</p>
        <h1>Sign in to your loop.</h1>
        <p>Enter your account email and we will send a sign-in link.</p>
        {error ? <DismissibleMessage tone="error">{error}</DismissibleMessage> : null}
        {notice ? <DismissibleMessage>{notice}</DismissibleMessage> : null}
        <form action="/api/auth/signin" className="stacked-form auth-form" method="post">
          <label>Email<input autoComplete="email" name="email" required type="email" /></label>
          <button className="button button--rose" type="submit">Email me a sign-in link</button>
        </form>
        <form action="/api/auth/google/start" className="stacked-form auth-form" method="post">
          <input name="intent" type="hidden" value="sign_in" />
          <button className="button button--outline" type="submit">Continue with Google</button>
        </form>
        <p>New to ReTray? <Link className="text-link" href="/sign-up">Create an account</Link></p>
      </section>
    </main>
  )
}

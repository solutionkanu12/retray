import Link from "next/link"
import { DismissibleMessage } from "@/components/dismissible-message"
import { ReTrayMark } from "@/components/retray-mark"

export default async function SignUpPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  return (
    <main className="product-shell product-shell--narrow auth-page">
      <Link className="product-brand" href="/"><ReTrayMark className="brand-mark" /><span className="brand-word">ReTray</span></Link>
      <section className="onboarding-panel">
        <p className="eyebrow">Account setup</p>
        <h1>Start a real loop.</h1>
        <p>Choose your role, then create an account. Business operators also create their first venue.</p>
        {error ? <DismissibleMessage tone="error">{error}</DismissibleMessage> : null}
        <form action="/api/auth/signup" className="stacked-form auth-form" method="post">
          <fieldset className="account-role-options">
            <legend>Account type</legend>
            <label><input defaultChecked name="accountType" type="radio" value="consumer" /> Consumer</label>
            <label><input name="accountType" type="radio" value="business_operator" /> Business operator</label>
          </fieldset>
          <label>Your name<input autoComplete="name" maxLength={80} name="displayName" required /></label>
          <label>Email<input autoComplete="email" name="email" required type="email" /></label>
          <label className="auth-venue-field">Venue name for business operators<input maxLength={80} name="venueName" placeholder="Your venue" /></label>
          <button className="button button--rose" type="submit">Email me a sign-in link</button>
          <button className="button button--outline" formAction="/api/auth/google/start" formNoValidate name="intent" type="submit" value="sign_up">Continue with Google</button>
        </form>
        <p>Already have an account? <Link className="text-link" href="/sign-in">Sign in</Link></p>
      </section>
    </main>
  )
}

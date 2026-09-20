import { chooseAccountTypeAction } from "@/app/app/actions"
import { ReTrayMark } from "@/components/retray-mark"

type AccountOnboardingProps = {
  displayName: string
}

export function AccountOnboarding({ displayName }: AccountOnboardingProps) {
  return (
    <main className="product-shell product-shell--narrow">
      <div className="product-brand"><ReTrayMark className="brand-mark" /><span className="brand-word">ReTray</span></div>
      <section className="onboarding-panel">
        <p className="eyebrow">Account setup</p>
        <h1>Choose how you use ReTray.</h1>
        <p>{displayName}, this choice sets the records and controls available to your account.</p>
        <div className="onboarding-options">
          <form action={chooseAccountTypeAction}>
            <input name="accountType" type="hidden" value="business_operator" />
            <h2>Business operator</h2>
            <p>Create a venue, register containers, and manage each circulation.</p>
            <button className="button button--rose button--full" type="submit">Continue as operator</button>
          </form>
          <form action={chooseAccountTypeAction}>
            <input name="accountType" type="hidden" value="consumer" />
            <h2>Consumer</h2>
            <p>See containers currently borrowed and the truthful deposit ledger state.</p>
            <button className="button button--outline button--full" type="submit">Continue as consumer</button>
          </form>
        </div>
      </section>
    </main>
  )
}

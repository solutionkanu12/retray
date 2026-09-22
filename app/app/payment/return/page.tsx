import Link from "next/link"
import { DismissibleMessage } from "@/components/dismissible-message"
import { ProductHeader } from "@/components/product-header"
import { requireVerifiedUser } from "@/lib/auth-session"

export default async function PaymentReturnPage() {
  const user = await requireVerifiedUser()
  return (
    <div className="product-shell">
      <ProductHeader accountLabel={user.accountType === "business_operator" ? "Operator" : "Consumer"} displayName={user.displayName} />
      <main className="product-main consumer-main">
        <section className="product-intro">
          <div>
            <p className="eyebrow">Paystack test checkout</p>
            <h1>Payment is still pending.</h1>
            <p>The browser return from Paystack does not mark a deposit paid. ReTray waits for a verified Paystack test webhook. This is test money, not a live payment.</p>
          </div>
        </section>
        <DismissibleMessage>No deposit status was changed by this page.</DismissibleMessage>
        <p><Link className="text-link" href="/app">Return to your loop</Link></p>
      </main>
    </div>
  )
}

import { Clock3, PackageOpen } from "lucide-react"

import type { ConsumerBorrow } from "@/lib/retray-data"
import { formatDepositAmount } from "@/lib/deposit"
import { ConsumerReturnScanner } from "@/components/consumer-return-scanner"

type ConsumerDashboardProps = {
  borrows: ConsumerBorrow[]
}

export function ConsumerDashboard({ borrows }: ConsumerDashboardProps) {
  const active = borrows.filter((borrow) => borrow.borrowStatus === "active")
  const returned = borrows.filter((borrow) => borrow.borrowStatus === "returned")

  return (
    <main className="product-main consumer-main">
      <section className="product-intro">
        <div>
          <p className="eyebrow">Consumer account</p>
          <h1>Your borrowed containers.</h1>
          <p>Return status and deposit entries come directly from saved venue circulation records.</p>
        </div>
      </section>

      <ConsumerReturnScanner activeQrIds={active.map((borrow) => borrow.qrId)} />

      <section aria-labelledby="active-borrows-title" className="consumer-section">
        <div className="ledger-heading">
          <div><p className="eyebrow">Current borrows</p><h2 id="active-borrows-title">Still with you</h2></div>
          <span>{active.length} active</span>
        </div>
        {active.length ? active.map((borrow) => <BorrowRow borrow={borrow} key={borrow.id} />) : (
          <p className="empty-product-state">You have no currently borrowed containers.</p>
        )}
      </section>

      <section aria-labelledby="return-history-title" className="consumer-section">
        <div className="ledger-heading">
          <div><p className="eyebrow">Return status</p><h2 id="return-history-title">Recent returns</h2></div>
          <Clock3 aria-hidden="true" size={20} />
        </div>
        {returned.length ? returned.map((borrow) => <BorrowRow borrow={borrow} key={borrow.id} />) : (
          <p className="empty-product-state">No returns have been recorded for this account.</p>
        )}
      </section>
    </main>
  )
}

function BorrowRow({ borrow }: { borrow: ConsumerBorrow }) {
  return (
    <article className="consumer-borrow-row">
      <PackageOpen aria-hidden="true" size={22} />
      <div><span>Container</span><strong>{borrow.containerLabel}</strong><small>QR payload: {borrow.qrId}</small>{borrow.isDemo ? <small>Seeded demo data</small> : null}</div>
      <div><span>Venue</span><strong>{borrow.venueName}</strong></div>
      <div><span>Return status</span><strong>{borrow.borrowStatus === "active" ? "Return active" : "Returned"}</strong></div>
      <div>
        <span>Expected deposit ledger</span>
        <strong>{formatDepositAmount(borrow.depositMinor, borrow.depositCurrency)}</strong>
        <small>{depositNote(borrow)}</small>
        {borrow.borrowStatus === "active" && borrow.depositMinor > 0 && borrow.depositCurrency === "NGN" && borrow.depositStatus !== "paid" ? (
          <form action="/api/paystack/initialize" className="stacked-form" method="post">
            <input name="borrowId" type="hidden" value={borrow.id} />
            <button className="button button--rose" type="submit">Pay test deposit</button>
          </form>
        ) : null}
      </div>
    </article>
  )
}

function depositNote(borrow: ConsumerBorrow): string {
  if (borrow.depositStatus === "paid") return "Paystack test payment recorded. This is test money, not a live payment."
  if (borrow.depositStatus === "return_recorded") return "Return recorded. No payment moved."
  if (borrow.paymentStatus === "pending") return "Paystack test checkout started. Waiting for a verified webhook. The browser return does not mark this paid."
  if (borrow.depositCurrency === "NGN" && borrow.depositMinor > 0) return "NGN Paystack test-mode deposit. Test money only."
  return "Expected amount only. ReTray collected no payment."
}

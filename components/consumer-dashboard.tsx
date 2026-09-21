import { Clock3, PackageOpen } from "lucide-react"

import type { ConsumerBorrow } from "@/lib/retray-data"
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
      <div><span>Expected deposit ledger</span><strong>{formatMoney(borrow.depositMinor, borrow.depositCurrency)}</strong><small>{borrow.depositStatus === "not_collected" ? "Expected amount only. ReTray collected no payment." : "Return recorded. No payment moved."}</small></div>
    </article>
  )
}

function formatMoney(minor: number, currency: string): string {
  return new Intl.NumberFormat("en", { style: "currency", currency }).format(minor / 100)
}

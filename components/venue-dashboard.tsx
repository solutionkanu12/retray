import { Check, PackageOpen, ScanLine, Sparkles } from "lucide-react"

import type { LoopState } from "@/lib/retray-state"

type VenueDashboardProps = {
  state: LoopState
  onScan: () => void
  onOpenPass: () => void
}

export function VenueDashboard({ state, onScan, onOpenPass }: VenueDashboardProps) {
  return (
    <main className="app-main app-view-enter">
      <div className="dashboard-intro">
        <div>
          <p className="eyebrow">Today at Kora Kitchen</p>
          <h1 data-view-heading tabIndex={-1}>Your loop is moving.</h1>
          <p>Know what is out, what came back, and what is ready for another service.</p>
        </div>
        <button className="button button--rose dashboard-scan" onClick={onScan} type="button">
          <ScanLine aria-hidden="true" size={18} /> Scan container
        </button>
      </div>

      {state.returnConfirmed ? (
        <div aria-live="polite" className="update-notice">
          <Check aria-hidden="true" size={18} />
          <span>RT-024 returned. The ledger and venue impact are up to date.</span>
        </div>
      ) : null}

      <section aria-labelledby="metrics-title" className="metrics-ledger">
        <h2 className="sr-only" id="metrics-title">Venue circulation metrics</h2>
        <article>
          <span>Containers out</span>
          <strong>{state.metrics.containersOut}</strong>
          <small>Currently with customers</small>
        </article>
        <article>
          <span>Ready to wash</span>
          <strong>{state.metrics.readyToWash}</strong>
          <small>Returned to the venue</small>
        </article>
        <article>
          <span>Disposable packs avoided</span>
          <strong>{state.metrics.packsAvoided.toLocaleString("en-GB")}</strong>
          <small>One for each completed loop</small>
        </article>
      </section>

      <section aria-labelledby="ledger-title" className="container-ledger">
        <div className="ledger-heading">
          <div>
            <p className="eyebrow">Container ledger</p>
            <h2 id="ledger-title">What is moving now</h2>
          </div>
          <span>3 recent containers</span>
        </div>

        <div className="ledger-table" role="table">
          <div className="ledger-table__header" role="row">
            <span role="columnheader">Container</span>
            <span role="columnheader">Customer</span>
            <span role="columnheader">Status</span>
            <span role="columnheader">Latest event</span>
          </div>
          {state.containers.map((container) => {
            const canOpenPass = container.id === "RT-024" && !state.returnConfirmed

            return (
            <div className={`ledger-row ${canOpenPass ? "ledger-row--active" : ""}`} key={container.id} role="row">
              <span role="cell">
                {canOpenPass ? (
                  <button className="ledger-id-button" onClick={onOpenPass} type="button">
                    <strong>{container.id}</strong><span className="sr-only"> Open Maya&apos;s return pass</span>
                  </button>
                ) : <strong>{container.id}</strong>}
              </span>
              <span role="cell">{container.customer}</span>
              <span className="ledger-status" role="cell">
                {container.status === "Borrowed" ? <PackageOpen aria-hidden="true" size={16} /> : null}
                {container.status === "Returned" ? <Check aria-hidden="true" size={16} /> : null}
                {container.status === "Ready to wash" ? <Sparkles aria-hidden="true" size={16} /> : null}
                {container.status}
              </span>
              <span role="cell">{container.latestEvent}</span>
            </div>
            )
          })}
        </div>
      </section>

      <aside className="demo-note">
        <span>Demo flow</span>
        <p>This prototype simulates issue, return, and deposit release. No hardware scanner or payment service is connected.</p>
      </aside>
    </main>
  )
}

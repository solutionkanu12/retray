import { PackageOpen, Sparkles } from "lucide-react"

import {
  createVenueAction,
  registerContainerAction,
  renameVenueAction,
  requestRefundAction,
} from "@/app/app/actions"
import { CameraScanner } from "@/components/camera-scanner"
import { createQrSvg } from "@/lib/qr-code"
import { formatDepositAmount } from "@/lib/deposit"
import type { OperatorDashboard as OperatorDashboardData } from "@/lib/retray-data"

type OperatorDashboardProps = {
  dashboard: OperatorDashboardData
}

export function OperatorDashboard({ dashboard }: OperatorDashboardProps) {
  return (
    <main className="product-main">
      <section className="product-intro">
        <div>
          <p className="eyebrow">Business operator</p>
          <h1>Your loop is moving.</h1>
          <p>Every count below is calculated from the selected venue&apos;s saved circulation records.</p>
        </div>
        {dashboard.venue?.isDemo ? <span className="demo-data-label">Seeded demo data</span> : null}
      </section>

      <section aria-label="Venue management" className="venue-management">
        {dashboard.venues.length > 1 ? (
          <nav aria-label="Your venues" className="venue-tabs">
            {dashboard.venues.map((venue) => (
              <a aria-current={dashboard.venue?.id === venue.id ? "page" : undefined} href={`/app?venue=${encodeURIComponent(venue.id)}`} key={venue.id}>
                {venue.name}{venue.isDemo ? " · Demo" : ""}
              </a>
            ))}
          </nav>
        ) : null}
        <form action={createVenueAction} className="compact-form">
          <label>Create a venue<input name="name" placeholder="Venue name" required /></label>
          <button className="button button--outline" type="submit">Create venue</button>
        </form>
        {dashboard.venue ? (
          <form action={renameVenueAction} className="compact-form">
            <input name="venueId" type="hidden" value={dashboard.venue.id} />
            <label>Venue name<input defaultValue={dashboard.venue.name} name="name" required /></label>
            <button className="button button--outline" type="submit">Save name</button>
          </form>
        ) : null}
      </section>

      {dashboard.venue ? (
        <>
          <section aria-label="Live venue counts" className="metrics-ledger">
            <article><span>Containers out</span><strong>{dashboard.metrics.containersOut}</strong><small>Currently borrowed</small></article>
            <article><span>Returned</span><strong>{dashboard.metrics.returned}</strong><small>Waiting for wash-ready</small></article>
            <article><span>Ready to wash</span><strong>{dashboard.metrics.readyToWash}</strong><small>At the wash station</small></article>
            <article><span>Packs avoided</span><strong>{dashboard.metrics.packsAvoided}</strong><small>One per recorded return</small></article>
          </section>

          <div className="operator-workspace">
            <CameraScanner
              containers={dashboard.containers.map(({ label, qrId, status }) => ({ label, qrId, status }))}
              venueId={dashboard.venue.id}
            />
            <section aria-labelledby="register-title" className="product-panel">
              <div className="product-panel__heading">
                <div><p className="eyebrow">Container pool</p><h2 id="register-title">Register a container</h2></div>
                <PackageOpen aria-hidden="true" size={24} />
              </div>
              <form action={registerContainerAction} className="stacked-form">
                <input name="venueId" type="hidden" value={dashboard.venue.id} />
                <label>Container ID<input name="label" placeholder="RT-025" required /></label>
                <p>A unique QR ID is generated and saved when the container is registered.</p>
                <button className="button button--rose" type="submit">Register container</button>
              </form>
            </section>
          </div>

          <section aria-labelledby="ledger-title" className="container-ledger product-ledger">
            <div className="ledger-heading">
              <div><p className="eyebrow">Container ledger</p><h2 id="ledger-title">Persisted container records</h2></div>
              <span>{dashboard.containers.length} containers</span>
            </div>
            {dashboard.containers.length ? (
              <div className="product-container-list">
                {dashboard.containers.map((container) => (
                  <article className="product-container-row" key={container.id}>
                    <div className="container-qr" dangerouslySetInnerHTML={{ __html: createQrSvg(container.qrId) }} />
                    <div className="container-identity">
                      <strong>{container.label}</strong>
                      <code>{container.qrId}</code>
                      {container.isDemo ? <span className="demo-data-label">Demo</span> : null}
                    </div>
                    <div><span>Status</span><strong className="status-text"><Sparkles aria-hidden="true" size={15} />{formatStatus(container.status)}</strong></div>
                    <div>
                      <span>Consumer and deposit ledger</span>
                      <strong>{container.customer ?? "None active"}</strong>
                      <small>{depositNote(container)}</small>
                      {container.borrowId && container.borrowStatus === "returned" && container.depositStatus === "paid" && container.paymentStatus === "paid" && container.refundStatus === "none" ? (
                        <form action={requestRefundAction} className="stacked-form">
                          <input name="venueId" type="hidden" value={dashboard.venue?.id ?? ""} />
                          <input name="borrowId" type="hidden" value={container.borrowId} />
                          <button className="button button--outline" type="submit">Request test refund</button>
                        </form>
                      ) : null}
                    </div>
                    <div><span>Latest event</span><strong>{container.latestEvent ? formatStatus(container.latestEvent) : "Registered"}</strong><small>{container.latestEventAt ? formatTime(container.latestEventAt) : "Saved in venue pool"}</small></div>
                  </article>
                ))}
              </div>
            ) : <p className="empty-product-state">No containers are registered at this venue yet.</p>}
          </section>
        </>
      ) : (
        <p className="empty-product-state">Create your first venue to start a container pool.</p>
      )}
    </main>
  )
}

function depositNote(container: OperatorDashboardData["containers"][number]): string {
  if (container.depositMinor === null || !container.depositCurrency) return "No borrow yet"
  const amount = formatDepositAmount(container.depositMinor, container.depositCurrency)
  if (container.depositStatus === "refunded") return `${amount} Paystack test refund recorded`
  if (container.refundStatus === "pending") return `${amount} Paystack test refund requested. Waiting for a verified provider outcome.`
  if (container.refundStatus === "failed") return `${amount} Paystack test refund did not complete`
  if (container.depositStatus === "paid") return `${amount} Paystack test payment recorded`
  if (container.depositStatus === "return_recorded") return `${amount} expected, return recorded`
  return `${amount} expected, not collected by ReTray`
}

function formatStatus(value: string): string {
  const label = value.replaceAll("_", " ")
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

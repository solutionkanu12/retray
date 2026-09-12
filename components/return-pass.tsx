import { ArrowLeft, Clock3, MapPin, ScanLine } from "lucide-react"

import { ReTrayMark } from "@/components/retray-mark"
import { returnSummary } from "@/lib/journey-model"

type ReturnPassProps = {
  onBack: () => void
  onScanReturn: () => void
  checking?: boolean
}

const qrCells = [0,1,2,3,4,6,7,8,10,12,13,14,16,18,20,21,22,24,25,27,28,30,31,32,34,36,38,40,41,42,44,45,46,48]

export function ReturnPass({ onBack, onScanReturn, checking = false }: ReturnPassProps) {
  return (
    <main className="customer-shell app-view-enter">
      <div className="customer-shell__top">
        <button className="back-link" disabled={checking} onClick={onBack} type="button"><ArrowLeft aria-hidden="true" size={17} /> Venue view</button>
        <div className="brand-lockup"><ReTrayMark className="brand-mark" /><span className="brand-word">ReTray</span></div>
      </div>

      <section className="return-pass" aria-busy={checking}>
        <div className="return-pass__venue">
          <span className="micro-label">Return pass</span>
          <strong>{returnSummary.customer}</strong>
        </div>
        <div className="return-pass__message">
          <p className="eyebrow">Borrowed today at 12:42</p>
          <h1 data-view-heading tabIndex={-1}>Bring this back to Kora Kitchen.</h1>
          <p>Your EUR 3.00 deposit is waiting.</p>
        </div>

        <div className="pass-container">
          <div className="pass-container__visual"><ReTrayMark /></div>
          <div><span>Reusable container</span><strong>{returnSummary.containerId}</strong><small>Borrowed · Return active</small></div>
        </div>

        <div className="return-details">
          <div><MapPin aria-hidden="true" size={17} /><span>Return to</span><strong>{returnSummary.venue}</strong></div>
          <div><Clock3 aria-hidden="true" size={17} /><span>Deposit held</span><strong>{returnSummary.deposit}</strong></div>
        </div>

        <div className="qr-action">
          <div aria-hidden="true" className="qr-block">
            {Array.from({ length: 49 }, (_, index) => <i className={qrCells.includes(index) ? "is-filled" : ""} key={index} />)}
          </div>
          <div><span className="micro-label">Return code</span><strong>Show or scan at the return point</strong><p>The demo confirms the return when you continue.</p></div>
        </div>

        <button className="button button--rose button--full" disabled={checking} onClick={onScanReturn} type="button">
          <ScanLine aria-hidden="true" size={19} /> {checking ? "Checking return point" : "Scan return point"}
        </button>
        <p aria-live="polite" className="checking-status">
          {checking ? <><span className="checking-spinner" /> Checking RT-024 at Kora Kitchen</> : "Prototype demo. The deposit release is simulated after the return is confirmed."}
        </p>
      </section>
    </main>
  )
}

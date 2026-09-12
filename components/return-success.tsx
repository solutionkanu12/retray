import { ArrowRight, Check, CircleDollarSign, Sparkles } from "lucide-react"

import { ReTrayMark } from "@/components/retray-mark"
import { returnSummary } from "@/lib/journey-model"

type ReturnSuccessProps = {
  onViewVenue: () => void
}

export function ReturnSuccess({ onViewVenue }: ReturnSuccessProps) {
  return (
    <main className="success-shell app-view-enter">
      <section className="success-panel">
        <p className="sr-only" role="status">Return confirmed. EUR 3.00 released. RT-024 is ready to wash.</p>
        <div className="success-mark" aria-hidden="true">
          <ReTrayMark />
          <span><Check size={25} /></span>
        </div>
        <p className="eyebrow eyebrow--dark">Return confirmed</p>
        <h1 data-view-heading tabIndex={-1}>Returned. Nice one.</h1>
        <p className="success-panel__lede">Your simulated deposit has been released.</p>

        <div className="release-receipt">
          <div className="release-receipt__amount"><CircleDollarSign aria-hidden="true" size={20} /><span>Amount released</span><strong>{returnSummary.deposit}</strong></div>
          <div><span>Container</span><strong>{returnSummary.containerId}</strong></div>
          <div><span>Returned to</span><strong>{returnSummary.venue}</strong></div>
          <div><span>Container status</span><strong><Sparkles aria-hidden="true" size={16} /> {returnSummary.finalStatus}</strong></div>
        </div>

        <p className="success-panel__explain">RT-024 is back in the loop. Kora Kitchen can wash it and issue it again.</p>
        <button className="button button--dark button--full" onClick={onViewVenue} type="button">
          See the updated venue loop <ArrowRight aria-hidden="true" size={18} />
        </button>
      </section>
    </main>
  )
}

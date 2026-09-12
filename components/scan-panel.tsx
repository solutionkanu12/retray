import { ArrowLeft, ArrowRight, ScanLine } from "lucide-react"

import { ReTrayMark } from "@/components/retray-mark"

type ScanPanelProps = {
  onBack: () => void
  onContinue: () => void
}

export function ScanPanel({ onBack, onContinue }: ScanPanelProps) {
  return (
    <main className="app-main app-main--focused app-view-enter">
      <button className="back-link" onClick={onBack} type="button"><ArrowLeft aria-hidden="true" size={17} /> Venue dashboard</button>
      <section className="scan-layout">
        <div className="scan-copy">
          <p className="eyebrow">Counter action</p>
          <h1 data-view-heading tabIndex={-1}>Issue a container.</h1>
          <p>Hold the container tag inside the frame. For this demo, RT-024 is already selected.</p>
          <div className="selected-container">
            <ReTrayMark className="selected-container__mark" />
            <div><small>Selected container</small><strong>RT-024</strong><span>Clean · Available</span></div>
          </div>
        </div>

        <div className="scan-surface">
          <div className="scan-surface__top"><span>Container scanner</span><span className="demo-tag">Demo</span></div>
          <div className="scan-frame" aria-label="RT-024 detected">
            <i className="scan-frame__corner scan-frame__corner--one" />
            <i className="scan-frame__corner scan-frame__corner--two" />
            <i className="scan-frame__corner scan-frame__corner--three" />
            <i className="scan-frame__corner scan-frame__corner--four" />
            <div><ScanLine aria-hidden="true" size={42} /><strong>RT-024 detected</strong><span>Ready to issue to Maya L.</span></div>
          </div>
          <button className="button button--rose button--full" onClick={onContinue} type="button">
            Issue RT-024 <ArrowRight aria-hidden="true" size={18} />
          </button>
          <p className="scan-status">A customer return pass will open next.</p>
        </div>
      </section>
    </main>
  )
}

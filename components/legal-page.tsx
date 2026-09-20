import { ArrowLeft } from "lucide-react"

import { ReTrayMark } from "@/components/retray-mark"

type LegalPageProps = {
  page: "privacy" | "terms"
  onBack: () => void
}

export function LegalPage({ page, onBack }: LegalPageProps) {
  const isPrivacy = page === "privacy"

  return (
    <main className="legal-shell app-view-enter">
      <div className="legal-page__top">
        <button className="back-link" onClick={onBack} type="button"><ArrowLeft aria-hidden="true" size={17} /> Back to home</button>
        <div className="brand-lockup"><ReTrayMark className="brand-mark" /><span className="brand-word">ReTray</span></div>
      </div>
      <article className="legal-copy">
        <p className="eyebrow">Product policy</p>
        <h1 data-view-heading tabIndex={-1}>{isPrivacy ? "Privacy Policy" : "Terms of Service"}</h1>
        <p className="legal-copy__date">Effective 11 September 2026</p>
        {isPrivacy ? (
          <>
            <h2>About this MVP</h2>
            <p>ReTray uses authenticated account details to provide operator and consumer access. It stores venues, container records, borrow records, and circulation events needed to run the reusable-container loop.</p>
            <h2>Information stored</h2>
            <p>Account identity, venue names, container identifiers, consumer assignments, timestamps, and deposit ledger states are stored in the product database. Seeded records are labeled as demo data.</p>
            <h2>Camera access</h2>
            <p>The operator scanner requests camera access only after the operator starts it. QR frames are decoded in the browser and are not stored as images.</p>
            <h2>Payments and location</h2>
            <p>ReTray does not collect or release money and does not request precise location. Deposit entries describe the ledger state only.</p>
            <h2>External content</h2>
            <p>The landing page loads one licensed photograph from Pexels and typefaces from Google Fonts. Those providers may receive ordinary browser request information under their own policies.</p>
            <h2>Contact</h2>
            <p>No production support address has been assigned. The footer email control remains disabled until a verified address is available.</p>
          </>
        ) : (
          <>
            <h2>MVP use</h2>
            <p>ReTray records reusable-container operations for authenticated business operators and consumers. It is not a payment system or a venue agreement.</p>
            <h2>Deposit ledger</h2>
            <p>Deposit amounts and statuses are operational ledger entries only. ReTray does not collect, hold, release, or transfer money.</p>
            <h2>Availability</h2>
            <p>The MVP may change or become unavailable. Authentication creates a ReTray account record, but no purchase or payment account is created.</p>
            <h2>Responsible use</h2>
            <p>Use only venue and container information needed for the circulation loop. Do not enter payment card or bank information.</p>
          </>
        )}
      </article>
    </main>
  )
}

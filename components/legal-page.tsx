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
        <p className="eyebrow">Prototype policy</p>
        <h1 data-view-heading tabIndex={-1}>{isPrivacy ? "Privacy Policy" : "Terms of Service"}</h1>
        <p className="legal-copy__date">Effective 11 September 2026</p>
        {isPrivacy ? (
          <>
            <h2>About this prototype</h2>
            <p>This ReTray prototype demonstrates a reusable-container journey. It does not process real payments, identity, QR scans, precise location, or customer data.</p>
            <h2>Information shown</h2>
            <p>Names, container records, venues, timestamps, and deposit values are fictional demo content stored in the page interface. They are not submitted to a server.</p>
            <h2>External content</h2>
            <p>The landing page loads one licensed photograph from Pexels and typefaces from Google Fonts. Those providers may receive ordinary browser request information under their own policies.</p>
            <h2>Contact</h2>
            <p>No production support address has been assigned. The footer email control remains disabled until a verified address is available.</p>
          </>
        ) : (
          <>
            <h2>Prototype use</h2>
            <p>ReTray is provided here as a frontend demonstration of a reusable food-packaging loop. It is not a live container service, payment system, or venue agreement. It processes no real identity, QR scans, or customer data.</p>
            <h2>Simulated actions</h2>
            <p>Container scans, deposit holds, deposit releases, operator records, and impact updates are simulated. Do not rely on them as evidence of a real transaction.</p>
            <h2>Availability</h2>
            <p>The prototype may change or become unavailable. No account, purchase, or production service is created by using it.</p>
            <h2>Responsible use</h2>
            <p>Use the interface only to evaluate the demonstrated product flow. Do not enter personal or payment information.</p>
          </>
        )}
      </article>
    </main>
  )
}

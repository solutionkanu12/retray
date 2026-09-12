import { Mail } from "lucide-react"
import { FaGithub, FaXTwitter } from "react-icons/fa6"

import { ReTrayMark } from "@/components/retray-mark"

type SiteFooterProps = {
  onOpenLegal: (page: "privacy" | "terms") => void
}

export function SiteFooter({ onOpenLegal }: SiteFooterProps) {
  return (
    <footer className="site-footer" id="footer">
      <div className="site-footer__main">
        <div className="site-footer__brand">
          <div className="brand-lockup">
            <ReTrayMark className="brand-mark" />
            <span className="brand-word">ReTray</span>
          </div>
          <p>Reusable packaging infrastructure for food venues that want every container to come back.</p>
        </div>

        <div className="site-footer__links" aria-label="Legal links">
          <button className="text-link" onClick={() => onOpenLegal("privacy")} type="button">Privacy Policy</button>
          <button className="text-link" onClick={() => onOpenLegal("terms")} type="button">Terms of Service</button>
        </div>

        <div className="social-links" aria-label="Social links">
          <button aria-label="GitHub link not yet available" disabled title="GitHub link coming soon" type="button">
            <FaGithub aria-hidden="true" size={18} />
          </button>
          <button aria-label="X link not yet available" disabled title="X link coming soon" type="button">
            <FaXTwitter aria-hidden="true" size={17} />
          </button>
          <button aria-label="Email link not yet available" disabled title="Email address coming soon" type="button">
            <Mail aria-hidden="true" size={19} />
          </button>
        </div>
      </div>
      <div className="site-footer__base">
        <span>Prototype for the reusable-container loop.</span>
        <span>Built for clear returns.</span>
      </div>
    </footer>
  )
}

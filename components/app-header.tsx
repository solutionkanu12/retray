import { ChevronDown } from "lucide-react"

import { ReTrayMark } from "@/components/retray-mark"

type AppHeaderProps = {
  onHome: () => void
}

export function AppHeader({ onHome }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <button aria-label="Return to ReTray home" className="brand-button" onClick={onHome} type="button">
          <ReTrayMark className="brand-mark" />
          <span className="brand-word">ReTray</span>
        </button>
        <button aria-label="Current venue Kora Kitchen" className="venue-switcher" type="button">
          <span>Kora Kitchen</span>
          <ChevronDown aria-hidden="true" size={16} />
        </button>
        <div className="operator-identity">
          <span>JK</span>
          <div><small>Operator</small><strong>Jordan Kim</strong></div>
        </div>
      </div>
    </header>
  )
}

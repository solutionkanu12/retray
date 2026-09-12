"use client"

import { Menu, X } from "lucide-react"
import { useState } from "react"

import { ReTrayMark } from "@/components/retray-mark"

type SiteNavProps = {
  onOpenDemo: () => void
}

export function SiteNav({ onOpenDemo }: SiteNavProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="site-nav" id="navigation">
      <div className="site-nav__inner">
        <button className="brand-button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} type="button">
          <ReTrayMark className="brand-mark" />
          <span className="brand-word">ReTray</span>
        </button>

        <nav aria-label="Primary" className={`site-nav__links ${menuOpen ? "is-open" : ""}`}>
          <a href="#how-it-works" onClick={closeMenu}>How it works</a>
          <a href="#for-venues" onClick={closeMenu}>For venues</a>
          <a href="#impact" onClick={closeMenu}>Impact</a>
        </nav>

        <div className="site-nav__actions">
          <button className="button button--small button--rose" onClick={onOpenDemo} type="button">
            View demo
          </button>
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation" : "Open navigation"}
            className="menu-button"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? <X aria-hidden="true" size={20} /> : <Menu aria-hidden="true" size={20} />}
          </button>
        </div>
      </div>
    </header>
  )
}

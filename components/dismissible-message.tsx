"use client"

import { X } from "lucide-react"
import { useEffect, useState, type ReactNode } from "react"

type DismissibleMessageProps = {
  children: ReactNode
  tone?: "error"
}

const DISMISS_DURATION_MS = 180

export function DismissibleMessage({ children, tone }: DismissibleMessageProps) {
  const [isDismissing, setIsDismissing] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (!isDismissing) return
    const timeout = window.setTimeout(() => setIsVisible(false), DISMISS_DURATION_MS)
    return () => window.clearTimeout(timeout)
  }, [isDismissing])

  if (!isVisible) return null

  return (
    <div className={`product-message${tone === "error" ? " is-error" : ""}${isDismissing ? " is-dismissing" : ""}`} role={tone === "error" ? "alert" : "status"}>
      <span className="product-message__copy">{children}</span>
      <button aria-label="Dismiss notification" className="product-message__dismiss" onClick={() => setIsDismissing(true)} type="button">
        <X aria-hidden="true" size={16} strokeWidth={2} />
      </button>
    </div>
  )
}

import { chatGPTSignOutPath } from "@/app/chatgpt-auth"
import { ReTrayMark } from "@/components/retray-mark"
import Link from "next/link"

type ProductHeaderProps = {
  accountLabel: string
  displayName: string
  venueName?: string
}

export function ProductHeader({ accountLabel, displayName, venueName }: ProductHeaderProps) {
  return (
    <header className="product-header">
      <Link className="brand-lockup" href="/">
        <ReTrayMark className="brand-mark" />
        <span className="brand-word">ReTray</span>
      </Link>
      <div className="product-header__context">
        {venueName ? <span>{venueName}</span> : null}
        <span>{accountLabel}</span>
        <strong>{displayName}</strong>
        <a className="text-link" href={chatGPTSignOutPath("/")}>Sign out</a>
      </div>
    </header>
  )
}

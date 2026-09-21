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
        <form action="/api/auth/signout" method="post"><button className="text-link" type="submit">Sign out</button></form>
      </div>
    </header>
  )
}

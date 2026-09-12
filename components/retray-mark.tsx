type ReTrayMarkProps = {
  className?: string
  title?: string
}

export function ReTrayMark({ className, title }: ReTrayMarkProps) {
  return (
    <svg
      aria-hidden={title ? undefined : true}
      className={className}
      fill="none"
      role={title ? "img" : undefined}
      viewBox="0 0 40 40"
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <path d="M7 15.5h26l-2.4 15H9.4L7 15.5Z" stroke="currentColor" strokeWidth="2.4" />
      <path
        d="M12 10.5c2.8-2.6 6-3.8 9.6-3.5 4.2.3 7.5 2.7 9.4 6.3"
        stroke="currentColor"
        strokeLinecap="square"
        strokeWidth="2.4"
      />
      <path d="m27.7 11.5 3.7 2.6.8-4.5" stroke="currentColor" strokeLinecap="square" strokeWidth="2.4" />
      <path d="M12.4 21h15.2" stroke="currentColor" strokeWidth="2.4" />
    </svg>
  )
}

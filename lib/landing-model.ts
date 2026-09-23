export type LoopStep = {
  number: string
  verb: string
  copy: string
}

export const heroEyebrow = "Reusable packaging infrastructure. Working demo"

export const loopSteps: readonly LoopStep[] = [
  { number: "01", verb: "Borrow", copy: "The venue issues a tagged container with a refundable deposit. Paystack TEST deposits use test money only." },
  { number: "02", verb: "Enjoy", copy: "The customer takes their meal without a disposable pack." },
  { number: "03", verb: "Return", copy: "The return point records the container. A Paystack TEST deposit's paid and refunded states change only after a verified provider outcome." },
  { number: "04", verb: "Reuse", copy: "The venue washes the container and puts it straight back into circulation." },
] as const

export const mayaReturnStory =
  "Maya brings RT-024 back to Kora Kitchen. In the demo, her EUR 3.00 deposit accompanies the container and one scan confirms the return for washing. A Paystack TEST deposit uses test money and changes only after provider verification."

export const landingSectionIds = [
  "navigation",
  "hero",
  "statement",
  "how-it-works",
  "return-story",
  "for-venues",
  "impact",
  "final-cta",
  "footer",
] as const

export const navigationTargets = ["how-it-works", "for-venues", "impact"] as const

export const primaryCtaTargets = ["hero", "final-cta"] as const

export type LoopStep = {
  number: string
  verb: string
  copy: string
}

export const heroEyebrow = "Reusable packaging infrastructure. Prototype demo"

export const loopSteps: readonly LoopStep[] = [
  { number: "01", verb: "Borrow", copy: "The venue issues a tagged container and the demo holds a refundable deposit." },
  { number: "02", verb: "Enjoy", copy: "The customer takes their meal without a disposable pack." },
  { number: "03", verb: "Return", copy: "The venue return point marks the container returned and the demo releases the deposit." },
  { number: "04", verb: "Reuse", copy: "The venue washes the container and puts it straight back into circulation." },
] as const

export const mayaReturnStory =
  "Maya brings RT-024 back to Kora Kitchen. In the demo, one scan confirms the return, releases her EUR 3.00 deposit, and sends the container to washing."

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

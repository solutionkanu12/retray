import type { JourneyView, LoopEvent } from "./retray-state.ts"

export const returnSummary = {
  containerId: "RT-024",
  customer: "Maya L.",
  venue: "Kora Kitchen",
  deposit: "EUR 3.00",
  finalStatus: "Ready to wash",
} as const

export function motionPreferenceToBehavior(reducedMotion: boolean): ScrollBehavior {
  return reducedMotion ? "auto" : "smooth"
}

export function primaryEventForView(view: JourneyView): LoopEvent {
  switch (view) {
    case "dashboard":
      return { type: "OPEN_ISSUE_SCAN" }
    case "issue-scan":
      return { type: "OPEN_RETURN_PASS" }
    case "return-pass":
      return { type: "START_RETURN_SCAN" }
    default:
      throw new Error(`View ${view} has no primary journey action`)
  }
}

export function validateNoInput(input: unknown): Record<string, never> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("This action expects an empty object.")
  }

  if (Object.keys(input).length > 0) {
    throw new TypeError("This action does not accept input.")
  }

  return {}
}

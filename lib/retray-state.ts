export type JourneyView =
  | "landing"
  | "dashboard"
  | "issue-scan"
  | "return-pass"
  | "checking"
  | "success"
  | "privacy"
  | "terms"

export type ContainerStatus = "Borrowed" | "Returned" | "Ready to wash"

export type ContainerRecord = {
  id: string
  customer: string
  status: ContainerStatus
  latestEvent: string
}

export type LoopState = {
  view: JourneyView
  metrics: {
    containersOut: number
    readyToWash: number
    packsAvoided: number
  }
  containers: ContainerRecord[]
  depositReleased: boolean
  returnConfirmed: boolean
}

export type LoopEvent =
  | { type: "OPEN_LANDING" }
  | { type: "OPEN_DASHBOARD" }
  | { type: "OPEN_ISSUE_SCAN" }
  | { type: "OPEN_RETURN_PASS" }
  | { type: "START_RETURN_SCAN" }
  | { type: "RETURN_CONFIRMED" }
  | { type: "BACK_TO_DASHBOARD" }
  | { type: "OPEN_LEGAL"; page: "privacy" | "terms" }

export const initialLoopState: LoopState = {
  view: "landing",
  metrics: {
    containersOut: 18,
    readyToWash: 6,
    packsAvoided: 1284,
  },
  containers: [
    {
      id: "RT-024",
      customer: "Maya L.",
      status: "Borrowed",
      latestEvent: "Today 12:42",
    },
    {
      id: "RT-091",
      customer: "Daniel R.",
      status: "Returned",
      latestEvent: "Today 12:31",
    },
    {
      id: "RT-063",
      customer: "Ava K.",
      status: "Ready to wash",
      latestEvent: "Today 12:18",
    },
  ],
  depositReleased: false,
  returnConfirmed: false,
}

export function reduceLoop(state: LoopState, event: LoopEvent): LoopState {
  switch (event.type) {
    case "OPEN_LANDING":
      return { ...state, view: "landing" }
    case "OPEN_DASHBOARD":
    case "BACK_TO_DASHBOARD":
      return { ...state, view: "dashboard" }
    case "OPEN_ISSUE_SCAN":
      return { ...state, view: "issue-scan" }
    case "OPEN_RETURN_PASS":
      return { ...state, view: "return-pass" }
    case "START_RETURN_SCAN":
      return { ...state, view: "checking" }
    case "OPEN_LEGAL":
      return { ...state, view: event.page }
    case "RETURN_CONFIRMED": {
      if (state.returnConfirmed) {
        return { ...state, view: "success" }
      }

      return {
        ...state,
        view: "success",
        metrics: {
          containersOut: state.metrics.containersOut - 1,
          readyToWash: state.metrics.readyToWash + 1,
          packsAvoided: state.metrics.packsAvoided + 1,
        },
        containers: state.containers.map((container) =>
          container.id === "RT-024"
            ? {
                ...container,
                status: "Ready to wash",
                latestEvent: "Returned just now",
              }
            : container,
        ),
        depositReleased: true,
        returnConfirmed: true,
      }
    }
  }
}

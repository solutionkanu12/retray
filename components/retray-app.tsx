"use client"

import { useEffect, useReducer, useRef } from "react"

import { AppHeader } from "@/components/app-header"
import { LandingPage } from "@/components/landing-page"
import { LegalPage } from "@/components/legal-page"
import { ReturnPass } from "@/components/return-pass"
import { ReturnSuccess } from "@/components/return-success"
import { ScanPanel } from "@/components/scan-panel"
import { VenueDashboard } from "@/components/venue-dashboard"
import { initialLoopState, reduceLoop } from "@/lib/retray-state"
import { motionPreferenceToBehavior, validateNoInput } from "@/lib/journey-model"

type PageTool = {
  name: string
  title: string
  description: string
  inputSchema: Record<string, unknown>
  annotations: { readOnlyHint: boolean; untrustedContentHint: boolean }
  execute: (input: unknown) => unknown | Promise<unknown>
}

type PageModelContext = {
  registerTool: (tool: PageTool, options?: { signal?: AbortSignal }) => void | Promise<void>
}

const emptyInputSchema = {
  type: "object",
  properties: {},
  additionalProperties: false,
}

function afterPaint() {
  return new Promise<void>((resolve) => window.requestAnimationFrame(() => window.requestAnimationFrame(() => resolve())))
}

export function ReTrayApp() {
  const [state, dispatch] = useReducer(reduceLoop, initialLoopState)
  const stateRef = useRef(state)
  const previousViewRef = useRef(state.view)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: PageModelContext }).modelContext
    if (!modelContext?.registerTool) return

    const lifecycle = new AbortController()
    const register = (tool: PageTool) => {
      try {
        void Promise.resolve(modelContext.registerTool(tool, { signal: lifecycle.signal })).catch((error) => {
          console.warn("ReTray page tool registration failed", error)
        })
      } catch (error) {
        console.warn("ReTray page tool registration failed", error)
      }
    }

    register({
      name: "start_retray_demo",
      title: "Open ReTray demo",
      description: "Open the Kora Kitchen venue dashboard at the start of the reusable-container journey.",
      inputSchema: emptyInputSchema,
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        validateNoInput(input)
        dispatch({ type: "OPEN_DASHBOARD" })
        await afterPaint()
        return { view: "dashboard", venue: "Kora Kitchen", container: "RT-024" }
      },
    })

    register({
      name: "complete_simulated_return",
      title: "Complete simulated return",
      description: "Scan the visible ReTray return pass, release its simulated deposit, and put RT-024 into washing.",
      inputSchema: emptyInputSchema,
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        validateNoInput(input)
        if (stateRef.current.view !== "return-pass") {
          throw new Error("Open the customer return pass before completing a return.")
        }
        dispatch({ type: "START_RETURN_SCAN" })
        await new Promise((resolve) => window.setTimeout(resolve, 950))
        await afterPaint()
        return { status: "returned", container: "RT-024", depositReleased: "EUR 3.00" }
      },
    })

    register({
      name: "show_updated_venue_loop",
      title: "Show updated venue loop",
      description: "Return to the Kora Kitchen dashboard after RT-024 has been confirmed as returned.",
      inputSchema: emptyInputSchema,
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        validateNoInput(input)
        if (!stateRef.current.returnConfirmed) {
          throw new Error("Complete the simulated return before viewing the updated venue loop.")
        }
        dispatch({ type: "BACK_TO_DASHBOARD" })
        await afterPaint()
        return { view: "dashboard", containersOut: 17, readyToWash: 7, packsAvoided: 1285 }
      },
    })

    return () => lifecycle.abort()
  }, [])

  useEffect(() => {
    if (state.view !== "checking") return

    const confirmationTimer = window.setTimeout(() => {
      dispatch({ type: "RETURN_CONFIRMED" })
    }, 850)

    return () => window.clearTimeout(confirmationTimer)
  }, [state.view])

  useEffect(() => {
    if (previousViewRef.current === state.view) return
    previousViewRef.current = state.view

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({ top: 0, behavior: motionPreferenceToBehavior(reducedMotion) })

    const focusFrame = window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("[data-view-heading]")?.focus({ preventScroll: true })
    })

    return () => window.cancelAnimationFrame(focusFrame)
  }, [state.view])

  if (state.view === "landing") {
    return (
      <LandingPage
        onOpenDemo={() => dispatch({ type: "OPEN_DASHBOARD" })}
        onOpenLegal={(page) => dispatch({ type: "OPEN_LEGAL", page })}
      />
    )
  }

  if (state.view === "privacy" || state.view === "terms") {
    return <LegalPage onBack={() => dispatch({ type: "OPEN_LANDING" })} page={state.view} />
  }

  if (state.view === "return-pass" || state.view === "checking") {
    return (
      <ReturnPass
        checking={state.view === "checking"}
        onBack={() => dispatch({ type: "OPEN_DASHBOARD" })}
        onScanReturn={() => dispatch({ type: "START_RETURN_SCAN" })}
      />
    )
  }

  if (state.view === "success") {
    return <ReturnSuccess onViewVenue={() => dispatch({ type: "BACK_TO_DASHBOARD" })} />
  }

  return (
    <div className="app-shell">
      <AppHeader onHome={() => dispatch({ type: "OPEN_LANDING" })} />
      {state.view === "issue-scan" ? (
        <ScanPanel
          onBack={() => dispatch({ type: "OPEN_DASHBOARD" })}
          onContinue={() => dispatch({ type: "OPEN_RETURN_PASS" })}
        />
      ) : (
        <VenueDashboard
          onOpenPass={() => dispatch({ type: "OPEN_RETURN_PASS" })}
          onScan={() => dispatch({ type: "OPEN_ISSUE_SCAN" })}
          state={state}
        />
      )}
    </div>
  )
}

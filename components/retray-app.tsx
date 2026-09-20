"use client"

import { useEffect, useState } from "react"

import { LandingPage } from "@/components/landing-page"
import { LegalPage } from "@/components/legal-page"

type PublicView = "landing" | "privacy" | "terms"

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

export function ReTrayApp() {
  const [view, setView] = useState<PublicView>("landing")

  useEffect(() => {
    const modelContext = (document as Document & { modelContext?: PageModelContext }).modelContext
    if (!modelContext?.registerTool) return
    const lifecycle = new AbortController()
    void Promise.resolve(
      modelContext.registerTool(
        {
          name: "open_retray_app",
          title: "Open ReTray",
          description: "Open the authenticated ReTray product.",
          inputSchema: emptyInputSchema,
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).length) {
              throw new TypeError("This action expects an empty object.")
            }
            window.location.assign("/app")
            return { destination: "/app" }
          },
        },
        { signal: lifecycle.signal },
      ),
    ).catch((error) => console.warn("ReTray page tool registration failed", error))
    return () => lifecycle.abort()
  }, [])

  useEffect(() => {
    if (view === "landing") return
    window.scrollTo({ top: 0, behavior: "auto" })
    requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("[data-view-heading]")?.focus({ preventScroll: true })
    })
  }, [view])

  if (view !== "landing") {
    return <LegalPage onBack={() => setView("landing")} page={view} />
  }

  return (
    <LandingPage
      onOpenDemo={() => window.location.assign("/app")}
      onOpenLegal={(page) => setView(page)}
    />
  )
}

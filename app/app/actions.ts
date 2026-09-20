"use server"

import { redirect } from "next/navigation"

import { requireChatGPTUser } from "../chatgpt-auth"
import type { AccountType, CirculationEventType } from "../../lib/circulation-domain"
import {
  applyCirculationEvent,
  chooseAccountType,
  createVenue,
  registerContainer,
  renameVenue,
  syncAuthenticatedUser,
} from "../../lib/retray-data"

export async function chooseAccountTypeAction(formData: FormData): Promise<void> {
  const accountType = formData.get("accountType")
  if (accountType !== "business_operator" && accountType !== "consumer") {
    redirect(withMessage("error", "Choose a valid account type."))
  }
  await runAction(() => chooseAccountTypeForCurrentUser(accountType))
}

export async function createVenueAction(formData: FormData): Promise<void> {
  const name = stringField(formData, "name")
  await runAction(async () => {
    const user = await currentUser()
    await createVenue(user, name)
  }, "Venue created.")
}

export async function renameVenueAction(formData: FormData): Promise<void> {
  const venueId = stringField(formData, "venueId")
  const name = stringField(formData, "name")
  await runAction(async () => {
    const user = await currentUser()
    await renameVenue(user, venueId, name)
  }, "Venue name updated.", venueId)
}

export async function registerContainerAction(formData: FormData): Promise<void> {
  const venueId = stringField(formData, "venueId")
  const label = stringField(formData, "label")
  await runAction(async () => {
    const user = await currentUser()
    await registerContainer(user, venueId, label)
  }, "Container registered.", venueId)
}

export async function circulationAction(formData: FormData): Promise<void> {
  const venueId = stringField(formData, "venueId")
  const qrId = stringField(formData, "qrId")
  const eventType = stringField(formData, "eventType")
  if (!isCirculationEvent(eventType)) {
    redirect(withMessage("error", "Choose a valid circulation action.", venueId))
  }
  const consumerEmail = stringField(formData, "consumerEmail", false)
  await runAction(async () => {
    const user = await currentUser()
    await applyCirculationEvent({ user, qrId, eventType, consumerEmail })
  }, actionNotice(eventType), venueId)
}

async function chooseAccountTypeForCurrentUser(
  accountType: AccountType,
): Promise<void> {
  const user = await currentUser()
  await chooseAccountType(user, accountType)
}

async function currentUser() {
  const identity = await requireChatGPTUser("/app")
  return syncAuthenticatedUser({
    userId: identity.userId,
    email: identity.email,
    displayName: identity.displayName,
  })
}

async function runAction(
  action: () => Promise<void>,
  success = "Account ready.",
  venueId?: string,
): Promise<never> {
  let kind: "notice" | "error" = "notice"
  let message = success
  try {
    await action()
  } catch (error) {
    kind = "error"
    message = error instanceof Error ? error.message : "The action could not be completed."
  }
  redirect(withMessage(kind, message, venueId))
}

function stringField(
  formData: FormData,
  name: string,
  required = true,
): string {
  const value = formData.get(name)
  if (typeof value === "string") return value
  if (required) throw new Error(`${name} is required.`)
  return ""
}

function withMessage(
  kind: "notice" | "error",
  message: string,
  venueId?: string,
): string {
  const params = new URLSearchParams({ [kind]: message })
  if (venueId) params.set("venue", venueId)
  return `/app?${params.toString()}`
}

function isCirculationEvent(value: string): value is CirculationEventType {
  return ["issued", "returned", "ready_to_wash", "washed"].includes(value)
}

function actionNotice(eventType: CirculationEventType): string {
  switch (eventType) {
    case "issued":
      return "Container issued."
    case "returned":
      return "Return recorded. No payment was moved."
    case "ready_to_wash":
      return "Container marked ready to wash."
    case "washed":
      return "Wash completed. Container available."
  }
}

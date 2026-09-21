export type AccountType = "business_operator" | "consumer"

export type ContainerStatus =
  | "available"
  | "borrowed"
  | "returned"
  | "ready_to_wash"

export type CirculationEventType =
  | "issued"
  | "returned"
  | "ready_to_wash"
  | "washed"

export type AccessIdentity = {
  id: string
  accountType: AccountType
}

const transitions: Record<
  ContainerStatus,
  Partial<Record<CirculationEventType, ContainerStatus>>
> = {
  available: { issued: "borrowed" },
  borrowed: { returned: "returned" },
  returned: { ready_to_wash: "ready_to_wash" },
  ready_to_wash: { washed: "available" },
}

export function transitionContainer(
  status: ContainerStatus,
  eventType: CirculationEventType,
): ContainerStatus {
  const nextStatus = transitions[status][eventType]
  if (!nextStatus) {
    throw new Error(`Container cannot move from ${status} with ${eventType}.`)
  }
  return nextStatus
}

export function assertVenueAccess(
  user: AccessIdentity,
  venueOwnerUserId: string,
): void {
  if (user.accountType !== "business_operator") {
    throw new Error("A business operator account is required.")
  }
  if (user.id !== venueOwnerUserId) {
    throw new Error("This venue does not belong to the signed-in operator.")
  }
}

export function assertConsumerAccess(
  user: AccessIdentity,
  consumerUserId: string,
): void {
  if (user.accountType !== "consumer") {
    throw new Error("A consumer account is required.")
  }
  if (user.id !== consumerUserId) {
    throw new Error("A consumer cannot read another consumer's borrow ledger.")
  }
}

export function assertBorrowReturnAccess(
  user: AccessIdentity,
  consumerUserId: string,
  status: "active" | "returned",
): void {
  assertConsumerAccess(user, consumerUserId)
  if (status !== "active") throw new Error("This borrow is already returned.")
}

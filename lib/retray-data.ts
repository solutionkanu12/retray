import { and, desc, eq } from "drizzle-orm"

import { getDb } from "../db/index"
import {
  borrows,
  circulationEvents,
  containers,
  users,
  venues,
  type UserRecord,
} from "../db/schema"
import {
  assertConsumerAccess,
  assertVenueAccess,
  transitionContainer,
  type AccountType,
  type CirculationEventType,
  type ContainerStatus,
} from "./circulation-domain"

export type AuthenticatedIdentity = {
  userId: string
  email: string
  displayName: string
}

export type OperatorContainer = {
  id: string
  label: string
  qrId: string
  status: ContainerStatus
  customer: string | null
  latestEvent: CirculationEventType | null
  latestEventAt: string | null
  isDemo: boolean
}

export type OperatorDashboard = {
  venues: Array<{ id: string; name: string; isDemo: boolean }>
  venue: { id: string; name: string; isDemo: boolean } | null
  containers: OperatorContainer[]
  metrics: {
    containersOut: number
    returned: number
    readyToWash: number
    packsAvoided: number
  }
}

export type ConsumerBorrow = {
  id: string
  containerLabel: string
  containerStatus: ContainerStatus
  venueName: string
  borrowStatus: "active" | "returned"
  depositMinor: number
  depositCurrency: string
  depositStatus: "not_collected" | "return_recorded"
  issuedAt: string
  returnedAt: string | null
  isDemo: boolean
}

export async function syncAuthenticatedUser(
  identity: AuthenticatedIdentity,
): Promise<UserRecord> {
  const db = await getDb()
  await db
    .insert(users)
    .values({
      id: identity.userId,
      email: identity.email.toLowerCase(),
      displayName: identity.displayName,
    })
    .onConflictDoNothing()

  const [user] = await db.select().from(users).where(eq(users.id, identity.userId))
  if (!user) {
    throw new Error("The authenticated email is already linked to another account.")
  }

  if (
    !user.isDemo &&
    (user.email !== identity.email.toLowerCase() ||
      user.displayName !== identity.displayName)
  ) {
    await db
      .update(users)
      .set({
        email: identity.email.toLowerCase(),
        displayName: identity.displayName,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(users.id, user.id))
    return { ...user, email: identity.email.toLowerCase(), displayName: identity.displayName }
  }

  return user
}

export async function chooseAccountType(
  user: UserRecord,
  accountType: AccountType,
): Promise<void> {
  if (user.accountType && user.accountType !== accountType) {
    throw new Error("Account type cannot be changed after onboarding.")
  }
  const db = await getDb()
  await db
    .update(users)
    .set({ accountType, updatedAt: new Date().toISOString() })
    .where(eq(users.id, user.id))
}

export async function createVenue(user: UserRecord, name: string): Promise<void> {
  requireOperator(user)
  const cleanName = requireText(name, "Venue name", 80)
  const db = await getDb()
  await db.insert(venues).values({
    id: crypto.randomUUID(),
    ownerUserId: user.id,
    name: cleanName,
  })
}

export async function renameVenue(
  user: UserRecord,
  venueId: string,
  name: string,
): Promise<void> {
  const venue = await requireOwnedVenue(user, venueId)
  const cleanName = requireText(name, "Venue name", 80)
  const db = await getDb()
  await db
    .update(venues)
    .set({ name: cleanName, updatedAt: new Date().toISOString() })
    .where(eq(venues.id, venue.id))
}

export async function registerContainer(
  user: UserRecord,
  venueId: string,
  label: string,
): Promise<void> {
  await requireOwnedVenue(user, venueId)
  const cleanLabel = label.trim().toUpperCase()
  if (!/^[A-Z0-9][A-Z0-9-]{2,23}$/.test(cleanLabel)) {
    throw new Error("Container ID must be 3 to 24 letters, numbers, or hyphens.")
  }
  const db = await getDb()
  await db.insert(containers).values({
    id: crypto.randomUUID(),
    venueId,
    label: cleanLabel,
    qrId: createQrId(),
  })
}

export async function applyCirculationEvent(input: {
  user: UserRecord
  qrId: string
  eventType: CirculationEventType
  consumerEmail?: string
}): Promise<void> {
  requireOperator(input.user)
  const db = await getDb()
  const [container] = await db
    .select()
    .from(containers)
    .where(eq(containers.qrId, input.qrId.trim()))
  if (!container) throw new Error("No container matches that QR ID.")

  const venue = await requireOwnedVenue(input.user, container.venueId)
  const nextStatus = transitionContainer(
    container.status as ContainerStatus,
    input.eventType,
  )
  const timestamp = new Date().toISOString()

  if (input.eventType === "issued") {
    const email = input.consumerEmail?.trim().toLowerCase() ?? ""
    const [consumer] = await db.select().from(users).where(eq(users.email, email))
    if (!consumer || consumer.accountType !== "consumer") {
      throw new Error("The consumer must sign in and choose a consumer account first.")
    }
    const borrowId = crypto.randomUUID()
    await db.batch([
      db
        .update(containers)
        .set({ status: nextStatus, updatedAt: timestamp })
        .where(
          and(
            eq(containers.id, container.id),
            eq(containers.status, container.status),
          ),
        ),
      db.insert(borrows).values({
        id: borrowId,
        containerId: container.id,
        consumerUserId: consumer.id,
        issuedByUserId: input.user.id,
        depositMinor: 300,
        depositCurrency: "EUR",
        depositStatus: "not_collected",
      }),
      db.insert(circulationEvents).values({
        id: crypto.randomUUID(),
        venueId: venue.id,
        containerId: container.id,
        borrowId,
        actorUserId: input.user.id,
        eventType: input.eventType,
      }),
    ])
    return
  }

  const [latestBorrow] = await db
    .select()
    .from(borrows)
    .where(eq(borrows.containerId, container.id))
    .orderBy(desc(borrows.issuedAt))
    .limit(1)
  if (!latestBorrow) throw new Error("This container has no borrow record.")

  const updateContainer = db
    .update(containers)
    .set({ status: nextStatus, updatedAt: timestamp })
    .where(
      and(
        eq(containers.id, container.id),
        eq(containers.status, container.status),
      ),
    )
  const insertEvent = db.insert(circulationEvents).values({
    id: crypto.randomUUID(),
    venueId: venue.id,
    containerId: container.id,
    borrowId: latestBorrow.id,
    actorUserId: input.user.id,
    eventType: input.eventType,
  })
  if (input.eventType === "returned") {
    if (latestBorrow.status !== "active") {
      throw new Error("This borrow is already returned.")
    }
    await db.batch([
      updateContainer,
      db
        .update(borrows)
        .set({
          status: "returned",
          depositStatus: "return_recorded",
          returnedAt: timestamp,
        })
        .where(eq(borrows.id, latestBorrow.id)),
      insertEvent,
    ])
    return
  }
  await db.batch([updateContainer, insertEvent])
}

export async function getOperatorDashboard(
  user: UserRecord,
  selectedVenueId?: string,
): Promise<OperatorDashboard> {
  requireOperator(user)
  const db = await getDb()
  const ownedVenues = await db
    .select({ id: venues.id, name: venues.name, isDemo: venues.isDemo })
    .from(venues)
    .where(eq(venues.ownerUserId, user.id))
    .orderBy(venues.createdAt)
  const venue = selectedVenueId
    ? ownedVenues.find((candidate) => candidate.id === selectedVenueId) ?? null
    : ownedVenues[0] ?? null
  if (selectedVenueId && !venue) {
    throw new Error("This venue does not belong to the signed-in operator.")
  }
  if (!venue) {
    return {
      venues: ownedVenues,
      venue: null,
      containers: [],
      metrics: { containersOut: 0, returned: 0, readyToWash: 0, packsAvoided: 0 },
    }
  }

  const [containerRows, borrowRows, eventRows] = await Promise.all([
    db
      .select()
      .from(containers)
      .where(eq(containers.venueId, venue.id))
      .orderBy(containers.createdAt),
    db
      .select({
        containerId: borrows.containerId,
        consumerName: users.displayName,
      })
      .from(borrows)
      .innerJoin(users, eq(borrows.consumerUserId, users.id))
      .innerJoin(containers, eq(borrows.containerId, containers.id))
      .where(
        and(
          eq(borrows.status, "active"),
          eq(containers.venueId, venue.id),
        ),
      ),
    db
      .select()
      .from(circulationEvents)
      .where(eq(circulationEvents.venueId, venue.id))
      .orderBy(desc(circulationEvents.occurredAt)),
  ])
  const customerByContainer = new Map(
    borrowRows.map((row) => [row.containerId, row.consumerName]),
  )
  const latestByContainer = new Map<
    string,
    (typeof eventRows)[number]
  >()
  for (const event of eventRows) {
    if (!latestByContainer.has(event.containerId)) {
      latestByContainer.set(event.containerId, event)
    }
  }
  const dashboardContainers = containerRows.map((container) => {
    const latest = latestByContainer.get(container.id)
    return {
      id: container.id,
      label: container.label,
      qrId: container.qrId,
      status: container.status as ContainerStatus,
      customer: customerByContainer.get(container.id) ?? null,
      latestEvent: (latest?.eventType as CirculationEventType | undefined) ?? null,
      latestEventAt: latest?.occurredAt ?? null,
      isDemo: container.isDemo,
    }
  })

  return {
    venues: ownedVenues,
    venue,
    containers: dashboardContainers,
    metrics: {
      containersOut: dashboardContainers.filter((item) => item.status === "borrowed").length,
      returned: dashboardContainers.filter((item) => item.status === "returned").length,
      readyToWash: dashboardContainers.filter(
        (item) => item.status === "ready_to_wash",
      ).length,
      packsAvoided: eventRows.filter((event) => event.eventType === "returned").length,
    },
  }
}

export async function getConsumerBorrows(
  user: UserRecord,
): Promise<ConsumerBorrow[]> {
  requireConsumer(user)
  assertConsumerAccess(
    { id: user.id, accountType: user.accountType },
    user.id,
  )
  const db = await getDb()
  return db
    .select({
      id: borrows.id,
      containerLabel: containers.label,
      containerStatus: containers.status,
      venueName: venues.name,
      borrowStatus: borrows.status,
      depositMinor: borrows.depositMinor,
      depositCurrency: borrows.depositCurrency,
      depositStatus: borrows.depositStatus,
      issuedAt: borrows.issuedAt,
      returnedAt: borrows.returnedAt,
      isDemo: borrows.isDemo,
    })
    .from(borrows)
    .innerJoin(containers, eq(borrows.containerId, containers.id))
    .innerJoin(venues, eq(containers.venueId, venues.id))
    .where(eq(borrows.consumerUserId, user.id))
    .orderBy(desc(borrows.issuedAt))
}

async function requireOwnedVenue(user: UserRecord, venueId: string) {
  requireOperator(user)
  const db = await getDb()
  const [venue] = await db.select().from(venues).where(eq(venues.id, venueId))
  if (!venue) throw new Error("Venue not found.")
  assertVenueAccess(
    { id: user.id, accountType: user.accountType },
    venue.ownerUserId,
  )
  return venue
}

function requireOperator(
  user: UserRecord,
): asserts user is UserRecord & { accountType: "business_operator" } {
  if (user.accountType !== "business_operator") {
    throw new Error("A business operator account is required.")
  }
}

function requireConsumer(
  user: UserRecord,
): asserts user is UserRecord & { accountType: "consumer" } {
  if (user.accountType !== "consumer") {
    throw new Error("A consumer account is required.")
  }
}

function requireText(value: string, label: string, maxLength: number): string {
  const cleanValue = value.trim()
  if (!cleanValue) throw new Error(`${label} is required.`)
  if (cleanValue.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer.`)
  }
  return cleanValue
}

function createQrId(): string {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()
}

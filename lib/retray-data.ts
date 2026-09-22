import { and, desc, eq, sql } from "drizzle-orm"

import { getDb } from "../db/index"
import {
  borrows,
  circulationEvents,
  containers,
  paymentAttempts,
  processedWebhookEvents,
  users,
  venues,
  type UserRecord,
} from "../db/schema"
import { NEW_DEPOSIT_CURRENCY } from "./deposit"
import { readProviderConfig } from "./provider-config"
import {
  assertConsumerMayInitializePayment,
  applyPaystackChargeSuccess,
  createPaymentAttemptDraft,
  paystackInitializeBody,
  type DepositStatus,
} from "./payment-domain"
import {
  initializePaystackCheckout,
  parsePaystackWebhook,
  paystackEventDigest,
  verifyPaystackSignature,
} from "./paystack"
import {
  assertConsumerAccess,
  assertBorrowReturnAccess,
  assertVenueAccess,
  transitionContainer,
  type CirculationEventType,
  type ContainerStatus,
} from "./circulation-domain"

export type OperatorContainer = {
  id: string
  label: string
  qrId: string
  status: ContainerStatus
  customer: string | null
  depositMinor: number | null
  depositCurrency: string | null
  depositStatus: DepositStatus | null
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
  qrId: string
  containerStatus: ContainerStatus
  venueName: string
  borrowStatus: "active" | "returned"
  depositMinor: number
  depositCurrency: string
  depositStatus: DepositStatus
  paymentStatus: "none" | "pending" | "paid" | "failed"
  issuedAt: string
  returnedAt: string | null
  isDemo: boolean
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
  depositMinor?: number
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
    const depositMinor = input.depositMinor ?? 0
    if (!Number.isSafeInteger(depositMinor) || depositMinor < 0 || depositMinor > 999_999) {
      throw new Error("Enter a valid expected deposit.")
    }
    const email = input.consumerEmail?.trim().toLowerCase() ?? ""
    const [consumer] = await db.select().from(users).where(eq(users.email, email))
    if (!consumer || consumer.accountType !== "consumer") {
      throw new Error("The consumer must create a consumer account first.")
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
        depositMinor,
        depositCurrency: NEW_DEPOSIT_CURRENCY,
        depositStatus: "not_collected",
        issuedAt: timestamp,
      }),
      db.insert(circulationEvents).values({
        id: crypto.randomUUID(),
        venueId: venue.id,
        containerId: container.id,
        borrowId,
        actorUserId: input.user.id,
        eventType: input.eventType,
        occurredAt: timestamp,
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
    occurredAt: timestamp,
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

export async function returnBorrowedContainer(user: UserRecord, qrId: string): Promise<void> {
  requireConsumer(user)
  const db = await getDb()
  const [active] = await db
    .select({ borrow: borrows, container: containers })
    .from(borrows)
    .innerJoin(containers, eq(borrows.containerId, containers.id))
    .where(and(eq(containers.qrId, qrId.trim()), eq(borrows.status, "active")))
  if (!active) throw new Error("No active borrow matches that QR ID.")
  assertBorrowReturnAccess({ id: user.id, accountType: user.accountType }, active.borrow.consumerUserId, active.borrow.status)
  const nextStatus = transitionContainer(active.container.status as ContainerStatus, "returned")
  const timestamp = new Date().toISOString()
  await db.batch([
    db.update(containers).set({ status: nextStatus, updatedAt: timestamp }).where(and(eq(containers.id, active.container.id), eq(containers.status, "borrowed"))),
    db.update(borrows).set({ status: "returned", depositStatus: "return_recorded", returnedAt: timestamp }).where(and(eq(borrows.id, active.borrow.id), eq(borrows.status, "active"))),
    db.insert(circulationEvents).values({
      id: crypto.randomUUID(), venueId: active.container.venueId, containerId: active.container.id,
      borrowId: active.borrow.id, actorUserId: user.id, eventType: "returned", occurredAt: timestamp,
    }),
  ])
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
        depositMinor: borrows.depositMinor,
        depositCurrency: borrows.depositCurrency,
        depositStatus: borrows.depositStatus,
      })
      .from(borrows)
      .innerJoin(users, eq(borrows.consumerUserId, users.id))
      .innerJoin(containers, eq(borrows.containerId, containers.id))
      .where(eq(containers.venueId, venue.id))
      .orderBy(desc(borrows.issuedAt)),
    db
      .select()
      .from(circulationEvents)
      .where(eq(circulationEvents.venueId, venue.id))
      .orderBy(desc(sql`julianday(${circulationEvents.occurredAt})`), desc(sql`rowid`)),
  ])
  const borrowByContainer = new Map<string, (typeof borrowRows)[number]>()
  for (const row of borrowRows) {
    if (!borrowByContainer.has(row.containerId)) borrowByContainer.set(row.containerId, row)
  }
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
      customer: container.status === "borrowed" ? borrowByContainer.get(container.id)?.consumerName ?? null : null,
      depositMinor: borrowByContainer.get(container.id)?.depositMinor ?? null,
      depositCurrency: borrowByContainer.get(container.id)?.depositCurrency ?? null,
      depositStatus: (borrowByContainer.get(container.id)?.depositStatus as DepositStatus | undefined) ?? null,
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
  const rows = await db
    .select({
      id: borrows.id,
      containerLabel: containers.label,
      qrId: containers.qrId,
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
  const payments = rows.length
    ? await db
      .select({
        borrowId: paymentAttempts.borrowId,
        status: paymentAttempts.status,
        createdAt: paymentAttempts.createdAt,
      })
      .from(paymentAttempts)
      .where(eq(paymentAttempts.consumerUserId, user.id))
      .orderBy(desc(paymentAttempts.createdAt))
    : []
  const paymentByBorrow = new Map<string, "pending" | "paid" | "failed">()
  for (const payment of payments) {
    if (!paymentByBorrow.has(payment.borrowId)) paymentByBorrow.set(payment.borrowId, payment.status)
  }
  return rows.map((row) => ({
    ...row,
    depositStatus: row.depositStatus as DepositStatus,
    paymentStatus: paymentByBorrow.get(row.id) ?? "none",
  }))
}

export async function initializeDepositCheckout(
  user: UserRecord,
  borrowId: string,
  source: Record<string, unknown>,
): Promise<string> {
  requireConsumer(user)
  const db = await getDb()
  const [row] = await db
    .select({ borrow: borrows, email: users.email })
    .from(borrows)
    .innerJoin(users, eq(borrows.consumerUserId, users.id))
    .where(eq(borrows.id, borrowId))
  if (!row) throw new Error("Borrow not found.")
  assertConsumerMayInitializePayment(
    { id: user.id, accountType: user.accountType },
    {
      consumerUserId: row.borrow.consumerUserId,
      status: row.borrow.status,
      depositMinor: row.borrow.depositMinor,
      depositCurrency: row.borrow.depositCurrency,
      depositStatus: row.borrow.depositStatus as DepositStatus,
    },
  )
  const draft = createPaymentAttemptDraft({
    borrowId: row.borrow.id,
    consumerUserId: row.borrow.consumerUserId,
    depositMinor: row.borrow.depositMinor,
    depositCurrency: row.borrow.depositCurrency,
  })
  const body = paystackInitializeBody({
    email: row.email,
    attempt: draft,
    callbackUrl: `${readProviderConfig(source, "APP_BASE_URL")}/app/payment/return`,
  })
  await db.insert(paymentAttempts).values({
    id: crypto.randomUUID(),
    borrowId: draft.borrowId,
    consumerUserId: draft.consumerUserId,
    providerReference: draft.providerReference,
    status: draft.status,
    amountMinor: draft.amountMinor,
    currency: draft.currency,
  })
  const authorizationUrl = await initializePaystackCheckout({
    source,
    email: body.email,
    amount: body.amount,
    currency: body.currency,
    reference: body.reference,
    callbackUrl: body.callback_url,
  })
  await db
    .update(paymentAttempts)
    .set({ authorizationUrl, updatedAt: new Date().toISOString() })
    .where(eq(paymentAttempts.providerReference, draft.providerReference))
  return authorizationUrl
}

export async function applyPaystackWebhook(
  rawBody: string,
  signature: string,
  source: Record<string, unknown>,
): Promise<"accepted" | "duplicate" | "ignored"> {
  const secret = readProviderConfig(source, "PAYSTACK_SECRET_KEY")
  if (!await verifyPaystackSignature(rawBody, signature, secret)) {
    throw new Error("Invalid Paystack webhook signature.")
  }
  const event = parsePaystackWebhook(rawBody)
  if (!event) return "ignored"
  const digest = await paystackEventDigest(rawBody)
  const reference = event.data?.reference
  if (!reference) return "ignored"
  const db = await getDb()
  const [attempt] = await db.select().from(paymentAttempts).where(eq(paymentAttempts.providerReference, reference))
  if (!attempt) return "ignored"
  const [borrow] = await db.select().from(borrows).where(eq(borrows.id, attempt.borrowId))
  if (!borrow) return "ignored"
  const [existing] = await db.select().from(processedWebhookEvents).where(eq(processedWebhookEvents.eventDigest, digest))
  const applied = applyPaystackChargeSuccess(
    {
      attempt: {
        id: attempt.id,
        providerReference: attempt.providerReference,
        status: attempt.status,
        amountMinor: attempt.amountMinor,
        currency: attempt.currency,
        consumerUserId: attempt.consumerUserId,
      },
      deposit: {
        status: borrow.depositStatus as DepositStatus,
        currency: borrow.depositCurrency,
        minor: borrow.depositMinor,
      },
      processedEventDigests: existing ? [digest] : [],
    },
    event,
    digest,
  )
  if (!applied) return "ignored"
  if (applied.duplicate && existing) return "duplicate"
  const timestamp = new Date().toISOString()
  if (!existing) {
    await db.insert(processedWebhookEvents).values({
      eventDigest: digest,
      paymentAttemptId: attempt.id,
      eventType: event.event ?? "charge.success",
    })
  }
  if (applied.ledger.attempt.status === "paid") {
    await db.batch([
      db.update(paymentAttempts).set({ status: "paid", updatedAt: timestamp }).where(eq(paymentAttempts.id, attempt.id)),
      db.update(borrows).set({ depositStatus: "paid" }).where(eq(borrows.id, attempt.borrowId)),
    ])
  }
  return applied.duplicate ? "duplicate" : "accepted"
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

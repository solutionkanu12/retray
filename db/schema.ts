import { sql } from "drizzle-orm"
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core"

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  accountType: text("account_type", {
    enum: ["business_operator", "consumer"],
  }),
  emailVerifiedAt: text("email_verified_at"),
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const credentials = sqliteTable("credentials", {
  userId: text("user_id").primaryKey().references(() => users.id),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  passwordIterations: integer("password_iterations").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const sessions = sqliteTable("sessions", {
  tokenDigest: text("token_digest").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("sessions_user_idx").on(table.userId)])

export const emailVerificationTokens = sqliteTable("email_verification_tokens", {
  tokenDigest: text("token_digest").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  expiresAt: text("expires_at").notNull(),
  consumedAt: text("consumed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("email_verification_tokens_user_idx").on(table.userId)])

export const emailLoginTokens = sqliteTable("email_login_tokens", {
  tokenDigest: text("token_digest").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  expiresAt: text("expires_at").notNull(),
  consumedAt: text("consumed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("email_login_tokens_user_idx").on(table.userId)])

export const oauthAuthorizationStates = sqliteTable("oauth_authorization_states", {
  stateDigest: text("state_digest").primaryKey(),
  nonceDigest: text("nonce_digest").notNull(),
  intent: text("intent", { enum: ["sign_in", "sign_up"] }).notNull(),
  accountType: text("account_type", { enum: ["business_operator", "consumer"] }),
  venueName: text("venue_name"),
  expiresAt: text("expires_at").notNull(),
  consumedAt: text("consumed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("oauth_authorization_states_expiry_idx").on(table.expiresAt)])

export const oauthIdentities = sqliteTable("oauth_identities", {
  id: text("id").primaryKey(),
  provider: text("provider", { enum: ["google"] }).notNull(),
  providerSubject: text("provider_subject").notNull(),
  userId: text("user_id").notNull().references(() => users.id),
  email: text("email").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
  uniqueIndex("oauth_identities_provider_subject_unique").on(table.provider, table.providerSubject),
  uniqueIndex("oauth_identities_provider_user_unique").on(table.provider, table.userId),
  index("oauth_identities_user_idx").on(table.userId),
])

export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  tokenDigest: text("token_digest").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  expiresAt: text("expires_at").notNull(),
  consumedAt: text("consumed_at"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("password_reset_tokens_user_idx").on(table.userId)])

export const rateLimitWindows = sqliteTable("rate_limit_windows", {
  keyDigest: text("key_digest").primaryKey(),
  action: text("action", { enum: ["sign_in", "password_reset"] }).notNull(),
  windowStartedAt: text("window_started_at").notNull(),
  attempts: integer("attempts").notNull().default(0),
  expiresAt: text("expires_at").notNull(),
})

export const venues = sqliteTable(
  "venues",
  {
    id: text("id").primaryKey(),
    ownerUserId: text("owner_user_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index("venues_owner_idx").on(table.ownerUserId)],
)

export const containers = sqliteTable(
  "containers",
  {
    id: text("id").primaryKey(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id),
    label: text("label").notNull(),
    qrId: text("qr_id").notNull().unique(),
    status: text("status", {
      enum: ["available", "borrowed", "returned", "ready_to_wash"],
    })
      .notNull()
      .default("available"),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("containers_venue_label_unique").on(
      table.venueId,
      table.label,
    ),
    index("containers_venue_status_idx").on(table.venueId, table.status),
  ],
)

export const borrows = sqliteTable(
  "borrows",
  {
    id: text("id").primaryKey(),
    containerId: text("container_id")
      .notNull()
      .references(() => containers.id),
    consumerUserId: text("consumer_user_id")
      .notNull()
      .references(() => users.id),
    issuedByUserId: text("issued_by_user_id")
      .notNull()
      .references(() => users.id),
    status: text("status", { enum: ["active", "returned"] })
      .notNull()
      .default("active"),
    depositMinor: integer("deposit_minor").notNull().default(0),
    depositCurrency: text("deposit_currency").notNull().default("NGN"),
    depositStatus: text("deposit_status", {
      enum: ["not_collected", "paid", "refunded", "return_recorded"],
    })
      .notNull()
      .default("not_collected"),
    isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
    issuedAt: text("issued_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    returnedAt: text("returned_at"),
  },
  (table) => [
    uniqueIndex("borrows_one_active_per_container")
      .on(table.containerId)
      .where(sql`${table.status} = 'active'`),
    index("borrows_consumer_status_idx").on(
      table.consumerUserId,
      table.status,
    ),
  ],
)

export const circulationEvents = sqliteTable(
  "circulation_events",
  {
    id: text("id").primaryKey(),
    venueId: text("venue_id")
      .notNull()
      .references(() => venues.id),
    containerId: text("container_id")
      .notNull()
      .references(() => containers.id),
    borrowId: text("borrow_id").references(() => borrows.id),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => users.id),
    eventType: text("event_type", {
      enum: ["issued", "returned", "ready_to_wash", "washed"],
    }).notNull(),
    occurredAt: text("occurred_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    uniqueIndex("circulation_events_one_type_per_borrow").on(table.borrowId, table.eventType),
    index("circulation_events_venue_time_idx").on(
      table.venueId,
      table.occurredAt,
    ),
    index("circulation_events_container_time_idx").on(
      table.containerId,
      table.occurredAt,
    ),
  ],
)

export const paymentAttempts = sqliteTable("payment_attempts", {
  id: text("id").primaryKey(),
  borrowId: text("borrow_id").notNull().references(() => borrows.id),
  consumerUserId: text("consumer_user_id").notNull().references(() => users.id),
  providerReference: text("provider_reference").notNull().unique(),
  status: text("status", { enum: ["pending", "paid", "failed"] }).notNull().default("pending"),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  authorizationUrl: text("authorization_url"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("payment_attempts_borrow_idx").on(table.borrowId)])

export const processedWebhookEvents = sqliteTable("processed_webhook_events", {
  eventDigest: text("event_digest").primaryKey(),
  paymentAttemptId: text("payment_attempt_id").references(() => paymentAttempts.id),
  eventType: text("event_type").notNull(),
  processedAt: text("processed_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("processed_webhook_events_payment_idx").on(table.paymentAttemptId)])

export const refunds = sqliteTable("refunds", {
  id: text("id").primaryKey(),
  paymentAttemptId: text("payment_attempt_id").notNull().unique().references(() => paymentAttempts.id),
  borrowId: text("borrow_id").notNull().references(() => borrows.id),
  providerReference: text("provider_reference").unique(),
  status: text("status", { enum: ["pending", "refunded", "failed"] }).notNull().default("pending"),
  amountMinor: integer("amount_minor").notNull(),
  currency: text("currency").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("refunds_borrow_idx").on(table.borrowId)])

export type UserRecord = typeof users.$inferSelect
export type VenueRecord = typeof venues.$inferSelect
export type ContainerRecord = typeof containers.$inferSelect
export type BorrowRecord = typeof borrows.$inferSelect

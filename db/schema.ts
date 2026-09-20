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
  isDemo: integer("is_demo", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
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
    depositCurrency: text("deposit_currency").notNull().default("EUR"),
    depositStatus: text("deposit_status", {
      enum: ["not_collected", "return_recorded"],
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

export type UserRecord = typeof users.$inferSelect
export type VenueRecord = typeof venues.$inferSelect
export type ContainerRecord = typeof containers.$inferSelect
export type BorrowRecord = typeof borrows.$inferSelect

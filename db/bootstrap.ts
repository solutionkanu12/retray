const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY NOT NULL,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  account_type text,
  is_demo integer DEFAULT false NOT NULL,
  created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE IF NOT EXISTS credentials (
  user_id text PRIMARY KEY NOT NULL REFERENCES users(id),
  password_hash text NOT NULL,
  password_salt text NOT NULL,
  password_iterations integer NOT NULL,
  created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token_digest text PRIMARY KEY NOT NULL,
  user_id text NOT NULL REFERENCES users(id),
  expires_at text NOT NULL,
  created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions (user_id);
CREATE TABLE IF NOT EXISTS venues (
  id text PRIMARY KEY NOT NULL,
  owner_user_id text NOT NULL REFERENCES users(id),
  name text NOT NULL,
  is_demo integer DEFAULT false NOT NULL,
  created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS venues_owner_idx ON venues (owner_user_id);
CREATE TABLE IF NOT EXISTS containers (
  id text PRIMARY KEY NOT NULL,
  venue_id text NOT NULL REFERENCES venues(id),
  label text NOT NULL,
  qr_id text NOT NULL UNIQUE,
  status text DEFAULT 'available' NOT NULL,
  is_demo integer DEFAULT false NOT NULL,
  created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS containers_venue_label_unique ON containers (venue_id, label);
CREATE INDEX IF NOT EXISTS containers_venue_status_idx ON containers (venue_id, status);
CREATE TABLE IF NOT EXISTS borrows (
  id text PRIMARY KEY NOT NULL,
  container_id text NOT NULL REFERENCES containers(id),
  consumer_user_id text NOT NULL REFERENCES users(id),
  issued_by_user_id text NOT NULL REFERENCES users(id),
  status text DEFAULT 'active' NOT NULL,
  deposit_minor integer DEFAULT 0 NOT NULL,
  deposit_currency text DEFAULT 'EUR' NOT NULL,
  deposit_status text DEFAULT 'not_collected' NOT NULL,
  is_demo integer DEFAULT false NOT NULL,
  issued_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  returned_at text
);
CREATE UNIQUE INDEX IF NOT EXISTS borrows_one_active_per_container ON borrows (container_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS borrows_consumer_status_idx ON borrows (consumer_user_id, status);
CREATE TABLE IF NOT EXISTS circulation_events (
  id text PRIMARY KEY NOT NULL,
  venue_id text NOT NULL REFERENCES venues(id),
  container_id text NOT NULL REFERENCES containers(id),
  borrow_id text REFERENCES borrows(id),
  actor_user_id text NOT NULL REFERENCES users(id),
  event_type text NOT NULL,
  occurred_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS circulation_events_venue_time_idx ON circulation_events (venue_id, occurred_at);
CREATE INDEX IF NOT EXISTS circulation_events_container_time_idx ON circulation_events (container_id, occurred_at);
CREATE UNIQUE INDEX IF NOT EXISTS circulation_events_one_type_per_borrow ON circulation_events (borrow_id, event_type);
CREATE TRIGGER IF NOT EXISTS circulation_events_no_update
BEFORE UPDATE ON circulation_events
BEGIN
  SELECT RAISE(ABORT, 'circulation events are immutable');
END;
CREATE TRIGGER IF NOT EXISTS circulation_events_no_delete
BEFORE DELETE ON circulation_events
BEGIN
  SELECT RAISE(ABORT, 'circulation events are immutable');
END;
`

let initialization: Promise<void> | undefined
const executableSchemaSql = schemaSql.replace(/\s+/g, " ").trim()

export function prepareDatabase(database: D1Database): Promise<void> {
  initialization ??= database.exec(executableSchemaSql).then(() => undefined)
  return initialization
}

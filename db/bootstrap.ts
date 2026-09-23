const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id text PRIMARY KEY NOT NULL,
  email text NOT NULL UNIQUE,
  display_name text NOT NULL,
  account_type text,
  email_verified_at text,
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
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  token_digest text PRIMARY KEY NOT NULL,
  user_id text NOT NULL REFERENCES users(id),
  expires_at text NOT NULL,
  consumed_at text,
  created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS email_verification_tokens_user_idx ON email_verification_tokens (user_id);
CREATE TABLE IF NOT EXISTS email_login_tokens (
  token_digest text PRIMARY KEY NOT NULL,
  user_id text NOT NULL REFERENCES users(id),
  expires_at text NOT NULL,
  consumed_at text,
  created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS email_login_tokens_user_idx ON email_login_tokens (user_id);
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_digest text PRIMARY KEY NOT NULL,
  user_id text NOT NULL REFERENCES users(id),
  expires_at text NOT NULL,
  consumed_at text,
  created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx ON password_reset_tokens (user_id);
CREATE TABLE IF NOT EXISTS rate_limit_windows (
  key_digest text PRIMARY KEY NOT NULL,
  action text NOT NULL,
  window_started_at text NOT NULL,
  attempts integer DEFAULT 0 NOT NULL,
  expires_at text NOT NULL
);
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
  deposit_currency text DEFAULT 'NGN' NOT NULL,
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
CREATE TABLE IF NOT EXISTS payment_attempts (
  id text PRIMARY KEY NOT NULL,
  borrow_id text NOT NULL REFERENCES borrows(id),
  consumer_user_id text NOT NULL REFERENCES users(id),
  provider_reference text NOT NULL UNIQUE,
  status text DEFAULT 'pending' NOT NULL,
  amount_minor integer NOT NULL,
  currency text NOT NULL,
  authorization_url text,
  created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS payment_attempts_borrow_idx ON payment_attempts (borrow_id);
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  event_digest text PRIMARY KEY NOT NULL,
  payment_attempt_id text REFERENCES payment_attempts(id),
  event_type text NOT NULL,
  processed_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS processed_webhook_events_payment_idx ON processed_webhook_events (payment_attempt_id);
CREATE TABLE IF NOT EXISTS refunds (
  id text PRIMARY KEY NOT NULL,
  payment_attempt_id text NOT NULL UNIQUE REFERENCES payment_attempts(id),
  borrow_id text NOT NULL REFERENCES borrows(id),
  provider_reference text UNIQUE,
  status text DEFAULT 'pending' NOT NULL,
  amount_minor integer NOT NULL,
  currency text NOT NULL,
  created_at text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS refunds_borrow_idx ON refunds (borrow_id);
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
  initialization ??= (async () => {
    await database.exec(executableSchemaSql)
    const columns = await database.prepare("PRAGMA table_info(users)").all<{ name: string }>()
    if (!columns.results.some((column) => column.name === "email_verified_at")) {
      await database.exec("ALTER TABLE users ADD COLUMN email_verified_at text")
    }
  })()
  return initialization
}

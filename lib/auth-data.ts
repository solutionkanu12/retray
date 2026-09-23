import { and, eq, gt, isNull, sql } from "drizzle-orm"
import { getDb } from "../db/index"
import {
  emailLoginTokens,
  emailVerificationTokens,
  rateLimitWindows,
  sessions,
  users,
  venues,
  type UserRecord,
} from "../db/schema"
import { createSessionToken, digestSessionToken, normalizeEmail } from "./auth-core"
import {
  AUTH_LINK_INVALID,
  authLinkExpiresAt,
  type EmailLinkPurpose,
  unverifiedSignupFields,
} from "./auth-email"
import { createOneTimeToken, digestOneTimeToken } from "./auth-token"
import type { AccountType } from "./circulation-domain"
import { recordRateLimitAttempt, type RateLimitAction, type RateLimitRecord } from "./rate-limit"

const SESSION_DAYS = 30

type AuthLinkDispatch = {
  email: string
  token: string
  purpose: EmailLinkPurpose
}

export async function registerAccount(input: {
  email: string
  displayName: string
  accountType: AccountType
  venueName?: string
}): Promise<AuthLinkDispatch> {
  const email = normalizeEmail(input.email)
  const displayName = requiredName(input.displayName, "Name")
  if (input.accountType !== "consumer" && input.accountType !== "business_operator") {
    throw new Error("Choose an account type.")
  }
  const venueName = input.accountType === "business_operator"
    ? requiredName(input.venueName ?? "", "Venue name")
    : null
  const db = await getDb()
  const [existing] = await db
    .select({ id: users.id, email: users.email, emailVerifiedAt: users.emailVerifiedAt })
    .from(users)
    .where(eq(users.email, email))
  if (existing) return createLinkForExistingAccount(existing)

  const userId = crypto.randomUUID()
  const verificationToken = createOneTimeToken()
  const insertUser = db.insert(users).values({
    id: userId,
    email,
    displayName,
    accountType: input.accountType,
    ...unverifiedSignupFields(),
  })
  const insertVerification = db.insert(emailVerificationTokens).values({
    tokenDigest: await digestOneTimeToken(verificationToken),
    userId,
    expiresAt: authLinkExpiresAt(),
  })
  try {
    if (venueName) {
      await db.batch([
        insertUser,
        db.insert(venues).values({ id: crypto.randomUUID(), ownerUserId: userId, name: venueName }),
        insertVerification,
      ])
    } else {
      await db.batch([insertUser, insertVerification])
    }
  } catch (error) {
    const [concurrent] = await db
      .select({ id: users.id, email: users.email, emailVerifiedAt: users.emailVerifiedAt })
      .from(users)
      .where(eq(users.email, email))
    if (!concurrent) throw error
    return createLinkForExistingAccount(concurrent)
  }
  return { email, token: verificationToken, purpose: "verification" }
}

export async function requestSignInLink(
  emailValue: string,
  clientIdentity: string,
): Promise<AuthLinkDispatch | null> {
  let email: string
  try {
    email = normalizeEmail(emailValue)
  } catch {
    return null
  }
  if (!await consumeRateLimitSlot("sign_in", email, clientIdentity)) return null
  const db = await getDb()
  const [account] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email))
  if (!account) return null
  return {
    email: account.email,
    token: await createOwnedAuthLink(emailLoginTokens, account.id),
    purpose: "sign_in",
  }
}

export async function getSessionUser(token: string | undefined): Promise<UserRecord | null> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null
  const db = await getDb()
  const digest = await digestSessionToken(token)
  const [user] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenDigest, digest), gt(sessions.expiresAt, new Date().toISOString())))
  return user?.user ?? null
}

export async function revokeSession(token: string | undefined): Promise<void> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return
  const db = await getDb()
  await db.delete(sessions).where(eq(sessions.tokenDigest, await digestSessionToken(token)))
}

export async function issueVerificationToken(user: UserRecord): Promise<string> {
  if (user.emailVerifiedAt) throw new Error("This email is already verified.")
  return createOwnedAuthLink(emailVerificationTokens, user.id)
}

export async function consumeEmailLink(token: string, purpose: EmailLinkPurpose): Promise<{ sessionToken: string }> {
  const now = new Date().toISOString()
  const digest = await digestOneTimeToken(token)
  const table = tokenTable(purpose)
  const db = await getDb()
  const [consumed] = await db
    .update(table)
    .set({ consumedAt: now })
    .where(and(
      eq(table.tokenDigest, digest),
      isNull(table.consumedAt),
      gt(table.expiresAt, now),
    ))
    .returning({ userId: table.userId })
  if (!consumed) throw new Error(AUTH_LINK_INVALID)

  const sessionToken = createSessionToken()
  await db.batch([
    db.update(users).set({
      emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, ${now})`,
      updatedAt: now,
    }).where(eq(users.id, consumed.userId)),
    db.insert(sessions).values({
      tokenDigest: await digestSessionToken(sessionToken),
      userId: consumed.userId,
      expiresAt: sessionExpiry(),
    }),
  ])
  return { sessionToken }
}

async function createLinkForExistingAccount(account: {
  id: string
  email: string
  emailVerifiedAt: string | null
}): Promise<AuthLinkDispatch> {
  const purpose: EmailLinkPurpose = account.emailVerifiedAt ? "sign_in" : "verification"
  return {
    email: account.email,
    token: await createOwnedAuthLink(tokenTable(purpose), account.id),
    purpose,
  }
}

function tokenTable(purpose: EmailLinkPurpose) {
  return purpose === "sign_in" ? emailLoginTokens : emailVerificationTokens
}

async function createOwnedAuthLink(
  table: typeof emailVerificationTokens | typeof emailLoginTokens,
  userId: string,
): Promise<string> {
  const now = new Date().toISOString()
  const token = createOneTimeToken()
  const db = await getDb()
  await db.update(table).set({ consumedAt: now }).where(and(eq(table.userId, userId), isNull(table.consumedAt)))
  await db.insert(table).values({
    tokenDigest: await digestOneTimeToken(token),
    userId,
    expiresAt: authLinkExpiresAt(),
  })
  return token
}

async function consumeRateLimitSlot(
  action: RateLimitAction,
  email: string,
  clientIdentity: string,
): Promise<boolean> {
  const now = new Date().toISOString()
  const keyDigest = await digestOneTimeToken(`${action}:${email}:${clientIdentity}`)
  const db = await getDb()
  const [current] = await db.select().from(rateLimitWindows).where(eq(rateLimitWindows.keyDigest, keyDigest))
  const next = recordRateLimitAttempt((current as RateLimitRecord | undefined) ?? null, { keyDigest, action, now })
  if (current) {
    await db.update(rateLimitWindows).set({
      action: next.record.action,
      windowStartedAt: next.record.windowStartedAt,
      attempts: next.record.attempts,
      expiresAt: next.record.expiresAt,
    }).where(eq(rateLimitWindows.keyDigest, keyDigest))
  } else {
    await db.insert(rateLimitWindows).values(next.record)
  }
  return next.allowed
}

function sessionExpiry(): string {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

function requiredName(value: string, label: string): string {
  const clean = value.trim()
  if (!clean || clean.length > 80) throw new Error(`${label} must be 1 to 80 characters.`)
  return clean
}

import { and, eq, gt, isNull } from "drizzle-orm"
import { getDb } from "../db/index"
import {
  credentials,
  emailVerificationTokens,
  passwordResetTokens,
  rateLimitWindows,
  sessions,
  users,
  venues,
  type UserRecord,
} from "../db/schema"
import { createSessionToken, digestSessionToken, hashPassword, normalizeEmail, verifyPassword } from "./auth-core"
import {
  AUTH_LINK_INVALID,
  GENERIC_SIGN_IN_ERROR,
  applyEmailVerification,
  applyPasswordReset,
  authLinkExpiresAt,
  unverifiedSignupFields,
} from "./auth-email"
import { createOneTimeToken, digestOneTimeToken } from "./auth-token"
import type { AccountType } from "./circulation-domain"
import { recordRateLimitAttempt, type RateLimitAction, type RateLimitRecord } from "./rate-limit"

const SESSION_DAYS = 30

export async function registerAccount(input: {
  email: string
  password: string
  displayName: string
  accountType: AccountType
  venueName?: string
}): Promise<{ sessionToken: string; verificationToken: string; email: string }> {
  const email = normalizeEmail(input.email)
  const displayName = requiredName(input.displayName, "Name")
  if (input.accountType !== "consumer" && input.accountType !== "business_operator") {
    throw new Error("Choose an account type.")
  }
  const venueName = input.accountType === "business_operator"
    ? requiredName(input.venueName ?? "", "Venue name")
    : null
  const credential = await hashPassword(input.password)
  const db = await getDb()
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (existing) throw new Error("This email is already in use.")

  const userId = crypto.randomUUID()
  const sessionToken = createSessionToken()
  const verificationToken = createOneTimeToken()
  const insertUser = db.insert(users).values({
    id: userId,
    email,
    displayName,
    accountType: input.accountType,
    ...unverifiedSignupFields(),
  })
  const insertCredential = db.insert(credentials).values({ userId, ...credential })
  const insertSession = db.insert(sessions).values({
    tokenDigest: await digestSessionToken(sessionToken),
    userId,
    expiresAt: sessionExpiry(),
  })
  const insertVerification = db.insert(emailVerificationTokens).values({
    tokenDigest: await digestOneTimeToken(verificationToken),
    userId,
    expiresAt: authLinkExpiresAt(),
  })
  if (venueName) {
    await db.batch([
      insertUser,
      insertCredential,
      db.insert(venues).values({ id: crypto.randomUUID(), ownerUserId: userId, name: venueName }),
      insertSession,
      insertVerification,
    ])
  } else {
    await db.batch([insertUser, insertCredential, insertSession, insertVerification])
  }
  return { sessionToken, verificationToken, email }
}

export async function signInAccount(
  emailValue: string,
  password: string,
  clientIdentity: string,
): Promise<{ sessionToken: string; emailVerified: boolean }> {
  let email: string
  try {
    email = normalizeEmail(emailValue)
  } catch {
    throw new Error(GENERIC_SIGN_IN_ERROR)
  }
  if (!await consumeRateLimitSlot("sign_in", email, clientIdentity)) {
    throw new Error(GENERIC_SIGN_IN_ERROR)
  }
  const db = await getDb()
  const [account] = await db
    .select({
      userId: users.id,
      emailVerifiedAt: users.emailVerifiedAt,
      passwordHash: credentials.passwordHash,
      passwordSalt: credentials.passwordSalt,
      passwordIterations: credentials.passwordIterations,
    })
    .from(users)
    .innerJoin(credentials, eq(users.id, credentials.userId))
    .where(eq(users.email, email))
  if (!account || !(await verifyPassword(password, account))) {
    throw new Error(GENERIC_SIGN_IN_ERROR)
  }
  return {
    sessionToken: await createSession(account.userId),
    emailVerified: Boolean(account.emailVerifiedAt),
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

export async function consumeEmailVerification(token: string): Promise<void> {
  const now = new Date().toISOString()
  const digest = await digestOneTimeToken(token)
  const db = await getDb()
  const [record] = await db
    .select()
    .from(emailVerificationTokens)
    .where(eq(emailVerificationTokens.tokenDigest, digest))
  const [user] = record
    ? await db.select().from(users).where(eq(users.id, record.userId))
    : []
  const applied = user && record ? applyEmailVerification(user, record, now) : null
  if (!applied) throw new Error(AUTH_LINK_INVALID)
  const consumed = await db
    .update(emailVerificationTokens)
    .set({ consumedAt: now })
    .where(and(
      eq(emailVerificationTokens.tokenDigest, digest),
      isNull(emailVerificationTokens.consumedAt),
      gt(emailVerificationTokens.expiresAt, now),
    ))
    .returning({ tokenDigest: emailVerificationTokens.tokenDigest, userId: emailVerificationTokens.userId })
  if (!consumed[0]) throw new Error(AUTH_LINK_INVALID)
  await db
    .update(users)
    .set({ emailVerifiedAt: applied.user.emailVerifiedAt, updatedAt: now })
    .where(eq(users.id, consumed[0].userId))
}

export async function requestPasswordReset(
  emailValue: string,
  clientIdentity: string,
): Promise<{ email: string; resetToken: string } | null> {
  let email: string
  try {
    email = normalizeEmail(emailValue)
  } catch {
    return null
  }
  if (!await consumeRateLimitSlot("password_reset", email, clientIdentity)) return null
  const db = await getDb()
  const [account] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email))
  if (!account) return null
  return { email: account.email, resetToken: await createOwnedAuthLink(passwordResetTokens, account.id) }
}

export async function completePasswordReset(token: string, password: string): Promise<void> {
  const credential = await hashPassword(password)
  const now = new Date().toISOString()
  const digest = await digestOneTimeToken(token)
  const db = await getDb()
  const [record] = await db
    .select()
    .from(passwordResetTokens)
    .where(eq(passwordResetTokens.tokenDigest, digest))
  if (!record || !applyPasswordReset(record, now)) throw new Error(AUTH_LINK_INVALID)
  const consumed = await db
    .update(passwordResetTokens)
    .set({ consumedAt: now })
    .where(and(
      eq(passwordResetTokens.tokenDigest, digest),
      isNull(passwordResetTokens.consumedAt),
      gt(passwordResetTokens.expiresAt, now),
    ))
    .returning({ userId: passwordResetTokens.userId })
  if (!consumed[0]) throw new Error(AUTH_LINK_INVALID)
  await db.batch([
    db.update(credentials).set(credential).where(eq(credentials.userId, consumed[0].userId)),
    db.delete(sessions).where(eq(sessions.userId, consumed[0].userId)),
  ])
}

async function createOwnedAuthLink(
  table: typeof emailVerificationTokens | typeof passwordResetTokens,
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

async function createSession(userId: string): Promise<string> {
  const token = createSessionToken()
  const db = await getDb()
  await db.insert(sessions).values({ tokenDigest: await digestSessionToken(token), userId, expiresAt: sessionExpiry() })
  return token
}

function sessionExpiry(): string {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()
}

function requiredName(value: string, label: string): string {
  const clean = value.trim()
  if (!clean || clean.length > 80) throw new Error(`${label} must be 1 to 80 characters.`)
  return clean
}

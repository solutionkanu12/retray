import { and, eq, gt } from "drizzle-orm"
import { getDb } from "../db/index"
import { credentials, sessions, users, venues, type UserRecord } from "../db/schema"
import { createSessionToken, digestSessionToken, hashPassword, normalizeEmail, verifyPassword } from "./auth-core"
import type { AccountType } from "./circulation-domain"

const SESSION_DAYS = 30

export async function registerAccount(input: {
  email: string
  password: string
  displayName: string
  accountType: AccountType
  venueName?: string
}): Promise<string> {
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
  const token = createSessionToken()
  const insertUser = db.insert(users).values({ id: userId, email, displayName, accountType: input.accountType })
  const insertCredential = db.insert(credentials).values({ userId, ...credential })
  const insertSession = db.insert(sessions).values({ tokenDigest: await digestSessionToken(token), userId, expiresAt: sessionExpiry() })
  if (venueName) {
    await db.batch([insertUser, insertCredential, db.insert(venues).values({ id: crypto.randomUUID(), ownerUserId: userId, name: venueName }), insertSession])
  } else {
    await db.batch([insertUser, insertCredential, insertSession])
  }
  return token
}

export async function signInAccount(emailValue: string, password: string): Promise<string> {
  let email: string
  try {
    email = normalizeEmail(emailValue)
  } catch {
    throw new Error("Email or password is incorrect.")
  }
  const db = await getDb()
  const [account] = await db
    .select({ userId: users.id, passwordHash: credentials.passwordHash, passwordSalt: credentials.passwordSalt, passwordIterations: credentials.passwordIterations })
    .from(users)
    .innerJoin(credentials, eq(users.id, credentials.userId))
    .where(eq(users.email, email))
  if (!account || !(await verifyPassword(password, account))) {
    throw new Error("Email or password is incorrect.")
  }
  return createSession(account.userId)
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

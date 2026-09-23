import { and, eq, gt, isNull, sql } from "drizzle-orm"
import { getDb } from "../db/index"
import {
  emailLoginTokens,
  emailVerificationTokens,
  oauthAuthorizationStates,
  oauthIdentities,
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
import {
  googleAuthorizationUrl,
  googleOAuthStateExpiresAt,
  resolveGoogleAccount,
  type GoogleIdentity,
  type GoogleOAuthIntent,
} from "./google-oauth"
import { recordRateLimitAttempt, type RateLimitAction, type RateLimitRecord } from "./rate-limit"

const SESSION_DAYS = 30

type AuthLinkDispatch = {
  email: string
  token: string
  purpose: EmailLinkPurpose
}

type GoogleOAuthState = {
  nonceDigest: string
  intent: GoogleOAuthIntent
  accountType: AccountType | null
  venueName: string | null
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

export async function beginGoogleOAuth(input: {
  source: Record<string, unknown>
  intent: GoogleOAuthIntent
  accountType?: AccountType
  venueName?: string
}): Promise<string> {
  const signUp = googleSignUpInput(input)
  const state = createOneTimeToken()
  const nonce = createOneTimeToken()
  const db = await getDb()
  await db.insert(oauthAuthorizationStates).values({
    stateDigest: await digestOneTimeToken(state),
    nonceDigest: await digestOneTimeToken(nonce),
    intent: input.intent,
    accountType: signUp.accountType,
    venueName: signUp.venueName,
    expiresAt: googleOAuthStateExpiresAt(),
  })
  return googleAuthorizationUrl(input.source, state, nonce)
}

export async function consumeGoogleOAuthState(state: string): Promise<GoogleOAuthState> {
  const now = new Date().toISOString()
  const db = await getDb()
  const [consumed] = await db
    .update(oauthAuthorizationStates)
    .set({ consumedAt: now })
    .where(and(
      eq(oauthAuthorizationStates.stateDigest, await digestOneTimeToken(state)),
      isNull(oauthAuthorizationStates.consumedAt),
      gt(oauthAuthorizationStates.expiresAt, now),
    ))
    .returning({
      nonceDigest: oauthAuthorizationStates.nonceDigest,
      intent: oauthAuthorizationStates.intent,
      accountType: oauthAuthorizationStates.accountType,
      venueName: oauthAuthorizationStates.venueName,
    })
  if (!consumed || (consumed.intent !== "sign_in" && consumed.intent !== "sign_up")) {
    throw new Error("Google sign-in could not be completed.")
  }
  return {
    nonceDigest: consumed.nonceDigest,
    intent: consumed.intent,
    accountType: consumed.accountType as AccountType | null,
    venueName: consumed.venueName,
  }
}

export async function completeGoogleSignIn(input: {
  identity: GoogleIdentity
  state: GoogleOAuthState
}): Promise<{ sessionToken: string }> {
  const db = await getDb()
  const [linked] = await db
    .select({ user: users })
    .from(oauthIdentities)
    .innerJoin(users, eq(oauthIdentities.userId, users.id))
    .where(and(eq(oauthIdentities.provider, "google"), eq(oauthIdentities.providerSubject, input.identity.subject)))
  const [emailUser] = await db
    .select({ id: users.id, email: users.email, accountType: users.accountType })
    .from(users)
    .where(eq(users.email, input.identity.email))
  const resolved = resolveGoogleAccount({
    linkedUser: linked?.user ?? null,
    emailUser: emailUser ?? null,
    signUp: {
      accountType: input.state.accountType ?? "consumer",
      venueName: input.state.venueName,
    },
  })

  let userId: string
  if (resolved.action === "use_linked") {
    userId = resolved.user.id
  } else if (resolved.action === "link_existing") {
    userId = await linkGoogleIdentity(resolved.user.id, input.identity)
  } else {
    userId = await createGoogleAccount(input.identity, resolved.accountType, resolved.venueName)
  }

  const now = new Date().toISOString()
  const sessionToken = createSessionToken()
  await db.batch([
    db.update(users).set({
      emailVerifiedAt: sql`coalesce(${users.emailVerifiedAt}, ${now})`,
      updatedAt: now,
    }).where(eq(users.id, userId)),
    db.insert(sessions).values({
      tokenDigest: await digestSessionToken(sessionToken),
      userId,
      expiresAt: sessionExpiry(),
    }),
  ])
  return { sessionToken }
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

function googleSignUpInput(input: {
  intent: GoogleOAuthIntent
  accountType?: AccountType
  venueName?: string
}): { accountType: AccountType | null; venueName: string | null } {
  if (input.intent === "sign_in") return { accountType: null, venueName: null }
  if (input.accountType !== "consumer" && input.accountType !== "business_operator") {
    throw new Error("Choose an account type.")
  }
  return {
    accountType: input.accountType,
    venueName: input.accountType === "business_operator"
      ? requiredName(input.venueName ?? "", "Venue name")
      : null,
  }
}

async function linkGoogleIdentity(userId: string, identity: GoogleIdentity): Promise<string> {
  const db = await getDb()
  try {
    await db.insert(oauthIdentities).values({
      id: crypto.randomUUID(),
      provider: "google",
      providerSubject: identity.subject,
      userId,
      email: identity.email,
    })
    return userId
  } catch {
    const [linked] = await db
      .select({ userId: oauthIdentities.userId })
      .from(oauthIdentities)
      .where(and(eq(oauthIdentities.provider, "google"), eq(oauthIdentities.providerSubject, identity.subject)))
    if (linked) return linked.userId
    throw new Error("Google sign-in could not be completed.")
  }
}

async function createGoogleAccount(
  identity: GoogleIdentity,
  accountType: AccountType,
  venueName: string | null,
): Promise<string> {
  const db = await getDb()
  const userId = crypto.randomUUID()
  try {
    const insertUser = db.insert(users).values({
      id: userId,
      email: identity.email,
      displayName: requiredName(identity.displayName, "Name"),
      accountType,
      emailVerifiedAt: new Date().toISOString(),
    })
    const insertIdentity = db.insert(oauthIdentities).values({
      id: crypto.randomUUID(),
      provider: "google",
      providerSubject: identity.subject,
      userId,
      email: identity.email,
    })
    if (accountType === "business_operator") {
      if (!venueName) throw new Error("Venue name must be 1 to 80 characters.")
      await db.batch([
        insertUser,
        db.insert(venues).values({
          id: crypto.randomUUID(),
          ownerUserId: userId,
          name: venueName,
        }),
        insertIdentity,
      ])
    } else {
      await db.batch([insertUser, insertIdentity])
    }
    return userId
  } catch (error) {
    const [linked] = await db
      .select({ userId: oauthIdentities.userId })
      .from(oauthIdentities)
      .where(and(eq(oauthIdentities.provider, "google"), eq(oauthIdentities.providerSubject, identity.subject)))
    if (linked) return linked.userId
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, identity.email))
    if (existing) return linkGoogleIdentity(existing.id, identity)
    throw error
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

import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import test from "node:test"

const source = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8")

test("normal signup and sign-in paths do not invoke password derivation", async () => {
  const [signup, signin, authData, authCore] = await Promise.all([
    source("app/api/auth/signup/route.ts"),
    source("app/api/auth/signin/route.ts"),
    source("lib/auth-data.ts"),
    source("lib/auth-core.ts"),
  ])
  const normalAuthSource = `${signup}\n${signin}\n${authData}\n${authCore}`

  assert.doesNotMatch(normalAuthSource, /hashPassword|verifyPassword|PBKDF2|credentials/)
})

test("passwordless screens do not collect passwords or expose reset navigation", async () => {
  const [signup, signin] = await Promise.all([
    source("app/sign-up/page.tsx"),
    source("app/sign-in/page.tsx"),
  ])

  assert.doesNotMatch(signup, /name="password"|type="password"|new-password/)
  assert.doesNotMatch(signin, /name="password"|type="password"|current-password|href="\/reset"/)
  await assert.rejects(() => source("app/reset/page.tsx"), { code: "ENOENT" })
  await assert.rejects(() => source("app/api/auth/reset/route.ts"), { code: "ENOENT" })
})

test("verification and sign-in links are backed by separate token stores", async () => {
  const authData = await source("lib/auth-data.ts")

  assert.match(authData, /emailVerificationTokens/)
  assert.match(authData, /emailLoginTokens/)
  assert.match(authData, /purpose === "sign_in" \? emailLoginTokens : emailVerificationTokens/)
})

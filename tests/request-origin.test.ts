import assert from "node:assert/strict"
import test from "node:test"
import { isSameOriginRequest } from "../lib/request-origin.ts"

test("account mutations accept only a matching Origin", () => {
  const local = "https://retray.example/api/auth/signup"
  assert.equal(isSameOriginRequest(new Request(local, { method: "POST", headers: { origin: "https://retray.example" } })), true)
  assert.equal(isSameOriginRequest(new Request(local, { method: "POST", headers: { origin: "https://other.example" } })), false)
  assert.equal(isSameOriginRequest(new Request(local, { method: "POST" })), false)
})

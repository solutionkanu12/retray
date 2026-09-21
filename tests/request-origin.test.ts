import assert from "node:assert/strict"
import test from "node:test"
import { isSameOriginRequest, requestClientIdentity } from "../lib/request-origin.ts"

test("account mutations accept only a matching Origin", () => {
  const local = "https://retray.example/api/auth/signup"
  assert.equal(isSameOriginRequest(new Request(local, { method: "POST", headers: { origin: "https://retray.example" } })), true)
  assert.equal(isSameOriginRequest(new Request(local, { method: "POST", headers: { origin: "https://other.example" } })), false)
  assert.equal(isSameOriginRequest(new Request(local, { method: "POST" })), false)
})

test("throttle keys use the connecting client identity without inventing an address", () => {
  const local = "https://retray.example/api/auth/signin"
  assert.equal(requestClientIdentity(new Request(local, { headers: { "cf-connecting-ip": "203.0.113.8" } })), "203.0.113.8")
  assert.equal(requestClientIdentity(new Request(local, { headers: { "x-forwarded-for": "198.51.100.2, 203.0.113.8" } })), "198.51.100.2")
  assert.equal(requestClientIdentity(new Request(local)), "unknown")
})

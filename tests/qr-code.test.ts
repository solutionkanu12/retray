import assert from "node:assert/strict"
import test from "node:test"

import { createQrSvg } from "../lib/qr-code.ts"

test("the QR encoder creates a deterministic version-one SVG", () => {
  const first = createQrSvg("RT024DEMO001")
  const second = createQrSvg("RT024DEMO001")

  assert.equal(first, second)
  assert.match(first, /^<svg[^>]+viewBox="0 0 29 29"/)
  assert.match(first, /<path d="M/)
})

test("the QR encoder rejects payloads that exceed the supported tag size", () => {
  assert.throws(() => createQrSvg("x".repeat(18)), /17 bytes or fewer/i)
})

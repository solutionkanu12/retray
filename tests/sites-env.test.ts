import assert from "node:assert/strict"
import test from "node:test"
import path from "node:path"
import { localWorkerSecretsPath } from "../scripts/sites-env.mjs"

test("local production start copies ignored secrets beside the Worker config", () => {
  assert.equal(localWorkerSecretsPath("C:\\retray"), path.join("C:\\retray", "dist/server/.dev.vars"))
  assert.equal(path.basename(localWorkerSecretsPath()), ".dev.vars")
})

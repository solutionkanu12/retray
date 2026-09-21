import assert from "node:assert/strict";
import test from "node:test";
import { prepareVinextDevLock } from "../scripts/vinext-dev-lock.mjs";

const root = "C:\\Users\\solution\\Documents\\retray";

function lockFor(pid: number) {
  return JSON.stringify({
    pid,
    port: 5173,
    hostname: "localhost",
    appUrl: "http://localhost:5173",
    startedAt: 1_700_000_000_000,
    cwd: root,
  });
}

test("Windows dev removes a lock whose reused PID belongs to a non-Vinext process", () => {
  const removed: string[] = [];

  const result = prepareVinextDevLock({
    command: "dev",
    platform: "win32",
    root,
    readFile: () => lockFor(1972),
    removeFile: (path) => removed.push(String(path)),
    lookupProcess: () => ({
      name: "svchost.exe",
      commandLine: "C:\\WINDOWS\\system32\\svchost.exe -k netsvcs",
      creationTimeMs: 1_699_000_000_000,
    }),
  });

  assert.equal(result, "removed-stale-lock");
  assert.deepEqual(removed, [`${root}\\.vinext\\dev\\lock.json`]);
});

test("Windows dev preserves a lock held by this project's Vinext process", () => {
  let removed = false;

  const result = prepareVinextDevLock({
    command: "dev",
    platform: "win32",
    root,
    readFile: () => lockFor(2468),
    removeFile: () => {
      removed = true;
    },
    lookupProcess: () => ({
      name: "node.exe",
      commandLine: `"C:\\Program Files\\nodejs\\node.exe" scripts/run-framework.mjs dev`,
      creationTimeMs: 1_699_999_999_000,
    }),
  });

  assert.equal(result, "kept-active-lock");
  assert.equal(removed, false);
});

test("Windows dev removes a lock when the PID was reused by a newer process", () => {
  let removed = false;

  const result = prepareVinextDevLock({
    command: "dev",
    platform: "win32",
    root,
    readFile: () => lockFor(2468),
    removeFile: () => {
      removed = true;
    },
    lookupProcess: () => ({
      name: "node.exe",
      commandLine: "node scripts/run-framework.mjs dev",
      creationTimeMs: 1_700_000_010_000,
    }),
  });

  assert.equal(result, "removed-stale-lock");
  assert.equal(removed, true);
});

test("builds and non-Windows dev do not inspect the lock", () => {
  let reads = 0;
  const readFile = () => {
    reads += 1;
    return lockFor(1972);
  };

  assert.equal(prepareVinextDevLock({ command: "build", platform: "win32", root, readFile }), "not-applicable");
  assert.equal(prepareVinextDevLock({ command: "dev", platform: "linux", root, readFile }), "not-applicable");
  assert.equal(reads, 0);
});

test("an explicit Vinext lock bypass is preserved", () => {
  let reads = 0;

  const result = prepareVinextDevLock({
    command: "dev",
    platform: "win32",
    root,
    env: { VINEXT_NO_DEV_LOCK: "1", NODE_ENV: "test" },
    readFile: () => {
      reads += 1;
      return lockFor(1972);
    },
  });

  assert.equal(result, "explicit-bypass");
  assert.equal(reads, 0);
});

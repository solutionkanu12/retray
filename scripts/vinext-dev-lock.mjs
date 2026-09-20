import { readFileSync, unlinkSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const LOCK_TIME_TOLERANCE_MS = 2_000;

function parseLock(content) {
  try {
    const lock = JSON.parse(content);
    if (
      Number.isInteger(lock.pid)
      && lock.pid > 0
      && Number.isFinite(lock.startedAt)
      && typeof lock.cwd === "string"
    ) {
      return lock;
    }
  } catch {}

  return undefined;
}

function lookupWindowsProcess(pid) {
  const script = [
    `$process = Get-CimInstance Win32_Process -Filter \"ProcessId = ${pid}\"`,
    "if ($null -ne $process) {",
    "  [pscustomobject]@{",
    "    name = $process.Name",
    "    commandLine = $process.CommandLine",
    "    creationTimeMs = ([DateTimeOffset]$process.CreationDate).ToUnixTimeMilliseconds()",
    "  } | ConvertTo-Json -Compress",
    "}",
  ].join("\n");
  const result = spawnSync("powershell.exe", [
    "-NoProfile",
    "-NonInteractive",
    "-Command",
    script,
  ], {
    encoding: "utf8",
    windowsHide: true,
  });

  if (result.status !== 0 || !result.stdout.trim()) return undefined;

  try {
    const processInfo = JSON.parse(result.stdout);
    return {
      name: typeof processInfo.name === "string" ? processInfo.name : "",
      commandLine: typeof processInfo.commandLine === "string" ? processInfo.commandLine : "",
      creationTimeMs: Number(processInfo.creationTimeMs),
    };
  } catch {
    return undefined;
  }
}

function isVinextDevProcess(lock, processInfo) {
  if (!/^node(?:\.exe)?$/i.test(processInfo.name)) return false;
  if (
    Number.isFinite(processInfo.creationTimeMs)
    && processInfo.creationTimeMs > lock.startedAt + LOCK_TIME_TOLERANCE_MS
  ) {
    return false;
  }

  const commandLine = processInfo.commandLine.replaceAll("\\", "/");
  return /(?:^|[\s"'])scripts\/run-framework\.mjs[\s"']+dev(?:[\s"']|$)/i.test(commandLine)
    || /(?:^|[\s"'/])vinext\/dist\/cli\.js[\s"']+dev(?:[\s"']|$)/i.test(commandLine);
}

export function prepareVinextDevLock({
  command,
  platform = process.platform,
  root = process.cwd(),
  env = process.env,
  readFile = (filePath) => readFileSync(filePath, "utf8"),
  removeFile = unlinkSync,
  lookupProcess = lookupWindowsProcess,
}) {
  if (command !== "dev" || platform !== "win32") return "not-applicable";
  if (env.VINEXT_NO_DEV_LOCK === "1") return "explicit-bypass";

  const lockPath = path.join(root, ".vinext", "dev", "lock.json");
  let lockContent;
  try {
    lockContent = readFile(lockPath);
  } catch {
    return "no-lock";
  }

  const lock = parseLock(lockContent);
  if (!lock) return "invalid-lock";

  const processInfo = lookupProcess(lock.pid);
  if (!processInfo) return "process-missing";
  if (isVinextDevProcess(lock, processInfo)) return "kept-active-lock";

  try {
    const currentLock = parseLock(readFile(lockPath));
    if (!currentLock || currentLock.pid !== lock.pid || currentLock.startedAt !== lock.startedAt) {
      return "lock-changed";
    }
    removeFile(lockPath);
    return "removed-stale-lock";
  } catch {
    return "remove-failed";
  }
}

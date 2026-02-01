#!/usr/bin/env node
/**
 * Minimal bootstrap that ensures warning suppression flags are set in NODE_OPTIONS
 * BEFORE loading any modules that might trigger deprecation warnings.
 *
 * This file intentionally has minimal imports to avoid loading modules that use
 * deprecated APIs (like punycode via node-fetch → tr46) before the respawn.
 */
import { spawn } from "node:child_process";
import process from "node:process";

// Note: These flags are also defined in daemon/service-env.ts as SERVICE_NODE_OPTIONS.
// We duplicate here to avoid importing modules that might trigger warnings before respawn.
const SUPPRESSED_WARNINGS = [
  "--disable-warning=ExperimentalWarning",
  "--disable-warning=DEP0040", // punycode deprecation (node-fetch → tr46)
];

function hasWarningSuppressed(nodeOptions: string): boolean {
  if (!nodeOptions) {
    return false;
  }
  if (nodeOptions.includes("--no-warnings")) {
    return true;
  }
  return SUPPRESSED_WARNINGS.every((flag) => nodeOptions.includes(flag));
}

function shouldRespawn(): boolean {
  if (process.env.OPENCLAW_NO_RESPAWN === "1") {
    return false;
  }
  if (process.env.OPENCLAW_NODE_OPTIONS_READY === "1") {
    return false;
  }
  const nodeOptions = process.env.NODE_OPTIONS ?? "";
  return !hasWarningSuppressed(nodeOptions);
}

if (shouldRespawn()) {
  // Set flags and respawn before loading any heavy modules
  const nodeOptions = process.env.NODE_OPTIONS ?? "";
  process.env.OPENCLAW_NODE_OPTIONS_READY = "1";
  process.env.NODE_OPTIONS = `${nodeOptions} ${SUPPRESSED_WARNINGS.join(" ")}`.trim();

  const child = spawn(process.execPath, [...process.execArgv, ...process.argv.slice(1)], {
    stdio: "inherit",
    env: process.env,
  });

  child.once("exit", (code, signal) => {
    process.exit(signal ? 1 : (code ?? 1));
  });

  child.once("error", (error) => {
    console.error(
      "[openclaw] Failed to respawn CLI:",
      error instanceof Error ? (error.stack ?? error.message) : error,
    );
    process.exit(1);
  });
} else {
  // NODE_OPTIONS is ready, load the real entry point
  import("./entry.js");
}

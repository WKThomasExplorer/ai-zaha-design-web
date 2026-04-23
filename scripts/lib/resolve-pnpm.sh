#!/usr/bin/env bash
# Resolve the pnpm CLI: use global pnpm if present, otherwise Corepack (see AGENTS.md: Node.js 24).
# Sets PNPM as a bash array so callers can use: "${PNPM[@]}" <args...>
# shellcheck disable=SC2034
resolve_pnpm() {
  if command -v pnpm >/dev/null 2>&1; then
    PNPM=(pnpm)
  elif command -v corepack >/dev/null 2>&1; then
    PNPM=(corepack pnpm)
  else
    echo "pnpm not found. Install Node.js 24+ and run: corepack enable" >&2
    return 1
  fi
}

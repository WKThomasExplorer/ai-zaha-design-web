#!/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/lib/resolve-pnpm.sh"

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"
cd "${COZE_WORKSPACE_PATH}"

resolve_pnpm || exit 1

# Vercel: dependencies are already installed; only Next.js output is used (no custom Node server).
# See https://vercel.com/docs/projects/environment-variables/system-environment-variables
if [ "${VERCEL:-}" = "1" ]; then
  echo "Vercel build: next build only"
  "${PNPM[@]}" next build
  exit 0
fi

echo "Installing dependencies..."
# Non-interactive (avoids pnpm "reinstall node_modules?" prompts in scripts/CI)
CI=1 "${PNPM[@]}" install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

echo "Building the Next.js project..."
"${PNPM[@]}" next build

echo "Bundling server with tsup..."
"${PNPM[@]}" tsup src/server.ts --format cjs --platform node --target node24 --outDir dist --no-splitting --no-minify

echo "Build completed successfully!"

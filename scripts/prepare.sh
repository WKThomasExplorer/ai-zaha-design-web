#!/bin/bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$SCRIPT_DIR/lib/resolve-pnpm.sh"

COZE_WORKSPACE_PATH="${COZE_WORKSPACE_PATH:-$(pwd)}"

cd "${COZE_WORKSPACE_PATH}"

resolve_pnpm || exit 1

echo "Installing dependencies..."
CI=1 "${PNPM[@]}" install --prefer-frozen-lockfile --prefer-offline --loglevel debug --reporter=append-only

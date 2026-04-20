#!/usr/bin/env bash
# Wrapper that guarantees preview_start / launch.json entries run under a
# Node version that satisfies package.json "engines": ">=22.12.0", regardless
# of the shell's default node. Resolution order:
#   1. $NODE_BIN env (explicit override)
#   2. nvm's cached node >=22 (prefer highest installed)
#   3. whatever `node` is already on PATH (last-resort — may warn/fail on <22)
#
# Pick once at startup, export PATH so every child process (tsx, prisma,
# native-addon rebuilds) inherits the same runtime.
set -euo pipefail

pick_node_bin() {
  if [ -n "${NODE_BIN:-}" ] && [ -x "$NODE_BIN" ]; then
    printf '%s' "$NODE_BIN"
    return
  fi

  local nvm_root="${NVM_DIR:-$HOME/.nvm}/versions/node"
  if [ -d "$nvm_root" ]; then
    # Highest installed version that is >= 22. Sort -V handles "v24" > "v22" > "v20".
    local candidate
    candidate=$(ls "$nvm_root" 2>/dev/null \
      | awk -F. '{ v=$1; sub(/^v/, "", v); if (v+0 >= 22) print $0 }' \
      | sort -V \
      | tail -1 || true)
    if [ -n "$candidate" ] && [ -x "$nvm_root/$candidate/bin/node" ]; then
      printf '%s' "$nvm_root/$candidate/bin/node"
      return
    fi
  fi

  command -v node
}

NODE_BIN_PATH=$(pick_node_bin)
NODE_BIN_DIR=$(dirname "$NODE_BIN_PATH")
export PATH="$NODE_BIN_DIR:$PATH"

exec "$NODE_BIN_DIR/npm" "$@"

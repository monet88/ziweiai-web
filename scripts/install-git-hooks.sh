#!/usr/bin/env bash
# Install repo git hooks (secret/binary guard). Safe to re-run.
# Skip outside a git checkout (e.g. Vercel deploy uploads without .git).
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
if ! git -C "$root" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Skipping git hooks install (not a git work tree)."
  exit 0
fi
chmod +x "$root/.githooks/pre-commit"
git -C "$root" config core.hooksPath .githooks
echo "Installed core.hooksPath=.githooks"
echo "Pre-commit will block .env, keys, zip/apk/aab/ipa/mp4, and secret-like content."

#!/usr/bin/env bash
# Install repo git hooks (secret/binary guard). Safe to re-run.
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
chmod +x "$root/.githooks/pre-commit"
git -C "$root" config core.hooksPath .githooks
echo "Installed core.hooksPath=.githooks"
echo "Pre-commit will block .env, keys, zip/apk/aab/ipa/mp4, and secret-like content."

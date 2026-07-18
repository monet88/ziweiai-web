#!/usr/bin/env zsh
set -euo pipefail

DOMAIN="tuvitoantap.vercel.app"
EXPECTED_USER="galaxypro710-7060"

source "${HOME}/.zshrc" >/dev/null 2>&1 || true

if [[ -z "${VERCEL_GALAXY:-}" ]]; then
  echo "Missing VERCEL_GALAXY. Add the galaxypro710 Vercel token to ~/.zshrc." >&2
  exit 1
fi

# Prevent the generic token from shadowing the project-scoped token in Vercel CLI.
unset VERCEL_TOKEN

actual_user="$(npx --yes vercel@latest whoami --token "${VERCEL_GALAXY}" | tail -n 1)"
if [[ "${actual_user}" != "${EXPECTED_USER}" ]]; then
  echo "Wrong Vercel account: expected ${EXPECTED_USER}, got ${actual_user}." >&2
  exit 1
fi

deploy_log="$(mktemp)"
trap 'rm -f "${deploy_log}"' EXIT

npx --yes vercel@latest deploy --prod --yes --token "${VERCEL_GALAXY}" | tee "${deploy_log}"

deployment_url="$(
  sed -nE 's/.*"url": "(https:\/\/[^"]+)".*/\1/p' "${deploy_log}" | tail -n 1
)"

if [[ -z "${deployment_url}" ]]; then
  deployment_url="$(
    sed -E 's/\x1b\[[0-9;]*m//g' "${deploy_log}" \
      | awk '/Production[[:space:]]+https:\/\// { print $2 }' \
      | tail -n 1
  )"
fi

if [[ -z "${deployment_url}" ]]; then
  echo "Could not find production deployment URL in Vercel output." >&2
  exit 1
fi

npx --yes vercel@latest alias set "${deployment_url}" "${DOMAIN}" --token "${VERCEL_GALAXY}"
npx --yes vercel@latest inspect "https://${DOMAIN}" --token "${VERCEL_GALAXY}"

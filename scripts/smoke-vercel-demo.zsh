#!/usr/bin/env zsh
set -euo pipefail

DOMAIN="${VERCEL_DEMO_DOMAIN:-tuvitoantap.vercel.app}"
EXPECTED_USER="${VERCEL_DEMO_EXPECTED_USER:-galaxypro710-7060}"
CHART_ROUTE_ID="${VERCEL_DEMO_SMOKE_CHART_ID:-0391944a-50dd-44ae-ba2b-3d784c8b757e}"
BASE_URL="https://${DOMAIN}"

source "${HOME}/.zshrc" >/dev/null 2>&1 || true

if [[ -f ".env.local" ]]; then
  export $(grep '^VERCEL_GALAXY=' .env.local | xargs)
fi

if [[ -z "${VERCEL_GALAXY:-}" ]]; then
  echo "Missing VERCEL_GALAXY. Add the galaxypro710 Vercel token to ~/.zshrc." >&2
  exit 1
fi

# Prevent the generic token from shadowing the project-scoped token in Vercel CLI.
unset VERCEL_TOKEN

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1" >&2
    exit 1
  fi
}

require_command curl
require_command npx

check() {
  local label="$1"
  shift
  printf "==> %s\n" "${label}"
  "$@"
}

confirm_vercel_account() {
  local actual_user

  actual_user="$(npx --yes vercel@latest whoami --token "${VERCEL_GALAXY}" | tail -n 1)"
  if [[ "${actual_user}" != "${EXPECTED_USER}" ]]; then
    echo "Wrong Vercel account: expected ${EXPECTED_USER}, got ${actual_user}." >&2
    exit 1
  fi

  echo "Vercel account: ${actual_user}"
}

http_status() {
  local method="$1"
  local url="$2"
  curl -sS -L -o /dev/null -w "%{http_code}" -X "${method}" "${url}"
}

assert_http_200() {
  local label="$1"
  local method="$2"
  local url="$3"
  local code

  code="$(http_status "${method}" "${url}")"
  if [[ "${code}" != "200" ]]; then
    echo "${label} failed: expected HTTP 200, got ${code} for ${url}" >&2
    exit 1
  fi

  echo "${label}: HTTP ${code}"
}

check "Confirm Vercel account" confirm_vercel_account

check "Inspect production alias" \
  npx --yes vercel@latest inspect "${BASE_URL}" --token "${VERCEL_GALAXY}"

check "Root page" assert_http_200 "Root page" "GET" "${BASE_URL}/"
check "API health" assert_http_200 "API health" "GET" "${BASE_URL}/api/health"
check "API features" assert_http_200 "API features" "GET" "${BASE_URL}/api/features"
check "SPA fallback for chart detail" assert_http_200 "Chart route fallback" "GET" "${BASE_URL}/charts/${CHART_ROUTE_ID}"

headers="$(curl -sS -I -L "${BASE_URL}/charts/${CHART_ROUTE_ID}")"
if ! printf "%s" "${headers}" | grep -qi 'content-disposition:.*index\.html'; then
  echo "Chart route fallback failed: expected content-disposition to mention index.html." >&2
  printf "%s\n" "${headers}" >&2
  exit 1
fi

echo "Chart route fallback: index.html confirmed"
echo "Vercel demo smoke passed for ${BASE_URL}"

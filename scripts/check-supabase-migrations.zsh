#!/usr/bin/env zsh
set -euo pipefail

MIGRATIONS_DIR="${SUPABASE_MIGRATIONS_DIR:-apps/api/supabase/migrations}"
SUPABASE_PROJECT_DIR="${SUPABASE_PROJECT_DIR:-apps/api}"

if [[ ! -d "${MIGRATIONS_DIR}" ]]; then
  echo "Missing migrations directory: ${MIGRATIONS_DIR}" >&2
  exit 1
fi

typeset -a migration_files
migration_files=("${MIGRATIONS_DIR}"/*.sql(N))

if (( ${#migration_files[@]} == 0 )); then
  echo "No migration files found in ${MIGRATIONS_DIR}" >&2
  exit 1
fi

typeset -A seen_versions
typeset -a versions
duplicate_found=0

for file_path in "${migration_files[@]}"; do
  file_name="${file_path:t}"
  if [[ ! "${file_name}" =~ '^[0-9]+_[a-z0-9][a-z0-9_-]*\.sql$' ]]; then
    echo "Invalid migration filename: ${file_name}" >&2
    echo "Expected: <numeric-version>_<kebab-or-snake-name>.sql" >&2
    exit 1
  fi

  version="${file_name%%_*}"
  if [[ -n "${seen_versions[${version}]:-}" ]]; then
    echo "Duplicate migration version ${version}: ${seen_versions[${version}]} and ${file_name}" >&2
    duplicate_found=1
  fi

  seen_versions[${version}]="${file_name}"
  versions+=("${version}")
done

if (( duplicate_found != 0 )); then
  exit 1
fi

echo "Local migration files: ${#migration_files[@]}"
printf "Versions: %s\n" "${(j:, :)versions}"

previous_number=-1
for version in "${versions[@]}"; do
  current_number=$((10#${version}))
  if (( previous_number >= 0 && current_number > previous_number + 1 )); then
    echo "Warning: migration version gap between ${previous_number} and ${current_number}."
  fi
  previous_number=${current_number}
done

if [[ "${SUPABASE_VERIFY_LINKED:-0}" != "1" ]]; then
  echo "Linked Supabase ledger check skipped. Set SUPABASE_VERIFY_LINKED=1 to run supabase migration list --linked."
  exit 0
fi

if ! command -v supabase >/dev/null 2>&1; then
  echo "SUPABASE_VERIFY_LINKED=1 but supabase CLI is not installed or not on PATH." >&2
  exit 1
fi

echo "Running linked Supabase migration ledger check..."
if [[ ! -f "${SUPABASE_PROJECT_DIR}/supabase/config.toml" ]]; then
  echo "Missing Supabase config: ${SUPABASE_PROJECT_DIR}/supabase/config.toml" >&2
  echo "Set SUPABASE_PROJECT_DIR to the directory that contains supabase/config.toml." >&2
  exit 1
fi

(cd "${SUPABASE_PROJECT_DIR}" && supabase migration list --linked)

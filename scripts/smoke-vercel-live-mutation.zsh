#!/usr/bin/env zsh
set -euo pipefail

DOMAIN="${VERCEL_DEMO_DOMAIN:-tuvitoantap.vercel.app}"
BASE_URL="https://${DOMAIN}"

source "${HOME}/.zshrc" >/dev/null 2>&1 || true

if [[ "${LIVE_MUTATION_SMOKE:-}" != "1" || "${LIVE_MUTATION_SMOKE_CONFIRM:-}" != "${DOMAIN}" ]]; then
  cat <<EOF
Live mutation smoke skipped.

This command writes to Supabase production and calls the real AI provider.
Run only after explicit approval:

  LIVE_MUTATION_SMOKE=1 LIVE_MUTATION_SMOKE_CONFIRM=${DOMAIN} pnpm smoke:vercel-live-mutation

Optional cleanup, if SUPABASE_SERVICE_ROLE_KEY is available in the environment:

  LIVE_MUTATION_SMOKE_CLEANUP=1 LIVE_MUTATION_SMOKE=1 LIVE_MUTATION_SMOKE_CONFIRM=${DOMAIN} pnpm smoke:vercel-live-mutation
EOF
  exit 0
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Missing required command: node" >&2
  exit 1
fi

node --input-type=module <<'NODE'
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createClient } from '@supabase/supabase-js';

const rootEnvPath = join(process.cwd(), '.env');
if (existsSync(rootEnvPath) && typeof process.loadEnvFile === 'function') {
  process.loadEnvFile(rootEnvPath);
}

const domain = process.env.VERCEL_DEMO_DOMAIN || 'tuvitoantap.vercel.app';
const baseUrl = `https://${domain}`;
const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const shouldCleanup = process.env.LIVE_MUTATION_SMOKE_CLEANUP === '1';

function fail(message, extra) {
  console.error(message);
  if (extra) {
    console.error(extra);
  }
  process.exit(1);
}

function requireEnv(name, value) {
  if (!value || value.trim() === '') {
    fail(`Missing ${name}. Load the same PUBLIC_* Supabase env used by the Vercel demo.`);
  }
}

function assert(condition, message, extra) {
  if (!condition) {
    fail(message, extra);
  }
}

async function readJson(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    fail(`Expected JSON response from ${response.url}, got non-JSON body.`, text.slice(0, 500));
  }
}

async function apiFetch(path, token, init = {}) {
  const response = await fetch(`${baseUrl}/api${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  const body = await readJson(response);
  if (!response.ok) {
    fail(`API ${init.method ?? 'GET'} ${path} failed with HTTP ${response.status}.`, JSON.stringify(body, null, 2));
  }
  return body;
}

requireEnv('PUBLIC_SUPABASE_URL', supabaseUrl);
requireEnv('PUBLIC_SUPABASE_ANON_KEY', supabaseAnonKey);

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: authData, error: authError } = await supabase.auth.signInAnonymously();
if (authError) {
  fail(`Supabase anonymous sign-in failed: ${authError.message}`);
}

const accessToken = authData.session?.access_token;
const ownerUserId = authData.user?.id;
assert(accessToken, 'Supabase anonymous sign-in did not return an access token.');
assert(ownerUserId, 'Supabase anonymous sign-in did not return a user id.');

let chartId = null;
let explanationProvider = null;

try {
  const question = `Smoke production Lục Hào ${new Date().toISOString()}: dự án có vận hành ổn không?`;
  const divination = await apiFetch('/divinations', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      chartSystem: 'liu-yao',
      question,
      purposeKey: 'career',
      castMethod: 'time',
    }),
  });

  chartId = divination?.chartRecord?.id;
  assert(chartId, 'Divination response did not include chartRecord.id.', JSON.stringify(divination, null, 2));
  assert(divination?.snapshot?.chartSystem === 'liu-yao', 'Divination snapshot is not liu-yao.', JSON.stringify(divination?.snapshot, null, 2));
  assert(Boolean(divination?.snapshot?.liuyao), 'Divination snapshot does not include snapshot.liuyao.', JSON.stringify(divination?.snapshot, null, 2));
  assert(
    divination?.snapshot?.calculationConfidence?.blocksExactReading !== true,
    'Divination snapshot blocks exact reading; explanation must not be called.',
    JSON.stringify(divination?.snapshot?.calculationConfidence, null, 2),
  );

  const detail = await apiFetch(`/charts/${chartId}`, accessToken);
  assert(detail?.chartRecord?.id === chartId, 'Chart detail did not return the created chart id.', JSON.stringify(detail, null, 2));

  const explanation = await apiFetch('/explanations', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      chartSnapshotId: chartId,
      explanationKind: 'overview',
      providerPreference: 'auto',
      userConsentedToStorePrompt: false,
    }),
  });

  explanationProvider = explanation?.result?.providerName ?? explanation?.result?.providerMetadata?.provider ?? null;
  const markdown = explanation?.result?.renderedMarkdown;
  assert(typeof markdown === 'string' && markdown.trim().length > 80, 'Explanation markdown is missing or too short.', JSON.stringify(explanation, null, 2));
  assert(explanation?.request?.chartSnapshotId === chartId, 'Explanation request did not target the created chart.', JSON.stringify(explanation?.request, null, 2));

  console.log('Live mutation smoke passed.');
  console.log(`chartId=${chartId}`);
  console.log(`ownerUserId=${ownerUserId}`);
  console.log(`provider=${explanationProvider ?? 'unknown'}`);
} finally {
  if (shouldCleanup) {
    if (!serviceRoleKey) {
      console.warn('LIVE_MUTATION_SMOKE_CLEANUP=1 but SUPABASE_SERVICE_ROLE_KEY is missing; created data was not cleaned.');
    } else if (ownerUserId) {
      const admin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const { error } = await admin.auth.admin.deleteUser(ownerUserId);
      if (error) {
        console.warn(`Cleanup failed for ownerUserId=${ownerUserId}: ${error.message}`);
      } else {
        console.log(`Cleanup deleted anonymous auth user ${ownerUserId}; user-owned rows should cascade.`);
      }
    }
  } else {
    console.warn('Cleanup disabled. Set LIVE_MUTATION_SMOKE_CLEANUP=1 with SUPABASE_SERVICE_ROLE_KEY to delete the anonymous smoke user after the run.');
  }
}
NODE

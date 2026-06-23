# Decisions

Decision records explain why important product, architecture, or harness choices
were made.

## Index hiện có

| ID | Tiêu đề | Status |
| --- | --- | --- |
| `0001-harness-first-development` | Harness-first development | Accepted |
| `0002-post-spec-product-lifecycle` | Post-spec product lifecycle | Accepted |
| `0003-generic-spec-intake-harness` | Generic spec intake harness | Accepted |
| `0004-sqlite-durable-layer` | SQLite durable layer | Accepted |
| `0005-prebuilt-rust-harness-cli` | Prebuilt Rust harness CLI | Accepted |
| `0006-spec-vs-code-naming` | SPEC vs code naming (nguồn sự thật) | Accepted |
| `0007-web-server-boundary` | Web/server import boundary | Accepted |
| `0008-contracts-dual-esm-cjs` | Contracts dual ESM/CJS build | Accepted |
| `0009-anonymous-auth-strategy` | Anonymous auth strategy (planned) | Accepted |
| `0010-premium-ai-entitlement-flag` | Premium AI entitlement flag (planned) | Accepted |
| `0016-supabase-cloud-environment` | Chuyển Supabase local sang Supabase Cloud | Accepted |

Use `docs/templates/decision.md` when adding a new decision.

After adding or updating a markdown decision file, also add or refresh the
durable decision row:

```bash
scripts/bin/harness-cli decision add \
  --id 0008-contracts-dual-esm-cjs \
  --title "Contracts dual ESM/CJS build" \
  --doc docs/decisions/0008-contracts-dual-esm-cjs.md
```

Trace fields such as `--decisions` summarize task-level choices. They do not
count as the Harness decision log.

Add a decision when:

- A locked technical choice changes.
- A product rule changes meaningfully.
- A validation requirement is added, removed, or weakened.
- A high-risk feature chooses one design over another.
- Auth, authorization, data ownership, audit/security, or API behavior changes.
- The source-of-truth hierarchy changes.

# Stories

Stories are work packets. They turn product intent into bounded implementation
and validation work.

## Story packets hiện có

Trạng thái proof sống: `scripts/bin/harness-cli query matrix`.

| Epic | Story | Trạng thái |
| --- | --- | --- |
| E01-web-foundation | `US-001-scaffold-web-foundation` | implemented |
| E02-auth | `US-002-auth-client-only-route-guard` | implemented |
| E03-pure-logic-i18n | `US-003-pure-logic-i18n-tokens` | implemented |
| E04-ui-primitives | `US-004-ui-primitives-scaffold` | implemented |
| E05-dashboard | `US-005-dashboard-and-birth-form` | implemented |
| E06-ziwei-detail | `US-006-ziwei-chart-detail-and-explanation` | implemented |
| E07-other-systems-history | `US-007-other-systems-and-history` | implemented |
| E08-ziwei-visual-board | `US-008-ziwei-visual-board` | planned |
| E09-anonymous-access | `US-009-anonymous-access` | planned |
| E10-premium-ai-gating | `US-010-premium-ai-gating` | planned |

## Normal Story

Use `docs/templates/story.md` for normal feature work.

Suggested path:

```text
docs/stories/epics/E01-domain-name/US-001-short-story-title.md
```

## High-Risk Story

Use `docs/templates/high-risk-story/` when the feature intake classifies work as
high-risk.

Suggested path:

```text
docs/stories/epics/E02-risky-domain/US-012-risky-story-title/
  execplan.md
  overview.md
  design.md
  validation.md
```

## Status Flow

```text
planned -> in_progress -> implemented
                  |
                  v
               changed
                  |
                  v
               retired
```

# Stories

Stories are work packets. They turn product intent into bounded implementation
and validation work.

## Story packets hiện có

Trạng thái dưới đây là operational snapshot ngày 2026-07-12, đối chiếu từ
code/tests/routes hiện có. Một số story packet con vẫn còn dòng `## Status:
planned`; đó là doc drift cần dọn khi có thời gian. Binary harness được nhắc
trong docs cũ hiện không có trong workspace.

| Epic | Story | Trạng thái |
| --- | --- | --- |
| E01-web-foundation | `US-001-scaffold-web-foundation` | implemented |
| E02-auth | `US-002-auth-client-only-route-guard` | implemented |
| E03-pure-logic-i18n | `US-003-pure-logic-i18n-tokens` | implemented |
| E04-ui-primitives | `US-004-ui-primitives-scaffold` | implemented |
| E05-dashboard | `US-005-dashboard-and-birth-form` | implemented |
| E06-ziwei-detail | `US-006-ziwei-chart-detail-and-explanation` | implemented |
| E07-other-systems-history | `US-007-other-systems-and-history` | implemented |
| E08-ziwei-visual-board | `US-008-ziwei-visual-board` | implemented in code/tests |
| E08-ziwei-visual-board | `US-011-ziwei-aspect-lines` | implemented |
| E09-anonymous-access | `US-009-anonymous-access` | implemented in code/tests |
| E10-premium-ai-gating | `US-010-premium-ai-gating` | implemented in code/tests |
| E12-ziwei-star-coloring | `US-012-ziwei-star-coloring` | implemented in code/tests |
| E13-anon-quota-persistence | `US-013-anon-quota-persistence` | implemented in code/tests |
| E14-ziwei-flow-info | `US-014-ziwei-flow-info` | implemented in code/tests |
| E15-ziwei-horoscope-panel | `US-015-ziwei-horoscope-panel` | implemented in code/tests |
| E16-time-fortune-reports | `US-016-time-fortune-reports` | implemented in code/tests |
| E17-extended-divination-systems | `US-017 extended systems + B6 follow-ups` | implemented in code/tests |
| E18-ai-conversation | `US-018-ai-conversation` | implemented in code/tests |
| E19-monetization-premium | `overview` | deferred |
| E20-supabase-cloud | `US-019-supabase-cloud-migration` | implemented |
| E21-e2e-stabilization | `US-020-e2e-ziwei-flow-stabilization` | implemented |
| E22-website-redesign | `US-041-luvsa-inspired-website-redesign` | in_progress |

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

# Implementation Notes — Sprint 74: Conversion Funnel Boost, In-App Notifications & User Retention

## 1. Unspecified & Implicit Decisions
- **In-App Notification Center:**
  - Designed as a sliding Drawer (Celestial Luxury design) toggled by a Bell button (`NotificationBell.svelte`) in both `AppScaffold.svelte` and `+page.svelte` header.
  - Notifications are fed by `GET /notifications/in-app` in `apps/api` (aggregating `xu_transactions` like topups, daily checkin, referral reward, feature usage) plus real-time wallet balance listeners.
  - Read states are stored in `localStorage` (`vios_read_notifications`) to preserve unread badges without needing heavy synchronous database writes on every click.
- **One-Click Quick Topup Modal:**
  - Upgraded `GlobalPaywallModal.svelte` from a simple redirect prompt into a full in-place topup modal.
  - Embedded dynamic VietQR generator (`https://qr.sepay.vn/img?acc=...&bank=...&amount=...&des=TVTT%20<SHORT_UUID>`).
  - Implemented auto-polling and Supabase Realtime detection every 2.5s: when balance increments or reaches the required XU amount, the modal immediately displays a celebratory checkmark and lets the user proceed without leaving their page.
- **Gamification & Daily Check-in Streak:**
  - Implemented `DailyCheckinWidget.svelte` with a 7-day progression timeline (Days 1–6: +5 XU, Day 7 Milestone Jackpot: +10 XU).
  - Maintained full backward compatibility with the existing `daily_checkin` RPC and added migration `000028_daily_checkin_streak.sql`.
  - Added `@Get('rewards/status')` to return check-in status, streak count, and today's reward amount.
  - Protected check-in interactions with Cloudflare Turnstile anti-bot verification.

## 2. Deviations from Specification
- None. All requested features (In-App Notification Bell & Drawer, One-click Topup Modal with dynamic VietQR, and Daily Check-in Streak Widget) were implemented faithfully according to the approved plan.

## 3. Considered Trade-offs
- **Client-side vs Server-side Notification Read Tracking:**
  - *Chosen approach:* Storing read IDs in local storage while fetching user event history from the backend ledger.
  - *Trade-off:* Avoids needing a dedicated `notification_reads` table migration and heavy write traffic for read receipts, while providing an instant, zero-latency UX for marking items as read.
- **In-Modal Topup vs Separate Page:**
  - *Chosen approach:* Integrating the VietQR dynamic payment directly into `GlobalPaywallModal` with an option to open `/wallet`.
  - *Trade-off:* Reduces friction to 0 clicks away from payment; users don't lose their context (chart configuration, divination spread, etc.).

## 4. Maintenance Notes
- **Testing & Gates:**
  - API vitest: 84 test suites (528 tests) passing.
  - Web vitest: 72 test suites (389 tests) passing.
  - Svelte check: 0 errors, 0 warnings.
  - Typecheck: 10/10 packages passing.
  - Web build: Passing clean static bundle.
- **Dependencies & Environment:**
  - Uses `env.PUBLIC_SEPAY_ACCOUNT` and default bank ACB config from `bank-config.ts`.
  - Anti-bot Turnstile widget gracefully bypasses in dev/test if keys are absent.

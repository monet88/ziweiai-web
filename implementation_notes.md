# Implementation Notes — Light/Dark Theme, Admin UX & Wallet Polish

**Date**: 2026-07-24  
**Commit**: `fe3810a`

---

## 1. Unspecified & Implicit Decisions

1. **Theme Persistence & Default State**:
   - Implemented `themeStore` (`apps/web/src/lib/stores/theme.svelte.ts`) with Svelte 5 runes (`$state`).
   - Default theme is explicitly set to `'light'` (Notion Paper-Calm theme) as requested.
   - Persistence is managed via `localStorage.getItem('ziweiai_theme')`.
   - The theme attribute `data-theme="dark"` is applied to `document.documentElement`, cascading CSS variables across all components seamlessly.

2. **Admin Dashboard User Filtering**:
   - Added `badge-anon` label `"Vãng lai (Anon)"` for users without `full_name` or `email` created automatically via Supabase Anonymous Auth sessions (`signInAnonymously()`).
   - Added interactive filter tabs: `"Tất cả người dùng"` vs `"Có Email"`.

3. **Wallet Navigation**:
   - Added `"← Trang chủ"` action button on the Header of `/wallet` page using `AppScaffold`'s `action` snippet.

---

## 2. Deviations from Specification

- None. All requested features (Theme Switcher with Light default, Wallet Navigation, Admin Anonymous User labeling, Wayfinder Roadmap) were implemented strictly according to requirements without unnecessary bloat.

---

## 3. Considered Trade-offs

- **Theme Toggle Location**: Placed `ThemeToggle` inside `AppScaffold`'s `hero-actions` right next to `WalletIndicator` for immediate visibility across all main app screens without clogging mobile headers.
- **CSS Custom Property Cascade vs Separate CSS Files**: Mapped `[data-theme="dark"]` to the existing `.theme-mystical` token variables in `tokens.css` to avoid duplicate CSS bundles or external theme stylesheet fetching.

---

## 4. Maintenance & Testing Notes

- **Svelte Check**: `pnpm -F @ziweiai/web check` -> **0 errors, 0 warnings**.
- **Playwright Smoke Test**: `pnpm -F @ziweiai/web exec playwright test smoke.spec.ts` -> **7/7 PASS (100%)**.
- **Git Hygiene**: `skills-lock.json` and `.agents/` remain untracked/uncommitted as instructed.

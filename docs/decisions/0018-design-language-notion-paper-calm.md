# 0018 DESIGN.md Notion paper-calm la design language chinh thuc; bo theme dark+gold

Date: 2026-06-24

## Status

Accepted

## Context

Repo co hai nguon design xung dot nhau:

- Root `DESIGN.md` (format Google Stitch) mo ta he Notion paper-calm: nen
  giay off-white (`#f6f5f4`), chu gan den tren Inter, mot accent xanh
  cau truc (`#0075de`), elevation bang hairline + bong rat mo, mot bang
  sticker palette nhieu mau CHI dung trang tri.
- `apps/web/src/lib/theme/tokens.css` (he dang chay that) la dark + gold:
  nen `#0b0b0d`, chu kem `#f3f0e7`, accent vang `#c8b780` + tim AI
  `#6e5fa6`, cac token sao/tu hoa/van han deu tune cho NEN TOI.

Sau khi viet `PRODUCT.md` (init) va chay `$impeccable critique` (bao cao
`plans/reports/24-06-2026-apps-web-design-critique.md`, diem 25/40), user
da xac nhan huong di: DESIGN.md Notion la dich; theme dark+gold la
anti-reference. `PRODUCT.md` ghi ro 3 anti-reference lien quan: app boi
toan loe loet, loi mon "huyen bi u toi" (dark+gold/neon/bua chu), va dung
mau sac so lam mau cau truc.

Rang buoc bat bien giu nguyen: toan bo tieng Viet, 0 chu Han (CJK guard +
test quet `\p{Script=Han}` tren `build/`), web bundle chi `PUBLIC_*` +
`@ziweiai/contracts`. Day la thay doi naming contract + invariant truc
quan (color/typography/radius) nen phai record decision (AGENTS.md).

Token `--color-accent-gold*` hien KHONG chi trang tri: no mang vai tro
cau truc (vien o `selected`, highlight cung `in-aspect` US-011, mau focus
ring `--color-accent-gold-soft` o khap noi, nen nut `PrimaryButton`). Vi
vay khong the chi doi gia tri ma giu ten.

## Decision

Lay DESIGN.md (Notion paper-calm) lam design language chinh thuc cho
`apps/web`. Theme dark+gold bi deprecated va thay the hoan toan trong mot
dot re-theme:

1. **Dung lai tang token** (`tokens.ts` + `tokens.css`) theo DESIGN.md:
   canvas sang + surface trang, ink gan den, hairline `#e6e6e6`; radius
   ve thang 4/8/12/16 (them `xs 4`); spacing them `xxs 4`, `lg 24`,
   `xl 28`.
2. **Doi ten token theo ngu nghia, bo han chu "gold"** (Phuong an 1, da
   duyet). Vai tro cau truc (selection / active / focus / primary action)
   dung `--color-accent-primary` (Notion blue) + `--color-accent-primary-soft`
   cho focus ring. Nhu cau trang tri dung sticker palette Notion
   (`--color-accent-purple-deep`, `-orange`, `-teal`, ...). Xoa han
   `--color-accent-gold`, `--color-accent-gold-soft`, `--color-border-gold`
   va cap nhat moi consumer.
3. **Khong giu mau vang.** Neu can tong am/tram, map sang
   `--color-accent-orange` / `-orange-deep` / `-brown` cua sticker palette
   Notion, khong tai dung gia tri gold cu.
4. **Tinh lai toan bo token mau ngu nghia cho nen sang + verify AA:** 7
   muc sang tinh dau (US-012), 4 tu hoa, malefic, 4 tang van han (US-014),
   outline horoscope (US-015). Cac gia tri nay dang tune cho nen toi nen
   phai tinh lai, giu tach mau ro va contrast >= WCAG AA.
5. **Tarot ve chuan calm.** Bo font Georgia (serif), bo box-shadow glow,
   bo dai nen toi; gap vao he card chung (hairline + bong tiet che). Diem
   nhan chi qua sticker (`--color-accent-purple-deep`). Khong pha cau truc
   paper-calm de "dac biet hoa" Tarot.
6. **Typography:** self-host Inter, dat lam body font toan cuc, ap bang
   tracking am cua DESIGN.md cho heading + thang type co dinh kieu product
   (khong fluid clamp).
7. **Dep slop tells:** giam cadence eyebrow xuong vi tri co chu dich thay
   vi rai moi section; gop mau danger ve mot token duy nhat (hien dang
   hardcode 3 kieu: `#c0392b`, `#c0564a`, `--color-accent-danger`).

Cac file lach token phai sua thu cong (khong inherit tu tang token):
`routes/sign-in/+page.svelte`, `routes/(app)/+layout.svelte`,
`MonthlyFortuneCard`, `DailyFortuneCard`, `AnnualReportButton`,
`ZiweiHoroscopePanel`, `Spinner.svelte`, `PrimaryButton.svelte`.

## Alternatives Considered

1. Giu ten token `--color-accent-gold` nhung gan gia tri xanh. Bo: ten
   bien noi doi voi gia tri (broken windows) -> hoang mang bao tri va moi
   mau vang quay lai. -> chon doi ten theo ngu nghia.
2. Chi sua sign-in + app-shell loader (2 P1), giu dark+gold cho phan con
   lai. Bo: identity van mau thuan PRODUCT.md o moi man hinh. -> re-theme
   toan bo.
3. Giu Tarot bespoke (serif + glow) lam diem nhan rieng. Bo: dung trung
   anti-reference "huyen bi u toi". -> quy ve chuan calm.
4. Regenerate DESIGN.md tu code dark+gold hien tai (`$impeccable document`).
   Bo: chep lai chinh cai can bo. -> giu DESIGN.md Notion lam canonical.

## Consequences

Positive:

- Mot nguon su that truc quan duy nhat (DESIGN.md) khop voi PRODUCT.md.
- Phan lon component (da dung `var(--*)`) tu nhan theme moi khi doi tang
  token; chi cac file lach token can sua tay.
- Ten token ngu nghia (primary/decorative) chong drift mau vang quay lai.
- Bo serif/glow/dark band -> het cac slop tell + loi mon huyen bi.

Tradeoffs:

- Churn nhieu file do rename `gold -> primary/decorative` (find-and-replace
  an toan, de review, nhung dien rong).
- Toan bo token mau ngu nghia phai tinh + verify AA lai tu dau cho nen
  sang; ty le kem-tren-toi cu khong chuyen sang duoc.
- Phai self-host Inter (them asset font) va kiem lai contrast/responsive
  bang browser sau re-theme.

## Follow-Up

- Story re-theme: `intake` + `story add` cho dot nay; `story update` sau
  khi build/check/lint + Han scan + e2e coloring (US-012/014/015) chay
  green; `trace` cuoi task.
- Cap nhat `DESIGN.md` neu giu lai bat ky token feature-scoped nao (vd
  Tarot) sau khi quy ve calm.
- Re-run `$impeccable critique` sau khi sua de xac nhan diem cai thien;
  verify contrast tren nen sang truoc khi ship.

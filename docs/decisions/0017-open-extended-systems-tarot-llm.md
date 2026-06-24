# 0017 Mo toan bo 6 he mo rong + Tarot frontend/LLM + kanxiang prompt

Date: 2026-06-23

## Status

Proposed

## Context

Khung E17 (US-017) da dung xong: 12 gia tri `chartSystem`, 4 schema ket
qua moi, 6 co `EXTENDED_SYSTEM_<HEPAN|MANGPAI|TAROT|MBTI|FACE|PALM>_ENABLED`
(mac dinh `false`, fail-closed), 4 nhom endpoint (`/pairings`,
`/quizzes/mbti`, `/draws/tarot`, `/vision/{face|palm}`). Tat ca 6 he da
co backend; 5 he co route web (hepan, mangpai, mbti, face, palm), rieng
Tarot CHUA co frontend.

Trang thai thuc te tren prod (kiem 2026-06-23):

- `GET https://api.tuvi.monet.uno/features` tra ve TAT CA `false`, nen
  cac he mo rong bi an khoi dashboard nav (fail-closed) va endpoint gated
  tra 403 `FEATURE_DISABLED`.
- `ExtendedSystemNav.svelte` chi liet ke 3 link: `mangpai`, `face`,
  `palm`. Hai he `hepan`, `mbti` da co route + man hinh nhung KHONG nam
  trong nav -> khong co loi vao tren dashboard.
- Tarot: backend `POST /draws/tarot` deterministic (rut bai + seed +
  78 la), nhung `narrative` hien la van ban DETERMINISTIC (chua wire LLM
  that). Khong co route `/tarot`, khong co `features/tarot`, khong co
  `drawTarot` trong api-client; registry danh dau `tarot: 'unsupported'`.
- UI con sot nhan pha phat trien cu "GIAI DOAN 6" (vi.ts heroEyebrow +
  subtitle chi tiet la so) va subtitle ky thuat lap lai
  ("Dung cung luong nhap du lieu sinh hien co...") o cac he.
- Face/Palm vision da co prompt tieng Viet (`vision-prompts.ts`, port loi
  tu taibu) nhung con so so; sap mo cong public nen can lam "chuyen gia"
  hon.

Da khao sat read-only 8 repo trong `.ref/`: `tarot-skill`,
`chatgpt-tarot-divination`, `bazi-ziwei-skill`, `zhouwenwang`,
`FateAtelier`, `mingyu`, `palmistry`, `kanxiang`. Ket luan: don bay chat
luong lon nhat la PROMPT (khong phai engine), vi nhieu he van dang
deterministic. Engine 5 he kia da chay (xuanshu-runtime + iztro) nen
KHONG dong vao.

## Decision

Mo toan bo 6 he mo rong cho nguoi dung that trong 1 dot (1 PR), gom 4
thay doi behavior/boundary di cung nhau:

1. **Bat 6 co tren prod (vinh vien).** Sua root `.env` server
   `EXTENDED_SYSTEM_*_ENABLED=true` cho ca 6 he, restart `ziwei-api`,
   verify `GET /features` tra ve all true. Day la thay doi boundary: mo
   feature gate (Face/Palm AI cost lo ra public, van duoc chan boi
   identity + vision quota + co free-for-all beta).
2. **Dung Tarot frontend.** Route `/tarot` + `TarotScreen` + model runes
   + `drawTarot` api-client + copy `viCopy.tarot`. Dung ANH BAI THAT: 78
   anh Rider-Waite copy tu `.ref/taibu/public/tarot_cards/` vao
   `apps/web/static/tarot/`, doi ten khop id backend; la nguoc xoay 180
   bang CSS. Ho tro 2 kieu trai bai (three-card / celtic-cross).
3. **Wire LLM cho narrative Tarot.** Them `tarot-prompts.ts` (prompt
   tieng Viet, dich/chat loc tu `tarot-skill/references/*` + nghia 78 la
   tu mingyu/FateAtelier), goi qua AI provider chain san co. GIU phan rut
   bai (seed + cards) deterministic; chi narrative thanh LLM-generated.
   Giu thu tu gate: FEATURE_DISABLED 403 -> assertCanUseAiExplanation 402
   -> quota 429; co free-for-all van bypass gate AI trong beta.
4. **Boi dap prompt Face/Palm bang kanxiang (prompt-only).** Mo rong
   `vision-prompts.ts` voi tri thuc dich tieng Viet tu
   `kanxiang/references/{shouxiang,mianxiang}.md` (tam dinh / ngu quan
   cho tuong mat; duong chinh / dang ngon / go ban tay cho chi tay).
   Khong doi frontend, khong them thu vien, khong them endpoint.

Kem theo: them `hepan`, `mbti`, `tarot` vao `EXTENDED_LINKS`
(`ExtendedSystemNav`); viet lai subtitle 5 he chinh + mangpai + cac he
mo rong cho de hieu; go nhan "GIAI DOAN 6".

Bat bien: TOAN BO tieng Viet, 0 chu Han (CJK guard + no-han scan test
ep). Tarot render mode GIU `unsupported` o registry (Tarot co luong UX
rieng o `/tarot`, khong nhet vao chart-detail chung).

## Alternatives Considered

1. Chi mo co + Tarot frontend, narrative van deterministic. Bo: Tarot ra
   mat "vo hon", thua so voi digesty.vn/tarot. -> chon wire LLM.
2. Tach Tarot LLM + kanxiang thanh PR/dot rieng. Bo: deu la prompt-only,
   rui ro thap, va cung phuc vu viec "mo cong public" -> gop 1 dot cho
   nhanh + 1 lan deploy.
3. Port engine/algorithm tu mingyu/bazi-ziwei thay vi prompt. Bo: trung
   engine dang chay -> rui ro thuan tang. -> chi port DATA/PROMPT.
4. Port pipeline ML palmistry (PyTorch 54MB) de ve duong chi tay. Bo:
   nang ha tang tren box 1.9GB RAM, va LLM da doc duoc anh goc. ->
   defer (backlog B4, dung MediaPipe JS neu lam).

## Consequences

Positive:

- Nguoi dung thay + dung duoc ca 6 he mo rong ngay tren dashboard.
- Tarot ra mat chinh chu (anh that + luan giai AI tieng Viet).
- Face/Palm doc "chuyen gia" hon ngay khi mo public, chi ton cong dich
  prompt.
- Tach biet sach: Tarot co route rieng, registry giu `unsupported`.

Tradeoffs:

- Mo Face/Palm public lam lo chi phi AI vision (chap nhan; co identity +
  quota + free-for-all beta chan).
- Them anh tinh ~2-3MB vao bundle web (static/tarot).
- Them 1 LLM call (Tarot narrative) -> latency/cost; gioi han do dai
  narrative trong prompt + dung lai provider chain + quota.

## Follow-Up

- Backlog B1 (prompt bat tu/tu vi), B2 (enrich bat tu), B4 (ve duong chi
  tay MediaPipe), B5 (them trai bai tarot), B6 (he tinh nang moi). Xem
  `plans/extended-systems-backlog.md`.
- Sau deploy: smoke test live + anh bang chung cho tung he.

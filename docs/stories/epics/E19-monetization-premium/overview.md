# E19 Monetization & Premium Unlock (deferred)

## Status

planned — deferred. Khoi cong sau khi backlog tinh nang hien tai hoan tat
(US-017d/e/f vision + manh phai, US-018 AI conversation). Ghi nhan o day de
giu lai dinh huong va pham vi, KHONG implement ngay.

## Boi canh

Lop tinh toan + AI luan giai cua app da day du (lap la so, 12 cung, dai/tieu van,
bao cao nam, lich su, 6 he mo rong). Cai con thieu so voi tham chieu thuong mai
`ai.xemtuvi.vn` (luong: xem la so mien phi -> bam "Dat mua luan giai" -> thanh toan
QR -> mo khoa luan giai tung cung) la **toan bo tang kiem tien**:

- Vi XU / so du credit (vd hien thi "7.500+", goi 80-180 XU).
- Goi mua + mo khoa luan giai theo tung cung / tung muc (Tai Loc, Phu Quy, tuy chinh
  tick tung muc 50 XU...).
- Trang thai "Luan giai chua duoc mo" -> mo khoa sau khi tra tien, luu ben.
- Thanh toan QR VietQR + ma don hang + xac nhan da tra (webhook ngan hang hoac
  doi soat sao ke). Tham chieu dung tai khoan ACB, sinh QR qua `img.vietqr.io`,
  vd don 169.000d, noi dung CK = ma don hang, auto hoan tat khi tra du.

Hien repo chi co mot cong tac toan cuc `AI_EXPLANATION_FREE_FOR_ALL`
(decision 0010): `true` = free het, `false` = chan sach tra 402 `PAYMENT_REQUIRED`
nhung khong co nguon "da mua" de mo lai. Tuc la chua co khai niem mo-khoa-tung-phan
hay nguon entitlement that. Decision 0010 da ghi ro phan nay "de sau".

## Tham chieu hinh dang san pham (URL de mo lai)

Cac URL nguoi dung cung cap lam moc tham chieu khi kickoff (chi cho thay *hinh dang*
luong/UX, KHONG suy ra duoc backend cua ho):

- Lap la so mien phi (tuvi.vn):
  `https://tuvi.vn/lap-la-so-tu-vi`
- Trang la so day du voi query mau (tuvi.vn):
  `https://tuvi.vn/la-so-duong-nam-am-duong-nghich-ly-2-12-1910-ngo-13405?thang-xem=5&nam-xem=2026&day=1&hour=12&min=30&month=1&name=le+minh+thang&year=1911&option=1`
- Xem la so + luan tong quan mien phi, cac cung chi tiet khoa lai ("Luan giai chua
  duoc mo") (ai.xemtuvi.vn):
  `https://ai.xemtuvi.vn/la-so-tu-vi/TUCE2IZRD5.html`
- Trang dat mua / thanh toan: chon goi hoac tick tung muc, thanh toan QR VietQR,
  ma don hang, auto hoan tat khi tra du (ai.xemtuvi.vn):
  `https://ai.xemtuvi.vn/la-so-tu-vi/purchase/TUCE2IZRD5.html`

Quan sat tu trang purchase (snapshot 2026-06-21): goi Pho thong/Nang cao, cac goi
Tai Loc 100 XU / Phu Quy 150 XU / Gia Dinh 180 XU / Tat Ach 80 XU + goi Tuy Chinh
tick tung muc 50 XU (Suc khoe, Nha cua, Tien tai, Cong danh, Tinh duyen, Anh chi em,
Con cai, Ban be, Dong ho, Di chuyen, nam+thang cu the); xac nhan tong XU truoc khi tra;
lich su la so vua lap luu tam 30 ngay.

## Pham vi du kien (planned stories)

| Story | Muc tieu | Risk |
| --- | --- | --- |
| US-019 | Vi XU / so du credit: bang so du + ledger, gan user (login-only de nap), API doc so du | high-risk |
| US-020 | Entitlement mo khoa luan giai theo tung cung / goi: thay cong tac all-or-nothing bang nguon entitlement that, gate trong `ExplanationsService` doc entitlement theo `palaceScope` | high-risk |
| US-021 | Thanh toan nap XU qua VietQR: don hang + sinh QR + xac nhan da tra (webhook/doi soat) + mo khoa tu dong | high-risk |

Thu tu phu thuoc: US-019 (vi) -> US-021 (nap tien vao vi) -> US-020 (tieu vi de mo khoa),
hoac US-019 + US-020 truoc (entitlement) roi US-021 noi thanh toan. Chot khi kickoff.

## Hard gates (theo docs/FEATURE_INTAKE.md)

Initiative nay cham nhieu hard gate -> bat buoc lane high-risk, can story packet
high-risk (execplan/overview/design/validation) + decision record khi kickoff:

- Auth: nap tien / so du gan voi tai khoan that (anon co the chua du).
- Authorization: chi chu so huu moi tieu duoc so du / mo khoa la so cua minh.
- Data model: bang credit balance + ledger + orders + entitlements, uniqueness, retention.
- Audit/security: lich su giao dich, chong double-spend, idempotency thanh toan.
- External systems: cong thanh toan / VietQR / webhook ngan hang.
- Public contracts: them ma loi, response so du, trang thai don hang -> sua `packages/contracts`.

## Open questions (chot luc kickoff)

- Mo hinh tien: XU/credit noi bo hay tinh tien truc tiep tung la so?
- Don vi mo khoa: theo tung cung, theo goi co san, hay ca hai (nhu tham chieu)?
- Cong thanh toan: VietQR tinh + doi soat sao ke thu cong, hay tich hop cong tu dong
  (webhook)? Anh huong lon den US-021 va yeu cau audit.
- Anon co duoc mua khong, hay bat buoc login truoc khi nap? (lien quan decision 0009).
- Cache-hit (luan giai da sinh) co tinh tien lai khong? (decision 0010 de mo cho US nay).

## Lien ket

- Decision 0010 (`docs/decisions/0010-premium-ai-entitlement-flag.md`) — Follow-Up:
  "Khi tich hop thanh toan: them nguon entitlement that (column/bang) + dao flag ve `false`".
- Decision 0009 (`docs/decisions/0009-anonymous-auth-strategy.md`) — anon van la user;
  nang cap len email la duong tien hoa tu nhien khi can gan giao dich vao danh tinh that.

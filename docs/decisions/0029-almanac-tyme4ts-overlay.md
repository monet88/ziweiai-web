# 0029 Hoang lich (#48) dung tyme4ts + bang dich Han->Viet overlay

Date: 2026-06-27

## Status

Accepted

## Context

Backlog #48 (Hoang lich / chon ngay tot) la he B6 net-new cuoi cua dot nay.
Khac ba he truoc (Lenormand/Giai mong/Xin xam) vi du lieu KHONG phai mot dataset
tinh dich san duoc: hoang lich phai TINH theo lich (nghi/ky, than sat, 12 truc,
28 sao, 9 sao, Banh To bach ky, can chi, sinh tieu) cho tung ngay duong lich.
Tu viet lai phan toan lich am la rui ro cao va lech chuan. Source tham khao noi
bo (.ref/mingyu/.../almanac.ts) dung thu vien tyme4ts (6tail) de tinh.

## Decision

1. Dung tyme4ts (1.5.2) lam engine tinh lich cho he Hoang lich. Them dependency
   vao apps/api. Math cua thu vien GIU NGUYEN, khong sua noi bo.

2. Viet hoa = lop OVERLAY, khong dong vao thu vien. tyme4ts xuat ra mot tap tu
   vung Han HUU HAN (538 chuoi unique: nghi 108, ky 79, than sat 142, 12 truc,
   12 sao hoang dao, 28 sao, 9 sao, Banh To 60, can chi 60, sinh tieu 12, dia
   chi 12, huong sat 4). Thu hoach toan bo tu vung nay bang cach chay thu vien
   qua dai ngay nhieu nam, gom chuoi Han, dich MOT LAN qua pipeline B6-0
   (scripts/translate, US-033) -> bang tra Han->Viet commit kem (du lieu cua ta).
   Module wrapper map moi output cua thu vien qua bang truoc khi roi module;
   Han-gate fail-fast neu gap bat ky chuoi chua dich.

3. Pham vi v1: BO phan phan tich xung khac sinh tieu/ngay sinh cua nguoi tham gia
   (xung sinh tieu / xung nhat chi) vi no keo vao baziCalculator. v1 = chon ngay
   tot theo chu de (cuoi hoi / chuyen nha / khai truong / ky hop dong / xuat hanh
   / kham chua benh / hoc tap / tuy chon) + cham diem theo do khop nghi/ky + AI
   luan giai. Phan tich xung khac nguoi tham gia -> v2.

## Data pipeline

Tu vung Han thu hoach tu tyme4ts duoc dich mot lan luc port qua pipeline B6-0
roi nhung dang TS module auto-generated (almanac-vocab-data.ts: bang Han->Viet).
Bang da qua Han-scan (gia tri Viet 0 chu Han). Wrapper tra ket qua da Viet hoa.

## Consequences

chartSystems enum giu nguyen (he B6 dung endpoint rieng theo decision 0028).
Them dependency runtime tyme4ts vao apps/api (truoc day chi co o .ref). Bang dich
la tap dong: neu nang cap tyme4ts lam xuat hien chuoi Han moi, Han-gate se fail
-> phai chay lai job thu hoach + dich. Phan xung khac nguoi tham gia hoan v2.

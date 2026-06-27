# 0028 He B6 dung endpoint rieng, khong nhoi vao chartSystems enum

Date: 2026-06-27

## Status

Accepted

## Context

Backlog #26 (B6 net-new) phan ra nhieu epic con. Ba he dau - Lenormand (#45),
Giai mong (#42), Xin xam (#47) - deu thuoc khuon "rut/lap + AI luan" giong
draws-tarot. chartSystems enum la public contract rang buoc nang (invariant
nhan 12 he, no-han test, render registry, POST /charts gioi han o
implementedChartSystems). Ba he B6 khong dung mo hinh birth-input -> engine ->
snapshot cua charts.

## Decision

Moi he B6 di theo khuon draws-tarot, KHONG nhoi vao chartSystems enum:
contract rieng (lenormand-draw, dream-interpretation, stick-draw); endpoint
rieng (POST /draws/lenormand, /dreams/interpret, /draws/stick); co rieng default
false (EXTENDED_SYSTEM_LENORMAND/DREAM/STICKS_ENABLED), co tat -> 403
FEATURE_DISABLED; GET /features tra them 3 co; AI gate + quota tai dung khuon
tarot (gate premium truoc quota, namespace counter rieng, fallback template khi
provider loi).

## Data pipeline

Du lieu nguon Han dich sang Viet mot lan luc port qua pipeline B6-0
(scripts/translate, US-033) roi nhung dang TS module auto-generated (*-data.ts)
vi api build CommonJS (khong import.meta / copy asset). Dataset da qua Han-scan.

## Consequences

chartSystems enum giu 12 gia tri (blast radius nho). Moi he lap lai it
boilerplate 3 tang nhung tach bach, bat/tat doc lap. #46 dat ten / #48 hoang
lich KHONG dich qua pipeline duoc nen can quyet rieng.

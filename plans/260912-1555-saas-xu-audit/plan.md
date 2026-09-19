# Audit mức sẵn sàng bán XU

- Trạng thái: audit hoàn tất; paid launch NO-GO cho tới khi đóng các gate P0.
- Outcome: đánh giá độc lập kinh tế XU, chi phí AI, security, UX và mức sẵn sàng SaaS của tuvitoantap.online.
- Constraints: giữ nguyên thay đổi đang có; không in secrets; không sửa auth/payment/production hoặc tạo giao dịch thật trong audit.
- Non-goals: deploy, push, refactor diện rộng trước khi chứng minh lỗi và chốt chính sách tiền.
- Acceptance: mỗi finding có owner source/line, severity, evidence level, tái hiện hoặc test gap; bảng free/paid và unit economics có giả định rõ; fresh tests và live read-only evidence; backlog fix theo rủi ro.

## Các nhánh kiểm tra

1. Economy: checkin/referral/ledger/payment/SQL ACL — agent economy.
2. AI/security: mọi provider call, token/quota/billing/retry — agent ai_security.
3. UX/testing: wallet/reward/payment lifecycle, web check/unit/E2E — agent ux_tests.
4. Tổng hợp: giá provider chính thức, live availability, economics scenarios, báo cáo và kế hoạch gia cố — controller.

## Bằng chứng

Báo cáo chi tiết ở `../reports/economy-260912-1555-xu-audit.md` và
`../reports/saas-readiness-260912-1605-xu-security-audit.md`. Báo cáo đầu vào
là các tuyên bố cần kiểm chứng, không phải trạng thái đã xác nhận.

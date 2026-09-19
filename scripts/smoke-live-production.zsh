#!/usr/bin/env zsh
set -euo pipefail

# ==============================================================================
# TỬ VI TOÀN TẬP (ViOS) — LIVE PRODUCTION SMOKE TEST
# Domain: https://tuvitoantap.online
# ==============================================================================

DOMAIN="${LIVE_DOMAIN:-tuvitoantap.online}"
BASE_URL="https://${DOMAIN}"

echo "======================================================================"
echo "⚡ KHỞI ĐỘNG LIVE PRODUCTION SMOKE TEST: ${BASE_URL}"
echo "======================================================================"

http_status() {
  local method="$1"
  local url="$2"
  shift 2
  curl -sS -o /dev/null -w "%{http_code}" -X "${method}" "$@" "${url}"
}

assert_status() {
  local expected="$1"
  local label="$2"
  local method="$3"
  local url="$4"
  shift 4

  printf "  [..] Kiểm tra %s (%s %s)... " "${label}" "${method}" "${url}"
  local code
  code="$(http_status "${method}" "${url}" "$@")"
  if [[ "${code}" != "${expected}" ]]; then
    printf "\n❌ FAILED: Kỳ vọng HTTP %s nhưng nhận được %s\n" "${expected}" "${code}" >&2
    exit 1
  fi
  printf "✅ PASS (HTTP %s)\n" "${code}"
}

# 1. Kiểm tra Root Landing Page
assert_status "200" "Trang chủ ViOS Root" "GET" "${BASE_URL}/"

# 2. Kiểm tra API Health & Features
assert_status "200" "API Health Endpoint" "GET" "${BASE_URL}/api/health"
health_body="$(curl -sS "${BASE_URL}/api/health")"
if [[ "${health_body}" != *"\"status\":\"ok\""* ]]; then
  echo "❌ API Health trả về nội dung không đúng: ${health_body}" >&2
  exit 1
fi
echo "      -> API Status: OK"

assert_status "200" "API Features Flags" "GET" "${BASE_URL}/api/features"
features_body="$(curl -sS "${BASE_URL}/api/features")"
if [[ "${features_body}" != *"\"hepan\":true"* ]]; then
  echo "❌ API Features thiếu cờ hepan: ${features_body}" >&2
  exit 1
fi
echo "      -> Features: All active"

# 3. Kiểm tra Public Static Routes & SEO Assets
assert_status "200" "Trang Nạp XU /pricing" "GET" "${BASE_URL}/pricing"
assert_status "200" "Trang Ví Hoàng Gia /wallet" "GET" "${BASE_URL}/wallet"
assert_status "200" "Sitemap XML" "GET" "${BASE_URL}/sitemap.xml"
assert_status "200" "Robots TXT" "GET" "${BASE_URL}/robots.txt"
assert_status "200" "Favicon" "GET" "${BASE_URL}/favicon.png"
assert_status "200" "Default OG Image" "GET" "${BASE_URL}/og-image.png"

# 4. Kiểm tra An Ninh Cổng Thanh Toán SePay VietQR (Fail-Closed)
# Gọi Webhook không có API Secret hợp lệ phải trả về 401 Unauthorized
printf "  [..] Kiểm tra An Ninh Webhook SePay (Fail-Closed)... "
webhook_code="$(curl -sS -o /dev/null -w "%{http_code}" -X POST "${BASE_URL}/api/webhooks/sepay" \
  -H "Content-Type: application/json" \
  -d '{"id":999999,"gateway":"Vietcombank","amountIn":20000}')"

if [[ "${webhook_code}" == "401" ]]; then
  printf "✅ PASS (HTTP 401 Unauthorized - An toàn bảo mật)\n"
else
  printf "\n❌ FAILED: Webhook không chặn request trái phép! HTTP %s\n" "${webhook_code}" >&2
  exit 1
fi

# 5. Kiểm tra Luồng Viral Social Share & Bot Crawler
printf "  [..] Kiểm tra Bot Crawler OpenGraph (/share/ref/SMOKETEST)... "
bot_html="$(curl -sS -A "facebookexternalhit/1.1 (compatible; zend_http_client)" "${BASE_URL}/share/ref/SMOKETEST")"

if [[ "${bot_html}" == *"<meta property=\"og:image\""* ]] && [[ "${bot_html}" == *"SMOKETEST"* ]]; then
  printf "✅ PASS (Thẻ OpenGraph đầy đủ cho Facebook/Zalo)\n"
else
  printf "\n❌ FAILED: Bot không nhận được thẻ OpenGraph hợp lệ!\n" >&2
  echo "${bot_html}" >&2
  exit 1
fi

# 6. Kiểm tra Luồng Chuyển Hướng Người Thật (Human 302 Redirect)
printf "  [..] Kiểm tra Chuyển Hướng Người Dùng Thật (302 Redirect)... "
redirect_header="$(curl -sS -I "${BASE_URL}/share/ref/SMOKETEST" | grep -i '^location:')"

if [[ "${redirect_header}" == *"?ref=SMOKETEST"* ]]; then
  printf "✅ PASS (Chuyển hướng chính xác đến %s)\n" "$(echo "${redirect_header}" | tr -d '\r\n')"
else
  printf "\n❌ FAILED: Chuyển hướng không đúng location!\n" >&2
  echo "${redirect_header}" >&2
  exit 1
fi

# 7. Kiểm tra Dynamic OG Image Generation
printf "  [..] Kiểm tra Sinh Ảnh OpenGraph Động (/api/og/ref/SMOKETEST)... "
og_headers="$(curl -sS -I "${BASE_URL}/api/og/ref/SMOKETEST")"
content_type="$(echo "${og_headers}" | grep -i '^content-type:' | tr -d '\r\n')"
content_length="$(echo "${og_headers}" | grep -i '^content-length:' | awk '{print $2}' | tr -d '\r\n')"

if [[ "${content_type}" == *"image/png"* ]] && [[ -n "${content_length}" ]] && [[ "${content_length}" -gt 10000 ]]; then
  printf "✅ PASS (Content-Type: %s, Size: %s bytes)\n" "${content_type}" "${content_length}"
else
  printf "\n❌ FAILED: Endpoint sinh ảnh không trả về ảnh PNG hợp lệ!\n" >&2
  echo "${og_headers}" >&2
  exit 1
fi

echo "======================================================================"
echo "🎉 TẤT CẢ 12 CHECK LIVE PRODUCTION SMOKE ĐỀU ĐẠT CHUẨN 100%!"
echo "======================================================================"

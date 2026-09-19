#!/usr/bin/env bash
# ==============================================================================
# Script: split-mobile-repo.sh
# Mục đích: Trích xuất an toàn thư mục apps/mobile sang một nhánh Git độc lập
#          giữ nguyên 100% lịch sử commit (Git Subtree Split) để push lên repo mới.
# Dự án: Tử Vi Toàn Tập (ziweiai-web -> ziweiai-mobile)
# ==============================================================================

set -euo pipefail

BRANCH_NAME="mobile-standalone"
PREFIX_DIR="apps/mobile"

echo "======================================================================"
echo "🚀 KHỞI ĐỘNG QUY TRÌNH PHÂN TÁCH FLUTTER MOBILE SANG REPO ĐỘC LẬP"
echo "======================================================================"

# 1. Kiểm tra thư mục apps/mobile tồn tại
if [ ! -d "$PREFIX_DIR" ]; then
  echo "❌ Lỗi: Không tìm thấy thư mục $PREFIX_DIR trong repo hiện tại!"
  exit 1
fi

# 2. Kiểm tra trạng thái Git sạch sẽ
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠️ Cảnh báo: Git working tree đang có thay đổi chưa commit!"
  echo "Vui lòng commit hoặc stash thay đổi trước khi chạy script này."
  git status --short
  exit 1
fi

echo "📌 Bước 1: Trích xuất lịch sử commit của '$PREFIX_DIR' sang nhánh '$BRANCH_NAME'..."

# Xóa nhánh cũ nếu đã tồn tại từ lần chạy trước
if git show-ref --quiet --heads "$BRANCH_NAME"; then
  echo "ℹ️ Nhánh '$BRANCH_NAME' đã tồn tại, đang tái tạo..."
  git branch -D "$BRANCH_NAME"
fi

git subtree split --prefix="$PREFIX_DIR" -b "$BRANCH_NAME"

echo "✅ Trích xuất thành công nhánh '$BRANCH_NAME'!"
echo ""
echo "======================================================================"
echo "📋 HƯỚNG DẪN ĐẨY LÊN REPO GITHUB MỚI (DÀNH CHO ĐẠI KA):"
echo "======================================================================"
echo ""
echo "1. Tạo một repository mới trên GitHub (ví dụ: ziweiai-mobile hoặc tuvitoantap-mobile)."
echo "   (Khuyên dùng: Để repo trống, KHÔNG tích chọn Add README / .gitignore)"
echo ""
echo "2. Chạy lệnh sau để push nhánh sang repo mới:"
echo "   git remote add mobile-origin <URL_GITHUB_REPO_MỚI>"
echo "   git push mobile-origin $BRANCH_NAME:main"
echo ""
echo "   Ví dụ cụ thể:"
echo "   git remote add mobile-origin git@github.com:your-username/ziweiai-mobile.git"
echo "   git push -u mobile-origin $BRANCH_NAME:main"
echo ""
echo "3. Kiểm tra repo mới trên GitHub:"
echo "   Toàn bộ mã nguồn Flutter nằm ngay tại thư mục gốc của repo mới, đầy đủ commit history."
echo ""
echo "4. Sau khi đã push và kiểm tra repo mới hoạt động hoàn hảo:"
echo "   - Có thể dọn dẹp remote tạm: git remote remove mobile-origin"
echo "   - Xóa nhánh tạm: git branch -D $BRANCH_NAME"
echo "   - Dọn dẹp thư mục $PREFIX_DIR trong repo gốc (hoặc thay bằng git submodule nếu muốn):"
echo "     git rm -r $PREFIX_DIR"
echo "     git commit -m 'chore: extract mobile app to standalone ziweiai-mobile repository'"
echo "     git push origin main"
echo ""
echo "======================================================================"

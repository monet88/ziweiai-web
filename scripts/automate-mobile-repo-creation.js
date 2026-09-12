/**
 * Script tự động tạo repo GitHub 'ziweiai-mobile' và push nhánh 'mobile-standalone'
 * Sử dụng GITHUB_TOKEN từ .env.local
 */
require('dotenv').config({ path: '.env.local' });
const { execSync } = require('child_process');

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error('❌ Không tìm thấy GITHUB_TOKEN trong .env.local');
  process.exit(1);
}

const REPO_NAME = 'ziweiai-mobile';
const ORG_OR_USER = 'galaxypro710-stack';
const SOURCE_BRANCH = 'mobile-standalone';

async function main() {
  console.log(`🚀 Bắt đầu quy trình tự động hóa tạo repo [${REPO_NAME}] trên GitHub...`);

  // 1. Kiểm tra repo đã tồn tại chưa
  const checkRes = await fetch(`https://api.github.com/repos/${ORG_OR_USER}/${REPO_NAME}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'Antigravity-Agent',
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (checkRes.status === 404) {
    console.log(`📌 Repo [${REPO_NAME}] chưa tồn tại. Đang tạo mới (Private)...`);
    const createRes = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Antigravity-Agent',
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github.v3+json',
      },
      body: JSON.stringify({
        name: REPO_NAME,
        description: 'Ứng dụng Tử Vi Toàn Tập Mobile (Flutter & Dart) — ViOS Standalone App',
        private: true,
        has_issues: true,
        has_projects: true,
        has_wiki: false,
      }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Tạo repo thất bại (${createRes.status}): ${errText}`);
    }

    const newRepo = await createRes.json();
    console.log(`✅ Đã tạo thành công repo private: ${newRepo.html_url}`);
  } else if (checkRes.ok) {
    const existing = await checkRes.json();
    console.log(`ℹ️ Repo [${existing.full_name}] đã tồn tại sẵn.`);
  } else {
    throw new Error(`Kiểm tra repo thất bại: ${checkRes.status}`);
  }

  // 2. Push nhánh mobile-standalone lên repo mới
  console.log(`\n⏳ Đang push nhánh [${SOURCE_BRANCH}] lên [${REPO_NAME}:main]...`);
  const authenticatedUrl = `https://x-access-token:${token}@github.com/${ORG_OR_USER}/${REPO_NAME}.git`;

  try {
    // Chạy push không in token ra stdout/stderr
    execSync(`git push "${authenticatedUrl}" ${SOURCE_BRANCH}:main --force`, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    console.log(`🎉 PUSH THÀNH CÔNG LÊN GITHUB: https://github.com/${ORG_OR_USER}/${REPO_NAME}`);
  } catch (err) {
    console.error('❌ Lỗi khi push lên GitHub:', err.message);
    process.exit(1);
  }

  // 3. Kiểm tra commits trên repo mới qua GitHub API
  console.log('\n🔍 Kiểm tra commit trên repo mới...');
  const commitsRes = await fetch(`https://api.github.com/repos/${ORG_OR_USER}/${REPO_NAME}/commits?per_page=3`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'User-Agent': 'Antigravity-Agent',
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (commitsRes.ok) {
    const commits = await commitsRes.json();
    console.log(`✅ Đã xác thực ${commits.length} commits mới nhất trên branch main của [${REPO_NAME}]:`);
    commits.forEach(c => {
      console.log(`   - ${c.sha.slice(0, 7)}: ${c.commit.message.split('\n')[0]}`);
    });
  }

  console.log('\n🌟 HOÀN TẤT 100%: Mobile App đã có repository độc lập trên GitHub!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

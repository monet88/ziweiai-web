/**
 * Script áp dụng an toàn các migrations còn thiếu lên Supabase Database
 * Sử dụng Supabase Management API với SUPABASE_ACCESS_TOKEN
 */
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const token = process.env.SUPABASE_ACCESS_TOKEN;
const supabaseUrl = process.env.SUPABASE_URL || '';
const match = supabaseUrl.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/);
const projectRef = match ? match[1] : null;

if (!token || !projectRef) {
  console.error('❌ Thiếu SUPABASE_ACCESS_TOKEN hoặc không xác định được projectRef từ SUPABASE_URL trong .env.local');
  process.exit(1);
}

const migrationsDir = path.resolve(__dirname, '../apps/api/supabase/migrations');

async function runSqlQuery(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });

  const body = await res.json();
  if (!res.ok) {
    throw new Error(`SQL Query failed (${res.status}): ${JSON.stringify(body)}`);
  }
  return body;
}

async function main() {
  const isDryRun = process.argv.includes('--dry-run');
  console.log(`🚀 Bắt đầu kiểm tra và áp dụng migrations cho Supabase Project: ${projectRef} (dry-run: ${isDryRun})`);

  // 1. Lấy danh sách migration đã chạy
  const appliedRows = await runSqlQuery('SELECT version FROM supabase_migrations.schema_migrations ORDER BY version ASC;');
  const appliedSet = new Set(appliedRows.map(r => r.version));
  console.log(`📌 Đã có ${appliedSet.size} migrations trong schema_migrations.`);

  // 2. Đọc thư mục migrations
  const allFiles = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  const pending = allFiles.filter(f => {
    const version = f.split('_')[0];
    return !appliedSet.has(version);
  });

  if (pending.length === 0) {
    console.log('✅ Database đã đồng bộ 100% với local migrations. Không có migration mới nào.');
    return;
  }

  console.log(`📋 Tìm thấy ${pending.length} migrations chưa được áp dụng:`);
  pending.forEach(f => console.log(`   - ${f}`));

  if (isDryRun) {
    console.log('\n[Dry-run mode] Dừng lại ở đây, không thực hiện thay đổi.');
    return;
  }

  // 3. Chạy từng migration tuần tự
  for (const filename of pending) {
    const version = filename.split('_')[0];
    const name = filename.replace(/\.sql$/, '').substring(version.length + 1);
    const filePath = path.join(migrationsDir, filename);
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    console.log(`\n⏳ Đang áp dụng [${filename}]...`);
    try {
      // Thực thi nội dung migration SQL
      await runSqlQuery(sqlContent);

      // Ghi nhận vào schema_migrations
      const recordSql = `INSERT INTO supabase_migrations.schema_migrations (version, name) VALUES ('${version}', '${name}') ON CONFLICT (version) DO NOTHING;`;
      await runSqlQuery(recordSql);

      console.log(`   ✅ Thành công: [${filename}]`);
    } catch (err) {
      console.error(`   ❌ Lỗi khi áp dụng [${filename}]:`, err.message);
      process.exit(1);
    }
  }

  console.log('\n🎉 Toàn bộ migrations đã được áp dụng và đồng bộ thành công vào Supabase!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

/**
 * Script kiểm tra độc lập Database Permissions & Function Definitions trên Supabase Production
 */
require('dotenv').config({ path: '.env.local' });

const token = process.env.SUPABASE_ACCESS_TOKEN;
const supabaseUrl = process.env.SUPABASE_URL || '';
const match = supabaseUrl.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/);
const projectRef = match ? match[1] : null;

if (!token || !projectRef) {
  console.error('❌ Thiếu SUPABASE_ACCESS_TOKEN hoặc không tìm thấy projectRef');
  process.exit(1);
}

async function runSqlQuery(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  return await res.json();
}

async function main() {
  console.log(`🔍 [AUDIT] Kiểm tra bảo mật cơ sở dữ liệu Supabase: ${projectRef}`);

  // 1. Kiểm tra quyền EXECUTE của claim_ad_reward
  console.log('\n--- 1. QUYỀN EXECUTE CỦA claim_ad_reward ---');
  const privs = await runSqlQuery(`
    SELECT grantee, privilege_type, routine_name 
    FROM information_schema.routine_privileges 
    WHERE routine_name = 'claim_ad_reward';
  `);
  console.log('Routine Privileges:', privs);

  const hasAuthenticated = privs.some(p => p.grantee === 'authenticated');
  const hasAnon = privs.some(p => p.grantee === 'anon');
  const hasPublic = privs.some(p => p.grantee === 'PUBLIC');
  const hasServiceRole = privs.some(p => p.grantee === 'service_role' || p.grantee === 'postgres');

  if (hasAuthenticated || hasAnon || hasPublic) {
    console.error('❌ LỖI BẢO MẬT: claim_ad_reward vẫn còn quyền execute cho public/anon/authenticated!');
    process.exit(1);
  } else {
    console.log('✅ BẢO MẬT ĐẠT CHUẨN: claim_ad_reward đã bị REVOKE hoàn toàn khỏi client roles (chỉ service_role/postgres được gọi).');
  }

  // 2. Kiểm tra định nghĩa hàm claim_ad_reward có chứa hằng số 5 XU
  console.log('\n--- 2. ĐỊNH NGHĨA HÀM claim_ad_reward ---');
  const funcDefs = await runSqlQuery(`
    SELECT proname, proargnames, pg_get_functiondef(oid) as def
    FROM pg_proc 
    WHERE proname = 'claim_ad_reward';
  `);
  console.log('Arguments:', funcDefs[0]?.proargnames);
  const def = funcDefs[0]?.def || '';
  if (def.includes('c_reward_amount constant integer := 5;') && !def.includes('p_reward_amount')) {
    console.log('✅ BẢO MẬT ĐẠT CHUẨN: Số XU được hardcode c_reward_amount = 5 XU, không cho phép caller truyền amount.');
  } else {
    console.error('❌ LỖI: Định nghĩa hàm chưa hardcode 5 XU!');
    process.exit(1);
  }

  // 3. Kiểm tra bảng ad_reward_claims
  console.log('\n--- 3. BẢNG ad_reward_claims (CHỐNG REPLAY) ---');
  const tables = await runSqlQuery(`
    SELECT table_name FROM information_schema.tables WHERE table_name = 'ad_reward_claims';
  `);
  if (tables.length > 0) {
    console.log('✅ BẢO MẬT ĐẠT CHUẨN: Bảng ad_reward_claims tồn tại để chống replay impression.');
  } else {
    console.error('❌ LỖI: Thiếu bảng ad_reward_claims!');
    process.exit(1);
  }

  // 4. Kiểm tra cột currency & original_price trong transactions
  console.log('\n--- 4. CỘT ACCOUNTING TRONG BẢNG transactions ---');
  const cols = await runSqlQuery(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name IN ('currency', 'original_price');
  `);
  console.log('Columns found:', cols);
  if (cols.length === 2) {
    console.log('✅ KẾ TOÁN ĐẠT CHUẨN: Bảng transactions đã có cột currency và original_price.');
  } else {
    console.error('❌ LỖI: Chưa có đủ cột currency / original_price!');
    process.exit(1);
  }

  console.log('\n🎉 KIỂM TRA ĐỘC LẬP HOÀN TẤT: Tất cả các tiêu chí bảo mật P0 và kế toán P1 đều ĐẠT CHUẨN 100%!');
}

main().catch(err => {
  console.error('Fatal audit error:', err);
  process.exit(1);
});

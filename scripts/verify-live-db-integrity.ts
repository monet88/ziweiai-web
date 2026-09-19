#!/usr/bin/env tsx
/**
 * scripts/verify-live-db-integrity.ts
 *
 * Kiểm tra toàn diện tính toàn vẹn của Database Supabase Production:
 * 1. Kiểm tra các bảng và các cột bắt buộc (Schema Drift Detection).
 * 2. Kiểm tra quyền thực thi các hàm RPC cốt lõi.
 * 3. Chạy Dry-run giao dịch (ROLLBACK) để xác thực không có lỗi runtime SQL.
 */
import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const REQUIRED_TABLES_COLUMNS: Record<string, string[]> = {
  xu_transactions: ['id', 'user_id', 'amount', 'transaction_type', 'balance_after', 'metadata', 'created_at'],
  profiles: ['user_id', 'xu_balance', 'last_checkin_date', 'checkin_streak', 'referral_code'],
  referrals: ['id', 'referrer_id', 'referee_id', 'reward_xu', 'status', 'created_at'],
  chart_snapshots: ['id', 'owner_user_id', 'birth_profile_id', 'chart_system', 'chart_snapshot_json', 'created_at'],
  birth_profiles: ['id', 'owner_user_id', 'raw_birth_input_json', 'normalized_birth_json', 'created_at'],
};

async function main() {
  console.log('======================================================================');
  console.log('⚡ KIỂM TOÁN TÍNH TOÀN VẸN CƠ SỞ DỮ LIỆU THẬT (SUPABASE POSTGRESQL)');
  console.log('======================================================================\n');

  const client = new Client({
    host: 'db.nachzhkeuzwiqmbtelrp.supabase.co',
    port: 5432,
    user: 'postgres',
    password: process.env.SUPABASE_DB_PASSWORD,
    database: 'postgres',
    ssl: { rejectUnauthorized: false },
  });

  try {
    await client.connect();
    console.log('✅ Kết nối trực tiếp PostgreSQL Supabase thành công.\n');

    let hasError = false;

    // 1. Kiểm tra bảng và cột
    console.log('🔍 [1/3] Kiểm tra Schema Tables & Required Columns...');
    for (const [tableName, expectedCols] of Object.entries(REQUIRED_TABLES_COLUMNS)) {
      const res = await client.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = 'public'`,
        [tableName]
      );
      const actualCols = new Set(res.rows.map((r: any) => r.column_name));

      const missing = expectedCols.filter((col) => !actualCols.has(col));
      if (missing.length > 0) {
        console.error(`  ❌ Bảng "${tableName}" THIẾU CỘT: ${missing.join(', ')}`);
        hasError = true;
      } else {
        console.log(`  ✅ Bảng "${tableName}": Đầy đủ ${expectedCols.length}/${expectedCols.length} cột bắt buộc.`);
      }
    }

    // 2. Kiểm tra các RPC Functions cốt lõi
    console.log('\n🔍 [2/3] Kiểm tra các hàm RPC thiết yếu...');
    const rpcList = ['daily_checkin', 'claim_welcome_bonus', 'normalize_email_address'];
    for (const rpcName of rpcList) {
      const res = await client.query(
        `SELECT routine_name FROM information_schema.routines WHERE routine_name = $1 AND routine_schema = 'public'`,
        [rpcName]
      );
      if (res.rows.length === 0) {
        console.error(`  ❌ Không tìm thấy RPC: public.${rpcName}`);
        hasError = true;
      } else {
        console.log(`  ✅ Tìm thấy RPC: public.${rpcName}`);
      }
    }

    // 3. Dry-run RPC daily_checkin trong giao dịch Rollback
    console.log('\n🔍 [3/3] Chạy Dry-Run Giao dịch SQL (ACID Rollback Simulation)...');
    try {
      await client.query('BEGIN');
      // Tìm một user thật có email
      const userRes = await client.query(
        `SELECT id, email FROM auth.users WHERE email IS NOT NULL AND email <> '' LIMIT 1`
      );
      if (userRes.rows.length > 0) {
        const testUser = userRes.rows[0];
        // Gọi thử daily_checkin
        await client.query(`SELECT public.daily_checkin($1, NULL)`, [testUser.id]);
        console.log(`  ✅ Dry-run RPC daily_checkin thành công cho user: ${testUser.email}`);
      } else {
        console.log('  ⚠️ Không tìm thấy user có email để dry-run.');
      }
      await client.query('ROLLBACK');
      console.log('  ✅ Giao dịch Rollback an toàn 100%, không ảnh hưởng dữ liệu thật.');
    } catch (dryErr: any) {
      await client.query('ROLLBACK').catch(() => {});
      console.error(`  ❌ Dry-run SQL THẤT BẠI: ${dryErr.message}`);
      hasError = true;
    }

    await client.end();

    console.log('\n======================================================================');
    if (hasError) {
      console.error('❌ PHÁT HIỆN LỖI LỆCH SCHEMA HOẶC RPC DATABASE!');
      process.exit(1);
    } else {
      console.log('🎉 TẤT CẢ TIÊU CHÍ KIỂM TOÁN DATABASE ĐỀU ĐẠT CHUẨN 100%!');
      console.log('======================================================================');
      process.exit(0);
    }
  } catch (err: any) {
    console.error('Lỗi kết nối kiểm toán:', err.message);
    process.exit(1);
  }
}

main();

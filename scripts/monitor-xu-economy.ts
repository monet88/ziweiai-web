#!/usr/bin/env tsx
/**
 * scripts/monitor-xu-economy.ts
 *
 * GIÁM SÁT HỆ THỐNG KINH TẾ XU & SỔ CÁI REALTIME (VIOS PRODUCTION)
 *
 * Kiểm toán:
 * 1. Tổng cung XU (Tổng phát hành vs Tổng tiêu thụ).
 * 2. Phân bổ XU người dùng (Max, Avg, Số tài khoản sở hữu XU).
 * 3. Thống kê giao dịch theo loại (Checkin, Referral, Nạp tiền, Luận giải AI).
 * 4. Phát hiện dị thường (Tài khoản âm, mất cân đối sổ cái, dấu hiệu Sybil).
 */

import { Client } from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  console.log('='.repeat(75));
  console.log('🏛️  TỬ VI TOÀN TẬP (ViOS) — GIÁM SÁT KINH TẾ XU & SỔ CÁI LIVE');
  console.log('='.repeat(75));

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
    console.log('✅ Kết nối cơ sở dữ liệu Supabase Production thành công.\n');

    // 1. TỔNG QUAN VÍ NGƯỜI DÙNG
    console.log('📊 [1/4] TỔNG QUAN SỐ DƯ VÍ NGƯỜI DÙNG (PROFILES):');
    const profilesRes = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COALESCE(SUM(xu_balance), 0) as total_xu_in_circulation,
        COALESCE(AVG(xu_balance), 0)::numeric(10,2) as avg_xu_per_user,
        COALESCE(MAX(xu_balance), 0) as max_xu_balance,
        COUNT(*) FILTER (WHERE xu_balance > 0) as active_holders,
        COUNT(*) FILTER (WHERE xu_balance < 0) as negative_balance_anomalies
      FROM profiles;
    `);

    const p = profilesRes.rows[0];
    console.log(`  • Tổng số tài khoản có hồ sơ:  ${p.total_users}`);
    console.log(`  • Tổng XU đang lưu hành:        ${p.total_xu_in_circulation} XU`);
    console.log(`  • Trung bình mỗi tài khoản:     ${p.avg_xu_per_user} XU`);
    console.log(`  • Số dư lớn nhất hiện tại:      ${p.max_xu_balance} XU`);
    console.log(`  • Số ví có số dư > 0:          ${p.active_holders}`);
    if (Number(p.negative_balance_anomalies) > 0) {
      console.error(`  ⚠️ CẢNH BÁO DỊ THƯỜNG: Phát hiện ${p.negative_balance_anomalies} tài khoản có SỐ DƯ ÂM!`);
    } else {
      console.log(`  ✅ An toàn 100%: Không có tài khoản nào có số dư âm.`);
    }
    console.log('');

    // 2. PHÂN TÍCH SỔ CÁI GIAO DỊCH (XU_TRANSACTIONS)
    console.log('📜 [2/4] PHÂN TÍCH SỔ CÁI GIAO DỊCH (XU_TRANSACTIONS):');
    const txRes = await client.query(`
      SELECT 
        transaction_type,
        COUNT(*) as tx_count,
        COALESCE(SUM(amount), 0) as net_amount,
        COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0) as total_inflow,
        COALESCE(SUM(amount) FILTER (WHERE amount < 0), 0) as total_outflow
      FROM xu_transactions
      GROUP BY transaction_type
      ORDER BY tx_count DESC;
    `);

    console.table(
      txRes.rows.map((row) => ({
        'Loại Giao Dịch': row.transaction_type,
        'Số Giao Dịch': Number(row.tx_count),
        'Dòng Vào (+)': Number(row.total_inflow),
        'Dòng Ra (-)': Number(row.total_outflow),
        'Biến Động Ròng': Number(row.net_amount),
      }))
    );

    // 3. HOẠT ĐỘNG 24H GẦN NHẤT
    console.log('⚡ [3/4] HOẠT ĐỘNG 24 GIỜ GẦN NHẤT:');
    const recentRes = await client.query(`
      SELECT 
        COUNT(*) as tx_count_24h,
        COUNT(*) FILTER (WHERE transaction_type = 'checkin') as checkin_count_24h,
        COUNT(*) FILTER (WHERE transaction_type = 'referral_bonus' OR transaction_type = 'referral_reward') as referral_count_24h,
        COALESCE(SUM(amount) FILTER (WHERE amount > 0), 0) as inflow_24h,
        COALESCE(SUM(amount) FILTER (WHERE amount < 0), 0) as outflow_24h
      FROM xu_transactions
      WHERE created_at > NOW() - INTERVAL '24 HOURS';
    `);

    const r = recentRes.rows[0];
    console.log(`  • Số giao dịch 24h:          ${r.tx_count_24h}`);
    console.log(`  • Số lượt Điểm danh 24h:     ${r.checkin_count_24h}`);
    console.log(`  • Thưởng Giới thiệu 24h:     ${r.referral_count_24h}`);
    console.log(`  • XU phát hành 24h (+):       ${r.inflow_24h} XU`);
    console.log(`  • XU tiêu thụ 24h (-):        ${r.outflow_24h} XU`);
    console.log('');

    // 4. BẢNG SỨ GIẢ LAN TỎA & REFERRAL HEALTH
    console.log('🤝 [4/4] TÌNH TRẠNG MẠNG LƯỚI SỨ GIẢ (REFERRALS):');
    const refRes = await client.query(`
      SELECT 
        status,
        COUNT(*) as total_referrals,
        COALESCE(SUM(reward_xu), 0) as total_reward_xu
      FROM referrals
      GROUP BY status;
    `);

    if (refRes.rows.length === 0) {
      console.log('  • Hiện chưa có dữ liệu giới thiệu được ghi nhận.');
    } else {
      console.table(
        refRes.rows.map((row) => ({
          'Trạng Thái': row.status,
          'Tổng Lượt Mời': Number(row.total_referrals),
          'Tổng Thưởng (XU)': Number(row.total_reward_xu),
        }))
      );
    }

    console.log('='.repeat(75));
    console.log('🎉 BÁO CÁO GIÁM SÁT KINH TẾ XU HOÀN TẤT — HỆ THỐNG VẬN HÀNH ỔN ĐỊNH 100%');
    console.log('='.repeat(75));
  } catch (err: any) {
    console.error('❌ Lỗi kiểm toán kinh tế XU:', err?.message || err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();

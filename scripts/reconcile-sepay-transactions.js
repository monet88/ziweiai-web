#!/usr/bin/env node
/**
 * Script: reconcile-sepay-transactions.js
 * Mục đích: Kiểm toán và đối soát giao dịch nạp XU VietQR / SePay trên Supabase Production.
 * Sử dụng SUPABASE_SERVICE_ROLE_KEY để truy vấn tổng hợp kế toán.
 */

const https = require('https');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Lỗi: Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env / .env.local');
  process.exit(1);
}

async function fetchSupabase(endpoint) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: 'GET',
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'count=exact',
        },
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve({
                data: JSON.parse(data),
                count: res.headers['content-range'] ? res.headers['content-range'].split('/')[1] : null,
              });
            } catch (e) {
              resolve({ data, count: null });
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runReconciliation() {
  console.log('================================================================');
  console.log('🏛️  BÁO CÁO ĐỐI SOÁT KẾ TOÁN & GIAO DỊCH VIETQR / SEPAY (VIOS)');
  console.log(`⏰ Thời gian: ${new Date().toISOString()}`);
  console.log(`🌐 Supabase Target: ${SUPABASE_URL}`);
  console.log('================================================================\n');

  try {
    // 1. Tổng số giao dịch SePay đã ghi nhận
    const allTxsResult = await fetchSupabase(
      'transactions?select=id,owner_user_id,amount_vnd,xu_added,sepay_transaction_id,created_at,content&order=created_at.desc&limit=100'
    );
    const txs = allTxsResult.data || [];
    const totalCount = allTxsResult.count || txs.length;

    let totalRevenueVnd = 0;
    let totalXuAdded = 0;
    let matchedCount = 0;
    let unmatchedCount = 0;
    const unmatchedTxs = [];

    for (const tx of txs) {
      const amount = Number(tx.amount_vnd) || 0;
      const xu = Number(tx.xu_added) || 0;
      totalRevenueVnd += amount;
      totalXuAdded += xu;

      if (tx.owner_user_id) {
        matchedCount++;
      } else {
        unmatchedCount++;
        unmatchedTxs.push(tx);
      }
    }

    console.log('📊 THỐNG KÊ TỔNG QUAN:');
    console.log(`- Tổng số giao dịch ngân hàng: ${totalCount}`);
    console.log(`- Khớp lệnh thành công (Matched): ${matchedCount}`);
    console.log(`- Sai cú pháp / Cần đối soát thủ công (Unmatched): ${unmatchedCount}`);
    console.log(`- Tổng doanh thu VNĐ ghi nhận: ${totalRevenueVnd.toLocaleString('vi-VN')} VNĐ`);
    console.log(`- Tổng số XU đã phát hành vào ví: ${totalXuAdded.toLocaleString('vi-VN')} XU`);
    console.log('----------------------------------------------------------------');

    if (unmatchedCount > 0) {
      console.log('⚠️  DANH SÁCH GIAO DỊCH CHƯA KHỚP USER (CẦN ADMIN HỖ TRỢ):');
      unmatchedTxs.forEach((tx, idx) => {
        console.log(
          `  [${idx + 1}] ID: ${tx.sepay_transaction_id} | Tiền: ${Number(tx.amount_vnd).toLocaleString('vi-VN')}đ | Nội dung: "${tx.content}" | Ngày: ${tx.created_at}`
        );
      });
      console.log('----------------------------------------------------------------');
    } else {
      console.log('✅ TUYỆT VỜI: 100% giao dịch nạp tiền đều khớp chính xác tài khoản user!');
    }

    // 2. Kiểm tra bảng ad_reward_claims (Ad Rewards replay log)
    const adClaimsResult = await fetchSupabase('ad_reward_claims?select=impression_id,user_id,created_at&limit=5');
    const adClaims = adClaimsResult.data || [];
    const totalAdClaims = adClaimsResult.count || adClaims.length;
    console.log(`\n🛡️  BẢNG CHỐNG REPLAY QUẢNG CÁO (ad_reward_claims):`);
    console.log(`- Tổng số lượt xem quảng cáo đã ghi nhận: ${totalAdClaims}`);
    console.log('================================================================');
    console.log('🎉 ĐỐI SOÁT HOÀN TẤT THÀNH CÔNG!\n');
  } catch (err) {
    console.error('❌ Lỗi đối soát:', err.message);
    process.exit(1);
  }
}

runReconciliation();

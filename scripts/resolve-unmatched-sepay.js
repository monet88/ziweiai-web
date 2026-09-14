#!/usr/bin/env node
/**
 * Script: resolve-unmatched-sepay.js
 * Mục đích: Hỗ trợ Admin xử lý và gán giao dịch nạp tiền VietQR SePay bị treo (sai cú pháp).
 * Đảm bảo ghi sổ cái kép (double-entry ledger) và cập nhật số dư ví chính xác.
 * 
 * Cách dùng:
 *   node scripts/resolve-unmatched-sepay.js --list
 *   node scripts/resolve-unmatched-sepay.js --tx-id=<id> --user-id=<uuid>
 *   node scripts/resolve-unmatched-sepay.js --tx-id=<id> --user-id=<uuid> --execute
 */

const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Lỗi: Thiếu SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong .env.local');
  process.exit(1);
}

async function fetchSupabase(endpoint, options = {}) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${endpoint}`);
  const method = options.method || 'GET';
  const headers = {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  return new Promise((resolve, reject) => {
    const req = https.request(url, { method, headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(data ? JSON.parse(data) : null);
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
}

function parseArgs() {
  const args = {};
  for (const arg of process.argv.slice(2)) {
    if (arg === '--list') args.list = true;
    if (arg === '--execute') args.execute = true;
    if (arg.startsWith('--tx-id=')) args.txId = arg.split('=')[1];
    if (arg.startsWith('--user-id=')) args.userId = arg.split('=')[1];
  }
  return args;
}

async function main() {
  const args = parseArgs();

  console.log('================================================================');
  console.log('🛠️  XỬ LÝ GIAO DỊCH TREO VIETQR / SEPAY (ADMIN OPERATIONS)');
  console.log(`⏰ Thời gian: ${new Date().toISOString()}`);
  console.log('================================================================\n');

  if (args.list || (!args.txId && !args.userId)) {
    console.log('🔍 Danh sách các giao dịch SePay chưa khớp tài khoản:');
    const unmatched = await fetchSupabase(
      'transactions?owner_user_id=is.null&order=created_at.desc'
    );

    if (!unmatched || unmatched.length === 0) {
      console.log('✅ Không có giao dịch treo nào cần xử lý.');
      return;
    }

    unmatched.forEach((tx, idx) => {
      console.log(
        `[${idx + 1}] ID: ${tx.id} | SePay ID: ${tx.sepay_transaction_id} | Tiền: ${Number(tx.amount_vnd).toLocaleString('vi-VN')} VNĐ | Nội dung: "${tx.content}" | Ngày: ${tx.created_at}`
      );
    });

    console.log('\n💡 Để khớp giao dịch vào tài khoản, chạy lệnh:');
    console.log('   node scripts/resolve-unmatched-sepay.js --tx-id=<UUID> --user-id=<USER_UUID> [--execute]');
    return;
  }

  if (!args.txId || !args.userId) {
    console.error('❌ Vui lòng cung cấp đủ cả --tx-id=<id> và --user-id=<uuid>');
    process.exit(1);
  }

  // 1. Kiểm tra giao dịch
  const txList = await fetchSupabase(`transactions?id=eq.${args.txId}`);
  if (!txList || txList.length === 0) {
    console.error(`❌ Không tìm thấy giao dịch có ID: ${args.txId}`);
    process.exit(1);
  }
  const tx = txList[0];
  if (tx.owner_user_id) {
    console.error(`❌ Giao dịch này đã được gán cho user: ${tx.owner_user_id}`);
    process.exit(1);
  }

  // 2. Kiểm tra User Profile
  const profileList = await fetchSupabase(`profiles?user_id=eq.${args.userId}`);
  if (!profileList || profileList.length === 0) {
    console.error(`❌ Không tìm thấy User Profile với ID: ${args.userId}`);
    process.exit(1);
  }
  const profile = profileList[0];

  const amountVnd = Number(tx.amount_vnd) || 0;
  let xuCalculated = Math.floor(amountVnd / 1000);
  let bonusXu = 0;
  if (amountVnd >= 500000) {
    bonusXu = 100;
  } else if (amountVnd >= 100000) {
    bonusXu = 20;
  }
  xuCalculated += bonusXu;

  const currentBalance = Number(profile.xu_balance || 0);
  const newBalance = currentBalance + xuCalculated;

  console.log('📋 THÔNG TIN GIAO DỊCH ĐỐI SOÁT:');
  console.log(`- Transaction ID: ${tx.id} (SePay ID: ${tx.sepay_transaction_id})`);
  console.log(`- Số tiền chuyển: ${amountVnd.toLocaleString('vi-VN')} VNĐ`);
  console.log(`- Nội dung chuyển khoản: "${tx.content}"`);
  console.log(`- Số XU cơ bản: ${Math.floor(amountVnd / 1000)} XU${bonusXu > 0 ? ` (+${bonusXu} XU ưu đãi gói lớn)` : ''}`);
  console.log(`- Tổng XU sẽ cộng: +${xuCalculated} XU`);
  console.log(`- Target User ID: ${args.userId}`);
  console.log(`- Số dư ví hiện tại: ${currentBalance} XU`);
  console.log(`- Số dư ví sau khi cộng: ${newBalance} XU`);
  console.log('----------------------------------------------------------------');

  if (!args.execute) {
    console.log('⚠️  CHẾ ĐỘ XEM TRƯỚC (DRY-RUN). Dữ liệu chưa bị thay đổi.');
    console.log('💡 Thêm cờ --execute để thực thi cập nhật vào sổ cái và ví người dùng.');
    return;
  }

  console.log('⏳ Đang thực thi ghi nhận giao dịch vào ví và sổ cái...');

  // 1. Cập nhật transaction
  await fetchSupabase(`transactions?id=eq.${tx.id}`, {
    method: 'PATCH',
    body: {
      owner_user_id: args.userId,
      xu_added: xuCalculated,
    },
  });

  // 2. Cập nhật profile balance
  await fetchSupabase(`profiles?user_id=eq.${args.userId}`, {
    method: 'PATCH',
    body: {
      xu_balance: newBalance,
    },
  });

  // 3. Ghi bút toán sổ cái xu_transactions
  await fetchSupabase('xu_transactions', {
    method: 'POST',
    body: {
      user_id: args.userId,
      amount: xuCalculated,
      transaction_type: 'topup',
      actor_email: 'admin_manual_resolve',
    },
  });

  console.log('✅ THỰC HIỆN THÀNH CÔNG:');
  console.log(`  • Đã gán giao dịch ${tx.id} cho user ${args.userId}`);
  console.log(`  • Đã cộng +${xuCalculated} XU vào ví (Số dư mới: ${newBalance} XU)`);
  console.log(`  • Đã ghi bút toán 'topup' vào xu_transactions.`);
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('❌ Lỗi:', err.message);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Script: monitor-ai-quota.js
 * Mục đích: Giám sát trần ngân sách AI và trạng thái Global Spend Circuit Breaker trên Upstash Redis.
 * Sử dụng REST API của Upstash Serverless Redis.
 */

const https = require('https');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const UPSTASH_URL = process.env.QUOTA_UPSTASH_REST_URL;
const UPSTASH_TOKEN = process.env.QUOTA_UPSTASH_REST_TOKEN;
const DAILY_CIRCUIT_LIMIT = parseInt(process.env.GLOBAL_AI_DAILY_SPEND_LIMIT || '10000', 10);

if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  console.error('❌ Lỗi: Thiếu QUOTA_UPSTASH_REST_URL hoặc QUOTA_UPSTASH_REST_TOKEN trong .env.local');
  process.exit(1);
}

async function queryUpstash(commandPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${UPSTASH_URL}/${commandPath}`);
    const req = https.request(
      url,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${UPSTASH_TOKEN}`,
        },
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(rawData));
          } catch (e) {
            reject(new Error(`Failed to parse Upstash response: ${rawData}`));
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function runMonitor() {
  console.log('================================================================');
  console.log('⚡ GIÁM SÁT TRẦN NGÂN SÁCH AI & CIRCUIT BREAKER (VIOS PRODUCTION)');
  console.log(`⏰ Thời gian: ${new Date().toISOString()}`);
  console.log(`📡 Upstash Endpoint: ${UPSTASH_URL}`);
  console.log('================================================================\n');

  try {
    // 1. Kiểm tra kết nối Redis PING
    const ping = await queryUpstash('ping');
    if (ping.result !== 'PONG') {
      throw new Error(`Upstash Redis không phản hồi PONG: ${JSON.stringify(ping)}`);
    }

    // 2. Lấy danh sách keys liên quan đến quota / circuit breaker
    const allKeysRes = await queryUpstash('keys/*');
    const allKeys = allKeysRes.result || [];

    // Tìm key global spend circuit breaker hôm nay: thường có dạng ai:circuit:global:YYYY-MM-DD
    const todayStr = new Date().toISOString().slice(0, 10);
    const globalKey = `ai:circuit:global:${todayStr}`;

    let currentUsage = 0;
    let keyTtl = -1;

    // Check if key exists
    if (allKeys.includes(globalKey)) {
      const valRes = await queryUpstash(`get/${encodeURIComponent(globalKey)}`);
      currentUsage = parseInt(valRes.result || '0', 10);
      const ttlRes = await queryUpstash(`ttl/${encodeURIComponent(globalKey)}`);
      keyTtl = ttlRes.result;
    }

    const percentage = ((currentUsage / DAILY_CIRCUIT_LIMIT) * 100).toFixed(2);
    const remaining = Math.max(0, DAILY_CIRCUIT_LIMIT - currentUsage);

    // Xác định mức độ an toàn (Health Status)
    let statusLabel = '🟢 AN TOÀN (NORMAL)';
    if (currentUsage >= DAILY_CIRCUIT_LIMIT) {
      statusLabel = '🔴 ĐÃ NGẮT MẠCH (CIRCUIT BREAKER TRIPPED - FAIL-CLOSED)';
    } else if (currentUsage >= DAILY_CIRCUIT_LIMIT * 0.8) {
      statusLabel = '🟡 CẢNH BÁO CAO (HIGH USAGE > 80%)';
    } else if (currentUsage >= DAILY_CIRCUIT_LIMIT * 0.5) {
      statusLabel = '🔵 ĐANG THEO DÕI (> 50%)';
    }

    console.log('📊 CHỈ SỐ TIÊU THỤ AI TRONG NGÀY:');
    console.log(`- Trạng thái hệ thống: ${statusLabel}`);
    console.log(`- Ngày giám sát (UTC): ${todayStr}`);
    console.log(`- Lượt gọi AI đã tiêu thụ: ${currentUsage.toLocaleString('vi-VN')} / ${DAILY_CIRCUIT_LIMIT.toLocaleString('vi-VN')} (${percentage}%)`);
    console.log(`- Hạn mức an toàn còn lại: ${remaining.toLocaleString('vi-VN')} requests`);
    if (keyTtl > 0) {
      const hoursRemaining = (keyTtl / 3600).toFixed(1);
      console.log(`- Thời gian reset hạn mức (TTL): ${keyTtl}s (~${hoursRemaining} giờ)`);
    } else {
      console.log(`- Bộ đếm hôm nay: Chưa phát sinh request hoặc chưa khởi tạo key (Sẵn sàng)`);
    }

    console.log('----------------------------------------------------------------');
    console.log(`🔍 TỔNG SỐ KHÓA HOẠT ĐỘNG TRÊN UPSTASH: ${allKeys.length}`);
    if (allKeys.length > 0) {
      console.log('Danh sách các khóa đang lưu trữ:');
      for (const k of allKeys.slice(0, 10)) {
        console.log(`  • ${k}`);
      }
      if (allKeys.length > 10) {
        console.log(`  ... và ${allKeys.length - 10} khóa khác`);
      }
    } else {
      console.log('✅ Bộ nhớ Upstash sạch sẽ, không có khóa rác (Zero Memory Leak).');
    }

    console.log('================================================================');
    console.log('🎉 BÁO CÁO GIÁM SÁT HOÀN TẤT THÀNH CÔNG!\n');
  } catch (err) {
    console.error('❌ Lỗi kiểm tra Upstash Redis:', err.message);
    process.exit(1);
  }
}

runMonitor();

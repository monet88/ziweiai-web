/**
 * Script tự động thiết lập và đồng bộ Supabase & Vercel Keep-Alive Jobs trên cron-job.org
 * Áp dụng skill: /keeping-supabase-alive & /vibe-engineering-workflow
 */
require('dotenv').config({ path: '.env.local' });

const cronApiKey = (process.env.CRONJOB_API || '').replace(/^["']|["']$/g, '');
const supabaseUrl = (process.env.PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/^["']|["']$/g, '').replace(/\/$/, '');
const supabaseAnonKey = (process.env.PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '').replace(/^["']|["']$/g, '');

if (!cronApiKey || !supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Thiếu cấu hình: Cần có CRONJOB_API, SUPABASE_URL (hoặc PUBLIC_SUPABASE_URL), và PUBLIC_SUPABASE_ANON_KEY trong .env.local');
  process.exit(1);
}

async function syncCronJobs() {
  console.log('🔄 Đang kiểm tra danh sách jobs trên cron-job.org...');
  
  const listRes = await fetch('https://api.cron-job.org/jobs', {
    headers: {
      'Authorization': `Bearer ${cronApiKey}`,
      'Content-Type': 'application/json'
    }
  });

  if (!listRes.ok) {
    console.error('❌ Lỗi xác thực với cron-job.org API:', listRes.status);
    return;
  }

  const listData = await listRes.json();
  const existingJobs = listData.jobs || [];

  const supabaseJob = existingJobs.find(j => j.title.includes('Keep Supabase Alive - Tu Vi Toan Tap'));
  const webJob = existingJobs.find(j => j.title.includes('Keep Web & API Warm - Tu Vi Toan Tap'));

  console.log(`📊 Tìm thấy: ${existingJobs.length} jobs trên tài khoản.`);
  if (supabaseJob) {
    console.log(`✅ Supabase Keep-Alive Job đã tồn tại (Job ID: ${supabaseJob.jobId}, Next Run: ${new Date(supabaseJob.nextExecution * 1000).toLocaleString('vi-VN')})`);
  }
  if (webJob) {
    console.log(`✅ Web Keep-Warm Job đã tồn tại (Job ID: ${webJob.jobId}, Next Run: ${new Date(webJob.nextExecution * 1000).toLocaleString('vi-VN')})`);
  }

  // 1. Tạo hoặc cập nhật Supabase Keep-Alive Job
  const dbPingUrl = `${supabaseUrl}/rest/v1/birth_profiles?select=*&limit=1`;
  const supabasePayload = {
    job: {
      url: dbPingUrl,
      title: 'Keep Supabase Alive - Tu Vi Toan Tap (Postgres Real Query)',
      enabled: true,
      saveResponses: true,
      schedule: {
        timezone: 'Asia/Ho_Chi_Minh',
        hours: [0, 6, 12, 18], // 4 lần / ngày
        mdays: [-1],
        minutes: [0],
        months: [-1],
        wdays: [-1]
      },
      requestMethod: 0,
      extendedData: {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      }
    }
  };

  if (!supabaseJob) {
    console.log('🚀 Đang tạo mới Supabase Keep-Alive Job...');
    const createRes = await fetch('https://api.cron-job.org/jobs', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${cronApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(supabasePayload)
    });
    const resData = await createRes.json();
    console.log('✅ Đã tạo Supabase Job:', resData);
  }

  // 2. Tạo hoặc cập nhật Web Keep-Warm Job
  const webPayload = {
    job: {
      url: 'https://tuvitoantap.vercel.app/api/features',
      title: 'Keep Web & API Warm - Tu Vi Toan Tap (Vercel Production)',
      enabled: true,
      saveResponses: true,
      schedule: {
        timezone: 'Asia/Ho_Chi_Minh',
        hours: [0, 4, 8, 12, 16, 20], // 6 lần / ngày
        mdays: [-1],
        minutes: [0],
        months: [-1],
        wdays: [-1]
      },
      requestMethod: 0
    }
  };

  if (!webJob) {
    console.log('🚀 Đang tạo mới Web Keep-Warm Job...');
    const createWebRes = await fetch('https://api.cron-job.org/jobs', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${cronApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(webPayload)
    });
    const resWebData = await createWebRes.json();
    console.log('✅ Đã tạo Web Warm Job:', resWebData);
  }

  console.log('🎉 Hoàn tất đồng bộ toàn bộ hạ tầng Keep-Alive!');
}

syncCronJobs();

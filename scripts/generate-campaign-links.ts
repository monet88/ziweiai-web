#!/usr/bin/env tsx
/**
 * ==============================================================================
 * TỬ VI TOÀN TẬP (ViOS) — COMMERCIAL GTM CAMPAIGN LINK GENERATOR
 * Tạo liên kết tiếp thị đa kênh có gắn mã Referral và tham số UTM tracking.
 * ==============================================================================
 *
 * Cách dùng:
 *   pnpm dlx tsx scripts/generate-campaign-links.ts --ref <REFERRAL_CODE> [--campaign <NAME>] [--domain <DOMAIN>]
 *
 * Ví dụ:
 *   pnpm dlx tsx scripts/generate-campaign-links.ts --ref ROYAL_VIP_888 --campaign khai_van_dau_nam
 */

interface CampaignChannel {
  id: string;
  name: string;
  source: string;
  medium: string;
  content: string;
  description: string;
}

const CHANNELS: CampaignChannel[] = [
  {
    id: 'tiktok_bio',
    name: 'TikTok Bio Profile',
    source: 'tiktok',
    medium: 'bio_link',
    content: 'link_bio_chinh',
    description: 'Gắn link bio trên kênh TikTok chính hoặc nick vệ tinh',
  },
  {
    id: 'tiktok_short',
    name: 'TikTok Short Video (Ghim cmt)',
    source: 'tiktok',
    medium: 'short_video',
    content: 'ghim_binh_luan',
    description: 'Kêu gọi hành động trong video ngắn và ghim link dưới bình luận',
  },
  {
    id: 'facebook_group',
    name: 'Facebook Group Seeding',
    source: 'facebook',
    medium: 'group_post',
    content: 'bai_chia_se_hoi_nhom',
    description: 'Đăng bài luận giải mẫu vào các nhóm Tử Vi, Phong Thủy, Tarot',
  },
  {
    id: 'facebook_reels',
    name: 'Facebook Reels / Story',
    source: 'facebook',
    medium: 'reels',
    content: 'story_quet_ma',
    description: 'Đăng story kèm nhãn dán liên kết xem vận mệnh miễn phí',
  },
  {
    id: 'zalo_chat',
    name: 'Zalo Chat & Nhóm Phong Thủy',
    source: 'zalo',
    medium: 'chat_group',
    content: 'tin_nhan_tang_xu',
    description: 'Gửi tin nhắn mời bạn bè hoặc chia sẻ vào nhóm Zalo nhận 10 XU',
  },
  {
    id: 'koc_influencer',
    name: 'KOC / Booking Đại Sứ',
    source: 'koc_partner',
    medium: 'influencer',
    content: 'dai_su_hoang_gia',
    description: 'Cung cấp cho KOC/TikToker hợp tác chia sẻ doanh thu nạp XU',
  },
  {
    id: 'meta_ads',
    name: 'Meta Ads (Facebook/Instagram)',
    source: 'meta_ads',
    medium: 'cpc',
    content: 'quang_cao_chuyen_doi',
    description: 'Chạy quảng cáo trả phí nhắm mục tiêu người quan tâm tử vi/tài lộc',
  },
];

interface FeatureDestination {
  id: string;
  name: string;
  path: string;
  isShareRoute: boolean;
}

const DESTINATIONS: FeatureDestination[] = [
  {
    id: 'onboarding_bonus',
    name: 'Trang Đăng Ký Tân Thủ (Nhận 10 XU)',
    path: '/share/ref',
    isShareRoute: true,
  },
  {
    id: 'pricing_xu',
    name: 'Bảng Nạp XU VietQR Hoàng Gia',
    path: '/pricing',
    isShareRoute: false,
  },
  {
    id: 'tarot_reading',
    name: 'Bói Bài Tarot AI',
    path: '/tarot',
    isShareRoute: false,
  },
  {
    id: 'palm_reading',
    name: 'Xem Chỉ Tay Phong Thủy AI',
    path: '/palm',
    isShareRoute: false,
  },
  {
    id: 'iching_divination',
    name: 'Gieo Quẻ Kinh Dịch Lục Hào',
    path: '/draws',
    isShareRoute: false,
  },
];

function parseArgs(): { refCode: string; campaignName: string; domain: string } {
  const args = process.argv.slice(2);
  let refCode = 'VIOS_VIP';
  let campaignName = 'viral_cro_2026';
  let domain = 'https://tuvitoantap.online';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--ref' && args[i + 1]) {
      refCode = args[i + 1].trim();
      i++;
    } else if (args[i] === '--campaign' && args[i + 1]) {
      campaignName = args[i + 1].trim();
      i++;
    } else if (args[i] === '--domain' && args[i + 1]) {
      domain = args[i + 1].trim().replace(/\/+$/, '');
      i++;
    }
  }

  return { refCode, campaignName, domain };
}

function generateLinks() {
  const { refCode, campaignName, domain } = parseArgs();

  console.log('='.repeat(80));
  console.log('🏛️  TỬ VI TOÀN TẬP (ViOS) — COMMERCIAL GTM CAMPAIGN LINK GENERATOR');
  console.log('='.repeat(80));
  console.log(`📌 Domain:        ${domain}`);
  console.log(`🔑 Mã Giới Thiệu: ${refCode}`);
  console.log(`🎯 Tên Chiến Dịch: ${campaignName}`);
  console.log('-'.repeat(80));

  console.log('\n🌟 1. DANH SÁCH LIÊN KẾT THEO KÊNH TIẾP THỊ (TÂN THỦ NHẬN 10 XU):\n');

  for (const channel of CHANNELS) {
    const url = new URL(`${domain}/share/ref/${encodeURIComponent(refCode)}`);
    url.searchParams.set('utm_source', channel.source);
    url.searchParams.set('utm_medium', channel.medium);
    url.searchParams.set('utm_campaign', campaignName);
    url.searchParams.set('utm_content', channel.content);

    console.log(`▶ [${channel.name}]`);
    console.log(`  Mục đích: ${channel.description}`);
    console.log(`  Link:     ${url.toString()}`);
    console.log('');
  }

  console.log('-'.repeat(80));
  console.log('✨ 2. LIÊN KẾT ĐIỀU HƯỚNG THẲNG ĐẾN CÁC TÍNH NĂNG MŨI NHỌN:\n');

  for (const dest of DESTINATIONS) {
    if (dest.isShareRoute) continue;
    const url = new URL(`${domain}${dest.path}`);
    url.searchParams.set('ref', refCode);
    url.searchParams.set('utm_source', 'growth_funnel');
    url.searchParams.set('utm_medium', 'feature_landing');
    url.searchParams.set('utm_campaign', campaignName);
    url.searchParams.set('utm_content', dest.id);

    console.log(`▶ [${dest.name}]`);
    console.log(`  Link: ${url.toString()}`);
    console.log('');
  }

  console.log('='.repeat(80));
  console.log('💡 GỢI Ý CHIẾN THUẬT VIRAL:');
  console.log('  1. Link dạng /share/ref/:code tự động hiển thị ảnh OpenGraph Vương Giả khi dán lên Facebook/Zalo.');
  console.log('  2. Khách bấm vào link sẽ được tự động chuyển hướng và lưu Cookie/Storage mã giới thiệu.');
  console.log('  3. Khi khách nạp XU VietQR SePay, người giới thiệu nhận ngay 20% hoa hồng XU tự động!');
  console.log('='.repeat(80));
}

generateLinks();

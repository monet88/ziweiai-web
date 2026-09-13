<script lang="ts">
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { fetchFeatures } from '$lib/api-client/system';
  import { PrimaryButton, ThemeToggle, ViOSLogo } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import { createDashboardModel } from '$lib/features/dashboard/dashboard-model.svelte';
  import { sheetStore } from '$lib/stores/sheet.svelte';
  import BirthForm from '$lib/features/dashboard/BirthForm.svelte';
  import DashboardSidebar from '$lib/features/dashboard/DashboardSidebar.svelte';
  import WalletBalance from '$lib/features/payment/WalletBalance.svelte';
  import NotificationBell from '$lib/features/notifications/NotificationBell.svelte';
  import DailyCheckinWidget from '$lib/features/rewards/DailyCheckinWidget.svelte';
  import {
    Sparkles,
    Compass,
    Eye,
    Hand,
    Layers,
    Camera,
    Hash,
    Coins as CoinsIcon,
    Flame,
    BookOpen,
    Calendar,
    Settings,
    ArrowRight,
    CheckCircle2,
    Shield,
    Bot,
    Gift,
    Crown,
    Zap,
    Users
  } from 'lucide-svelte';
  import type { FeaturesResponse } from '@ziweiai/contracts';

  const auth = getAuthStore();
  const queryClient = useQueryClient();
  const model = createDashboardModel({ auth, queryClient });

  const isMember = $derived(auth.isAuthenticated && !auth.isAnonymous && Boolean(auth.user?.email));
  let isSigningOut = $state(false);

  async function handleSignOut(): Promise<void> {
    if (isSigningOut) return;
    isSigningOut = true;
    try {
      await auth.signOut();
      queryClient.clear();
      await goto(resolve('/sign-in'), { replaceState: true });
    } finally {
      isSigningOut = false;
    }
  }

  function openBirthForm(): void {
    sheetStore.open(BirthForm, { model }, 'Lập Lá Số Tử Vi Chi Tiết');
  }

  // 12 Hệ Thuật Số được tinh gọn theo 3 Trụ Cột Phễu Lớn với trực quan hóa Freemium [MIỄN PHÍ 100%] và [50 XU]
  const systemGroups = [
    {
      groupTitle: 'Trụ Cột Bản Mệnh',
      groupBadge: 'Chuyên Sâu Trọn Đời',
      groupDesc: 'Phân tích tổng thể cốt cách, vận trình đại vận và nghiệp duyên',
      icon: Compass,
      themeColor: '#ffd700',
      items: [
        { route: '/charts' as const, label: 'Tử Vi Đẩu Số', badge: 'MIỄN PHÍ 100%', tier: 'free', desc: 'Thiên Bàn 12 Cung & Sao Hạn Cát Hung' },
        { route: '/bazi' as const, label: 'Bát Tự Tứ Trụ', badge: 'MIỄN PHÍ 100%', tier: 'free', desc: 'Can Chi, Thập Thần & Ngũ Hành Thịnh Suy' },
        { route: '/numerology' as const, label: 'Thần Số Học', badge: 'MIỄN PHÍ 100%', tier: 'free', desc: 'Con Số Chủ Đạo & Kim Tự Tháp Cuộc Đời' },
        { route: '/hepan' as const, label: 'Hợp Hôn So Mệnh', badge: 'VIP 50 XU', tier: 'xu', desc: 'Đối Chiếu Bản Mệnh Phu Thê & Đối Tác' }
      ]
    },
    {
      groupTitle: 'Chiêm Bốc Linh Ứng',
      groupBadge: 'Vấn Đề Trước Mắt',
      groupDesc: 'Bấm quẻ định hướng tức thì cho sự nghiệp, tài lộc và tình duyên',
      icon: CoinsIcon,
      themeColor: '#c084fc',
      items: [
        { route: '/liuyao' as const, label: 'Kinh Dịch Lục Hào', badge: 'MIỄN PHÍ 100%', tier: 'free', desc: 'Gieo Quẻ Cổ Tự Động & Hào Động Biến Dịch' },
        { route: '/meihua' as const, label: 'Mai Hoa Dịch Số', badge: 'MIỄN PHÍ 100%', tier: 'free', desc: 'Khởi Quẻ Theo Thời Khắc & Hiện Tượng' },
        { route: '/stick' as const, label: 'Xin Xăm Quán Âm', badge: 'MIỄN PHÍ', tier: 'free', desc: 'Cầu Điềm Lành & Thỉnh Lời Khuyên Hóa Giải' },
        { route: '/dream' as const, label: 'Giải Mộng Triêm Bốc', badge: 'MIỄN PHÍ', tier: 'free', desc: 'Giải Mã Điềm Báo Trong Giấc Chiêm Bao' }
      ]
    },
    {
      groupTitle: 'Bí Thuật Chiêm Tinh & Thời Vận',
      groupBadge: 'Kỳ Môn Cung Đình',
      groupDesc: 'Các bộ môn thuật số thượng thừa dùng trong hoạch định chiến lược',
      icon: Layers,
      themeColor: '#38bdf8',
      items: [
        { route: '/qimen' as const, label: 'Kỳ Môn Độn Giáp', badge: 'VIP 50 XU', tier: 'xu', desc: 'Bố Trận Thời Vị & Chọn Cửa Thắng Cảnh' },
        { route: '/daliuren' as const, label: 'Đại Lục Nhâm', badge: 'VIP 50 XU', tier: 'xu', desc: 'Đệ Nhất Thần Toán Dự Đoán Nhật Nguyệt' },
        { route: '/lenormand' as const, label: 'Bài Lenormand', badge: 'MIỄN PHÍ', tier: 'free', desc: 'Tiên Tri Sự Kiện Cụ Thể Đời Thường' },
        { route: '/almanac' as const, label: 'Lịch Vạn Niên Hoàng Đạo', badge: 'MIỄN PHÍ', tier: 'free', desc: 'Chọn Ngày Giờ Lành Xuất Hành & Khai Trương' }
      ]
    }
  ];

  // AI Tools Bento Grid - Bộ công cụ trực giác & sinh trắc AI với giá rõ ràng
  const bentoTools = [
    {
      route: '/face' as const,
      flag: 'face' as keyof FeaturesResponse,
      badge: '10 XU • AI VISION SCAN',
      badgeColor: 'gold',
      tier: 'xu',
      price: '10 XU',
      icon: Eye,
      title: viCopy.dashboard.toolFaceTitle,
      desc: viCopy.dashboard.toolFaceDescription,
      highlight: true
    },
    {
      route: '/palm' as const,
      flag: 'palm' as keyof FeaturesResponse,
      badge: '10 XU • BIOMETRICS SCAN',
      badgeColor: 'gold',
      tier: 'xu',
      price: '10 XU',
      icon: Hand,
      title: viCopy.dashboard.toolPalmTitle,
      desc: viCopy.dashboard.toolPalmDescription,
      highlight: true
    },
    {
      route: '/tarot' as const,
      flag: 'tarot' as keyof FeaturesResponse,
      badge: '3 XU • 78 LÁ BÀI',
      badgeColor: 'gold',
      tier: 'xu',
      price: '3 XU',
      icon: Sparkles,
      title: viCopy.dashboard.toolTarotTitle,
      desc: viCopy.dashboard.toolTarotDescription,
      highlight: false
    },
    {
      route: '/vision-tarot' as const,
      flag: 'tarot' as keyof FeaturesResponse,
      badge: '20 XU • PHOTO ORACLE',
      badgeColor: 'gold',
      tier: 'xu',
      price: '20 XU',
      icon: Camera,
      title: viCopy.dashboard.toolVisionTarotTitle,
      desc: viCopy.dashboard.toolVisionTarotDescription,
      highlight: false
    },
    {
      route: '/numerology' as const,
      flag: 'mbti' as keyof FeaturesResponse,
      badge: 'MIỄN PHÍ 100% • PYTHAGORAS',
      badgeColor: 'emerald',
      tier: 'free',
      price: 'MIỄN PHÍ 100%',
      icon: Hash,
      title: 'Thần Số Học Toàn Diện',
      desc: 'Tính toán con số chủ đạo, 4 đỉnh cao cuộc đời và biểu đồ ngày sinh.',
      highlight: false
    },
    {
      route: '/liuyao' as const,
      flag: 'mangpai' as keyof FeaturesResponse,
      badge: 'MIỄN PHÍ 100% • KINH DỊCH',
      badgeColor: 'emerald',
      tier: 'free',
      price: 'MIỄN PHÍ 100%',
      icon: CoinsIcon,
      title: 'Gieo Quẻ Lục Hào',
      desc: 'Gieo 3 đồng tiền cổ tự động, lập quẻ chủ - quẻ biến và phân tích hào động.',
      highlight: false
    }
  ];

  const features = createQuery(() => ({
    queryKey: ['features'],
    queryFn: fetchFeatures,
    staleTime: 5 * 60_000,
  }));

  const visibleBentoTools = $derived(
    bentoTools.filter((tool) => features.data?.[tool.flag] !== false)
  );

  const promiseCards = [
    {
      icon: Calendar,
      title: 'Vận Hạn Hôm Nay',
      description: 'Theo dõi đại vận, lưu niên, lưu nguyệt và lưu nhật cập nhật chuẩn xác theo từng khắc giờ.'
    },
    {
      icon: Compass,
      title: 'Lá Số 12 Cung Bản Vị',
      description: 'An sao chuẩn mực theo thiên văn lịch pháp, thể hiện rõ thế đứng tinh bàn và cung Thân ký gửi.'
    },
    {
      icon: Flame,
      title: 'Hợp Hôn So Mệnh',
      description: 'Đối sánh hai bản đồ mệnh lý sâu sắc để xem độ tương hợp phu thê, đường con cái và quý nhân hợp tác.'
    },
    {
      icon: Bot,
      title: 'AI Luận Giải Hoàng Gia',
      description: 'Phân tích đa tầng theo cổ thư và học thuật chính tông, cảnh báo rủi ro thực tiễn, không hề ảo giác.'
    }
  ] as const;
</script>

<svelte:head>
  <title>ViOS — Hệ Điều Hành Mệnh Lý & Thuật Số AI Hoàng Gia</title>
  <meta name="description" content="ViOS Tử Vi Toàn Tập — Nền tảng thuật số AI hoàng triều đỉnh cao: Lập lá số Tử Vi chính tông, Bát Tự Tứ Trụ, Thần Số Học, Kinh Dịch Lục Hào, Xem Tướng Mặt & Chỉ Tay AI. Trải nghiệm miễn phí 100% & Điểm danh nhận thưởng XU mỗi ngày!" />
  <link rel="canonical" href="https://tuvitoantap.online/" />
  
  <meta property="og:type" content="website" />
  <meta property="og:url" content="https://tuvitoantap.online/" />
  <meta property="og:title" content="ViOS — Hệ Điều Hành Mệnh Lý & Thuật Số AI Hoàng Gia" />
  <meta property="og:description" content="Khám phá vận mệnh cùng ViOS: Lập lá số Tử Vi, Tứ Trụ Bát Tự, Thần Số Học, Kinh Dịch, Nhân Tướng AI. Trải nghiệm miễn phí 100% & Điểm danh nhận thưởng XU mỗi ngày!" />
  <meta property="og:image" content="https://tuvitoantap.online/og-image.png" />
  
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="ViOS — Hệ Điều Hành Mệnh Lý & Thuật Số AI Hoàng Gia" />
  <meta name="twitter:description" content="Khám phá vận mệnh cùng ViOS: Lập lá số Tử Vi, Tứ Trụ Bát Tự, Thần Số Học, Kinh Dịch, Nhân Tướng AI. Trải nghiệm miễn phí 100% & Điểm danh nhận thưởng XU mỗi ngày!" />
  <meta name="twitter:image" content="https://tuvitoantap.online/og-image.png" />
</svelte:head>

<main class="celestial-page">
  <!-- Dynamic Celestial Stardust Aura Background -->
  <div class="celestial-stardust-bg" aria-hidden="true">
    <div class="aurora-glow glow-gold"></div>
    <div class="aurora-glow glow-purple"></div>
  </div>

  <div class="shell">
    <!-- TOPBAR HUD: Navigation & Wallet Bar -->
    <header class="topbar-celestial">
      <a class="brand-link" href={resolve('/')}>
        <ViOSLogo size="md" showTagline={false} />
        <span class="vios-badge">CELESTIAL AI</span>
      </a>

      <nav class="top-links" aria-label="Điều hướng chính">
        <a href="#quick-create" class="nav-btn">Lập Lá Số</a>
        <a href="#ai-tools" class="nav-btn">Thần Khí AI</a>
        <a href="#vip-conversion" class="nav-btn">Ví XU & Ưu Đãi</a>
        <a href="#universe-hub" class="nav-btn">12 Thuật Số</a>
        <a href={resolve('/blog')} class="nav-btn">Cẩm Nang</a>
        {#if isMember}
          <a href={resolve('/history')} class="nav-btn">Lịch Sử</a>
        {/if}
      </nav>

      <div class="session-actions">
        <ThemeToggle />
        <NotificationBell />
        
        <!-- Nút Nạp XU Hoàng Kim -->
        <a class="wallet-pill-luxury" href={resolve('/wallet')} title="Mở ví XU & Điểm danh">
          <CoinsIcon size={15} class="coin-icon" />
          <span class="wallet-text">Ví & Điểm Danh</span>
          <span class="gift-indicator"><Gift size={11} /></span>
        </a>

        {#if !isMember}
          <a class="btn-signin-luxury" href={resolve('/sign-in')}>Đăng Nhập</a>
        {:else}
          <WalletBalance />
          <span class="user-email-tag" title={auth.user?.email ?? undefined}>
            {auth.user?.email}
          </span>
          <a class="btn-icon-link" href={resolve('/settings')} title="Cài đặt">
            <Settings size={18} />
          </a>
          <button class="btn-signout" onclick={handleSignOut} disabled={isSigningOut}>
            Đăng xuất
          </button>
        {/if}
      </div>
    </header>

    <!-- TẦNG 1: HERO SECTION - CELESTIAL ASTRO WHEEL & TEASER HOOK -->
    <section class="hero-section" aria-labelledby="hero-heading">
      <div class="hero-content">
        <div class="hero-eyebrow-pill">
          <Sparkles size={14} class="text-celestial-gold" />
          <span>VIOS CELESTIAL INTELLIGENCE PLATFORM</span>
        </div>

        <h1 id="hero-heading" class="hero-title">
          {viCopy.dashboard.heroTitle}
        </h1>

        <p class="hero-description">
          {viCopy.dashboard.heroSubtitle}
        </p>

        <!-- CTA Groups -->
        <div class="hero-cta-group">
          <button class="btn-cta-gold-luxury" onclick={openBirthForm}>
            <Sparkles size={18} />
            <span>Lập Lá Số Tử Vi Chi Tiết (Miễn Phí)</span>
            <div class="cta-shimmer"></div>
          </button>
          
          <a class="btn-cta-secondary" href="#ai-tools">
            <span>Trải Nghiệm Thần Khí AI</span>
            <ArrowRight size={16} />
          </a>
        </div>

        <!-- 3 Trust Badges Hoàng Gia -->
        <div class="hero-trust-list">
          <div class="trust-item">
            <CheckCircle2 size={16} class="text-celestial-gold" />
            <span>An Sao Chuẩn Thiên Văn Cổ</span>
          </div>
          <div class="trust-item">
            <Shield size={16} class="text-celestial-gold" />
            <span>Bảo Mật Riêng Tư 100%</span>
          </div>
          <div class="trust-item">
            <Bot size={16} class="text-celestial-purple" />
            <span>AI Đa Tầng Không Ảo Giác</span>
          </div>
        </div>
      </div>

      <!-- CELESTIAL ASTRO DIAL (Thiên Bàn 12 Cung Hoàng Kim) -->
      <div class="hero-dial-wrapper">
        <div class="celestial-astro-dial">
          <div class="dial-outer-orbit"></div>
          <div class="dial-zodiac-ring">
            <span class="zodiac-node pos-0">Tý</span>
            <span class="zodiac-node pos-1">Sửu</span>
            <span class="zodiac-node pos-2">Dần</span>
            <span class="zodiac-node pos-3">Mão</span>
            <span class="zodiac-node pos-4">Thìn</span>
            <span class="zodiac-node pos-5">Tỵ</span>
            <span class="zodiac-node pos-6">Ngọ</span>
            <span class="zodiac-node pos-7">Mùi</span>
            <span class="zodiac-node pos-8">Thân</span>
            <span class="zodiac-node pos-9">Dậu</span>
            <span class="zodiac-node pos-10">Tuất</span>
            <span class="zodiac-node pos-11">Hợi</span>
          </div>
          
          <div class="dial-inner-core">
            <div class="taiji-symbol">
              <div class="taiji-dot dot-top"></div>
              <div class="taiji-dot dot-bottom"></div>
            </div>
          </div>

          <!-- Floating Orbit Badges (Cung Mệnh, Thân, Tài, Quan) -->
          <div class="orbit-hud-tag tag-menh">
            <span class="hud-dot"></span>
            <strong>Cung Mệnh</strong>
          </div>
          <div class="orbit-hud-tag tag-quan">
            <span class="hud-dot"></span>
            <strong>Quan Lộc</strong>
          </div>
          <div class="orbit-hud-tag tag-tai">
            <span class="hud-dot"></span>
            <strong>Tài Bạch</strong>
          </div>
          <div class="orbit-hud-tag tag-di">
            <span class="hud-dot"></span>
            <strong>Thiên Di</strong>
          </div>
        </div>

        <!-- 3 Feature Pills -->
        <div class="dial-features-bar">
          <div class="feat-pill">
            <Compass size={14} class="text-celestial-gold" />
            <div class="feat-info">
              <strong>12 Cung Vận Mệnh</strong>
              <small>Thiên bàn cá nhân</small>
            </div>
          </div>
          <div class="feat-pill">
            <Bot size={14} class="text-celestial-purple" />
            <div class="feat-info">
              <strong>AI Luận Giải</strong>
              <small>Cốt tủy đại vận</small>
            </div>
          </div>
          <div class="feat-pill">
            <Crown size={14} class="text-celestial-gold" />
            <div class="feat-info">
              <strong>Lưu Hồ Sơ VIP</strong>
              <small>Xem lại trọn đời</small>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- TẦNG 2: THẦN KHÍ AI — TRỰC GIÁC & SINH TRẮC TỨC THỜI (BENTO GRID) -->
    <section class="bento-section" id="ai-tools">
      <div class="section-title-wrap">
        <div class="eyebrow-tag">
          <Zap size={15} class="text-celestial-gold" />
          <span>THẦN KHÍ AI TỨC THỜI — TRẢI NGHIỆM TRONG 30 GIÂY</span>
        </div>
        <h2 class="section-heading">{viCopy.dashboard.toolSectionTitle}</h2>
        <p class="section-subtext">{viCopy.dashboard.toolSectionDescription}</p>
      </div>

      <div class="bento-grid">
        {#each visibleBentoTools as tool (tool.route)}
          <a href={resolve(tool.route as any)} class="bento-card-celestial {tool.highlight ? 'bento-highlight' : ''}">
            <div class="bento-card-top">
              <span class="bento-badge badge-{tool.badgeColor}">{tool.badge}</span>
              <div class="bento-icon-box">
                <tool.icon size={22} />
              </div>
            </div>
            
            <div class="bento-card-body">
              <h3 class="bento-title">{tool.title}</h3>
              <p class="bento-desc">{tool.desc}</p>
            </div>

            <div class="bento-card-footer">
              <div class="bento-footer-label">
                <span>Trải nghiệm ngay</span>
                <span class="bento-price-pill price-{tool.tier}">{tool.price}</span>
              </div>
              <ArrowRight size={14} class="arrow-icon" />
            </div>
          </a>
        {/each}
      </div>
    </section>

    <!-- TẦNG 3: THIỆP VÀNG HOÀNG GIA (CONVERSION TEASER PAYWALL & NẠP XU) -->
    <section class="vip-conversion-section" id="vip-conversion">
      <DailyCheckinWidget />

      <div class="royal-card">
        <div class="royal-badge-wrap">
          <Crown size={16} class="text-celestial-gold" />
          <span>CHƯƠNG TRÌNH HỘI VIÊN VIOS VIP · KHÂM THIÊN BẢO GIÁM</span>
        </div>

        <div class="royal-content">
          <div class="royal-main-text">
            <h2 class="royal-title">Nâng Cấp Hội Viên ViOS VIP — Đỉnh Cao Mệnh Lý</h2>
            <p class="royal-sub">
              Trở thành Hội Viên Hoàng Thân để tiếp cận trọn vẹn tinh hoa thuật số với <strong>2 cách thức cực kỳ dễ dàng</strong>:
            </p>

            <!-- 2 Con đường lên VIP -->
            <div class="vip-pathways-grid">
              <div class="pathway-card">
                <div class="pathway-badge">CÁCH 1: NẠP TÍCH LŨY</div>
                <div class="pathway-title">Nạp từ 50.000đ</div>
                <p class="pathway-desc">Nhận ngay 120 XU (tặng thêm +20% XU lần đầu) & kích hoạt VIP trọn đời tức thì.</p>
              </div>
              <div class="pathway-card highlight-ref">
                <div class="pathway-badge free-badge">CÁCH 2: MIỄN PHÍ 100%</div>
                <div class="pathway-title">Giới Thiệu 5 Bạn Bè</div>
                <p class="pathway-desc">Chia sẻ mã giới thiệu, đủ 5 bạn đăng ký -> Nhận VIP miễn phí + thưởng 10 XU/người.</p>
              </div>
            </div>

            <!-- Đặc quyền VIP -->
            <div class="royal-perks-list">
              <div class="perk-item">
                <CheckCircle2 size={15} class="text-celestial-gold" />
                <span><strong>Mở khóa Luận Giải Tam Hợp VIP:</strong> Kết hợp Tử Vi + Bát Tự + Quẻ Dịch cùng lúc</span>
              </div>
              <div class="perk-item">
                <CheckCircle2 size={15} class="text-celestial-gold" />
                <span><strong>Ưu đãi 50% chi phí XU:</strong> Giảm nửa giá khi đàm đạo chuyên sâu cùng AI Master</span>
              </div>
              <div class="perk-item">
                <CheckCircle2 size={15} class="text-celestial-gold" />
                <span><strong>Xuất Hồ Sơ Hoàng Gia PDF 19 Trang:</strong> Tải toàn bộ bản luận giải A4 không watermark</span>
              </div>
            </div>
          </div>

          <div class="royal-action-card">
            <div class="action-card-header">
              <Crown size={26} class="text-celestial-gold" />
              <div>
                <strong>Tham Gia Hội Viên VIP</strong>
                <small>Chọn nạp VietQR hoặc giới thiệu bạn bè</small>
              </div>
            </div>

            <div class="action-buttons-group">
              <a href={resolve('/wallet')} class="btn-royal-deposit">
                <Zap size={16} />
                <span>Nạp 50k Lên VIP Tức Thì</span>
              </a>
              <a href={resolve('/wallet')} class="btn-royal-checkin">
                <Users size={16} />
                <span>Giới Thiệu Bạn Bè (Lên VIP Free)</span>
              </a>
            </div>
            <small class="secure-note">
              <Shield size={12} /> Tự động thăng hạng VIP ngay khi đạt điều kiện — Bảo chứng trọn đời
            </small>
          </div>
        </div>
      </div>
    </section>

    <!-- TẦNG 4: KHỞI TẠO LÁ SỐ & MA TRẬN 12 BỘ MÔN THUẬT SỐ -->
    <section class="workspace-section" id="quick-create">
      <!-- Cột Trái: Interactive Quick Form Card -->
      <div class="quickform-container" id="create-chart">
        <div class="quickform-header">
          <div class="quickform-icon-box">
            <Compass size={24} class="text-celestial-gold" />
          </div>
          <div>
            <h2 class="quickform-title">Khởi Tạo Lá Số Tử Vi Ngay</h2>
            <p class="quickform-sub">Nhập thông tin ngày giờ sinh để an sao chuẩn xác và khám phá vận mệnh.</p>
          </div>
        </div>

        <div class="quickform-action-box">
          <p class="quickform-action-text">
            Hệ thống hỗ trợ cả Lịch Dương và Lịch Âm, tự động tính giờ Sóc, giờ Tý đổi ngày và xác định chuẩn xác múi giờ Việt Nam (GMT+7).
          </p>
          <PrimaryButton
            label="Nhập Thông Tin & Lập Lá Số Chi Tiết"
            onclick={openBirthForm}
          />
        </div>
      </div>

      <!-- Cột Phải: UNIVERSE HUB (TINH GỌN 3 PHÂN NHÓM) -->
      <div class="universe-hub-container" id="universe-hub">
        <div class="universe-hub-header">
          <BookOpen size={22} class="text-celestial-purple" />
          <div>
            <h2 class="universe-hub-title">Ma Trận 12 Bộ Môn Thuật Số</h2>
            <p class="universe-hub-sub">Khám phá các phương thức chiêm nghiệm phong thủy & vận mệnh cổ truyền</p>
          </div>
        </div>

        <div class="universe-groups-list">
          {#each systemGroups as group (group.groupTitle)}
            <div class="group-accordion-card">
              <div class="group-card-header">
                <div class="group-header-left">
                  <group.icon size={18} style="color: {group.themeColor};" />
                  <div>
                    <h3 class="group-title">{group.groupTitle}</h3>
                    <span class="group-desc">{group.groupDesc}</span>
                  </div>
                </div>
                <span class="group-badge" style="border-color: {group.themeColor}44; color: {group.themeColor};">
                  {group.groupBadge}
                </span>
              </div>

              <div class="group-items-grid">
                {#each group.items as item (item.route)}
                  <a href={resolve(item.route as any)} class="system-item-pill">
                    <div class="item-text-group">
                      <span class="item-label">{item.label}</span>
                      <small class="item-desc">{item.desc}</small>
                    </div>
                    <span class="item-badge badge-{item.tier}">{item.badge}</span>
                  </a>
                {/each}
              </div>
            </div>
          {/each}
        </div>

        {#if isMember}
          <div class="sidebar-history-wrap">
            <DashboardSidebar onCreateFirst={openBirthForm} />
          </div>
        {/if}
      </div>
    </section>

    <!-- TẦNG 5: PHƯƠNG PHÁP LUẬN ĐA TẦNG & BẢO CHỨNG -->
    <section class="promise-section">
      <div class="section-title-wrap text-center">
        <div class="eyebrow-tag center">
          <Layers size={15} class="text-celestial-gold" />
          <span>PHƯƠNG PHÁP LUẬN ĐA TẦNG</span>
        </div>
        <h2 class="section-heading">Bốn Trọng Tâm Luận Giải Mệnh Lý ViOS</h2>
      </div>

      <div class="promise-cards-grid">
        {#each promiseCards as card (card.title)}
          <div class="promise-glass-card">
            <div class="promise-icon-wrap">
              <card.icon size={22} class="text-celestial-gold" />
            </div>
            <h3 class="promise-card-title">{card.title}</h3>
            <p class="promise-card-desc">{card.description}</p>
          </div>
        {/each}
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer-celestial">
      <div class="footer-inner">
        <div class="footer-brand-summary">
          <ViOSLogo size="sm" showTagline={false} />
          <span>ViOS — Hệ Điều Hành Mệnh Lý & Thuật Số AI Toàn Diện</span>
        </div>

        <div class="footer-links">
          <a href={resolve('/blog')}>Cẩm Nang Mệnh Lý</a>
          <span class="sep">•</span>
          <a href={resolve('/terms')}>Điều Khoản Dịch Vụ</a>
          <span class="sep">•</span>
          <a href={resolve('/privacy')}>Chính Sách Bảo Mật</a>
          <span class="sep">•</span>
          <a href="mailto:contact@tuvitoantap.online">Liên Hệ Hỗ Trợ</a>
          <span class="sep">•</span>
          <a href={resolve('/wallet')}>Quy Chế Ví XU</a>
        </div>

        <div class="footer-copy">
          &copy; {new Date().getFullYear()} ViOS (Tử Vi Toàn Tập). All rights reserved.
        </div>
      </div>
    </footer>
  </div>
</main>

<style>
  /* ---------------------------------------------------------------------------
     CELESTIAL LUXURY PAGE CONTAINER & AMBIENCE
     --------------------------------------------------------------------------- */
  .celestial-page {
    position: relative;
    min-height: 100dvh;
    background:
      radial-gradient(ellipse 75% 50% at 15% 0%, rgba(212, 175, 55, 0.1), transparent 60%),
      radial-gradient(ellipse 60% 45% at 85% 10%, rgba(168, 85, 247, 0.12), transparent 55%),
      linear-gradient(180deg, #110d22 0%, #0a0815 50%, #06050e 100%);
    color: var(--color-text-primary);
    overflow-x: hidden;
  }

  :global([data-theme="light"]) .celestial-page {
    background:
      radial-gradient(ellipse 75% 50% at 15% 0%, rgba(212, 175, 55, 0.08), transparent 60%),
      radial-gradient(ellipse 60% 45% at 85% 10%, rgba(168, 85, 247, 0.06), transparent 55%),
      linear-gradient(180deg, #faf8f5 0%, #f4f0e6 100%);
  }

  /* Stardust Layer Effect */
  .celestial-stardust-bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  .aurora-glow {
    position: absolute;
    width: 60vw;
    height: 60vw;
    border-radius: 50%;
    filter: blur(120px);
    opacity: 0.25;
    transform: translateZ(0);
  }

  .glow-gold {
    top: -20vw;
    left: -10vw;
    background: radial-gradient(circle, #d4af37, transparent 70%);
  }

  .glow-purple {
    top: 5vw;
    right: -15vw;
    background: radial-gradient(circle, #a855f7, transparent 70%);
  }

  .shell {
    position: relative;
    z-index: 1;
    box-sizing: border-box;
    width: min(100%, 1240px);
    margin: 0 auto;
    padding: var(--space-md) var(--space-lg) 90px;
    display: flex;
    flex-direction: column;
    gap: 52px;
  }

  /* ---------------------------------------------------------------------------
     TOPBAR HUD
     --------------------------------------------------------------------------- */
  .topbar-celestial {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 20px;
    background: rgba(22, 17, 38, 0.75);
    backdrop-filter: blur(24px) saturate(180%);
    -webkit-backdrop-filter: blur(24px) saturate(180%);
    border: 1px solid rgba(212, 175, 55, 0.22);
    border-radius: var(--radius-pill);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  }

  :global([data-theme="light"]) .topbar-celestial {
    background: rgba(255, 255, 255, 0.82);
    border-color: rgba(212, 175, 55, 0.25);
    box-shadow: 0 10px 30px rgba(212, 175, 55, 0.1);
  }

  .brand-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
  }

  .vios-badge {
    font-size: 10px;
    font-weight: 850;
    letter-spacing: 0.08em;
    padding: 2px 7px;
    border-radius: var(--radius-pill);
    background: var(--celestial-badge-bg);
    color: var(--celestial-badge-text);
    border: 1px solid var(--celestial-badge-border);
  }

  .top-links {
    display: none;
    align-items: center;
    gap: 6px;
  }

  @media (min-width: 820px) {
    .top-links {
      display: flex;
    }
  }

  .nav-btn {
    padding: 6px 14px;
    border-radius: var(--radius-pill);
    color: var(--color-text-secondary);
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .nav-btn:hover {
    background: var(--celestial-badge-bg);
    color: var(--celestial-gold-text);
  }

  .session-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .wallet-pill-luxury {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: var(--radius-pill);
    background: var(--celestial-badge-bg);
    border: 1px solid var(--celestial-border-gold-strong);
    color: var(--celestial-gold-text);
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
    box-shadow: 0 0 12px var(--celestial-gold-glow);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .wallet-pill-luxury:hover {
    transform: translateY(-1px);
    border-color: var(--celestial-gold);
    box-shadow: 0 0 18px var(--celestial-gold-glow);
  }

  .coin-icon {
    color: var(--celestial-gold-icon);
    filter: drop-shadow(0 0 4px var(--celestial-gold-glow));
  }

  .gift-indicator {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ef4444;
    color: #ffffff;
    font-size: 9px;
  }

  .btn-signin-luxury {
    padding: 6px 16px;
    border-radius: var(--radius-pill);
    background: linear-gradient(135deg, #ffd700 0%, #d4af37 100%);
    color: #100c22;
    font-size: 13px;
    font-weight: 800;
    text-decoration: none;
    box-shadow: 0 4px 14px rgba(212, 175, 55, 0.35);
    transition: all 0.2s ease;
  }

  .btn-signin-luxury:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(212, 175, 55, 0.5);
  }

  .user-email-tag {
    max-width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 12px;
    color: var(--color-text-muted);
  }

  .btn-icon-link {
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    transition: color 0.15s ease;
  }

  .btn-icon-link:hover {
    color: #ffd700;
  }

  .btn-signout {
    background: transparent;
    border: 1px solid var(--overlay-border);
    color: var(--color-text-muted);
    font-size: 12px;
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    cursor: pointer;
  }

  .btn-signout:hover {
    background: var(--overlay-ink-wash);
    color: var(--color-text-primary);
  }

  /* ---------------------------------------------------------------------------
     HERO SECTION
     --------------------------------------------------------------------------- */
  .hero-section {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(360px, 0.8fr);
    gap: clamp(32px, 5vw, 64px);
    align-items: center;
    padding: 16px 0;
  }

  @media (max-width: 980px) {
    .hero-section {
      grid-template-columns: 1fr;
    }
  }

  .hero-content {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 20px;
  }

  .hero-eyebrow-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: var(--radius-pill);
    background: var(--celestial-badge-bg);
    border: 1px solid var(--celestial-badge-border);
    font-size: 11px;
    font-weight: 850;
    letter-spacing: 0.06em;
    color: var(--celestial-badge-text);
  }

  .hero-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: clamp(34px, 4.2vw, 54px);
    font-weight: 850;
    line-height: 1.12;
    letter-spacing: -0.01em;
    background: linear-gradient(135deg, #ffffff 30%, #fef08a 70%, #d4af37 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  :global([data-theme="light"]) .hero-title {
    background: linear-gradient(135deg, #110d22 25%, #92400e 75%, #78350f 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .hero-description {
    margin: 0;
    max-width: 580px;
    font-size: 16px;
    line-height: 1.65;
    color: var(--color-text-secondary);
  }

  .hero-cta-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    margin-top: 6px;
  }

  .btn-cta-gold-luxury {
    position: relative;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 50px;
    padding: 0 26px;
    border-radius: var(--radius-pill);
    background: linear-gradient(135deg, #fff7c2 0%, #ffd700 35%, #d4af37 70%, #aa7c11 100%);
    color: #100c22;
    border: 1px solid rgba(255, 255, 255, 0.4);
    font-size: 15px;
    font-weight: 850;
    cursor: pointer;
    box-shadow: 0 10px 28px rgba(212, 175, 55, 0.42);
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  :global([data-theme="light"]) .btn-cta-gold-luxury {
    background: linear-gradient(135deg, #fef08a 0%, #f59e0b 40%, #d97706 75%, #b45309 100%);
    color: #1c1204;
    border: 1px solid rgba(180, 83, 9, 0.3);
    box-shadow: 0 10px 28px rgba(180, 83, 9, 0.35);
  }

  .btn-cta-gold-luxury:hover {
    transform: translateY(-2px);
    box-shadow: 0 14px 36px rgba(212, 175, 55, 0.6);
  }

  :global([data-theme="light"]) .btn-cta-gold-luxury:hover {
    box-shadow: 0 14px 36px rgba(180, 83, 9, 0.5);
  }

  .cta-shimmer {
    position: absolute;
    top: 0;
    left: -100%;
    width: 60%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transform: skewX(-20deg);
    animation: shimmerGlow 3.5s infinite;
  }

  @keyframes shimmerGlow {
    0% { left: -100%; }
    40% { left: 160%; }
    100% { left: 160%; }
  }

  .btn-cta-secondary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 50px;
    padding: 0 22px;
    border-radius: var(--radius-pill);
    background: var(--celestial-hud-bg);
    border: 1px solid var(--celestial-hud-border);
    color: var(--celestial-hud-text);
    font-size: 14px;
    font-weight: 750;
    text-decoration: none;
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
    transition: all 0.2s ease;
  }

  .btn-cta-secondary:hover {
    background: var(--celestial-badge-bg);
    border-color: var(--celestial-border-gold-strong);
    color: var(--celestial-gold-text);
    transform: translateY(-1px);
  }

  .hero-trust-list {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    margin-top: 8px;
    padding-top: 18px;
    border-top: 1px solid var(--celestial-border-gold);
  }

  .trust-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 650;
    color: var(--color-text-secondary);
  }

  :global([data-theme="light"]) .trust-item {
    color: #1e1b4b;
    font-weight: 700;
  }

  /* ---------------------------------------------------------------------------
     CELESTIAL ASTRO DIAL (Thiên Bàn 12 Cung)
     --------------------------------------------------------------------------- */
  .hero-dial-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .celestial-astro-dial {
    position: relative;
    width: min(100%, 390px);
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background:
      radial-gradient(circle at center, rgba(212, 175, 55, 0.18) 0%, rgba(168, 85, 247, 0.1) 45%, transparent 72%);
    box-shadow: 0 0 60px var(--celestial-gold-glow);
  }

  :global([data-theme="light"]) .celestial-astro-dial {
    background:
      radial-gradient(circle at center, rgba(254, 243, 199, 0.8) 0%, rgba(243, 232, 255, 0.5) 45%, transparent 72%);
    box-shadow: 0 8px 36px rgba(180, 83, 9, 0.15);
  }

  .dial-outer-orbit {
    position: absolute;
    inset: 0;
    border: 2px dashed rgba(212, 175, 55, 0.4);
    border-radius: 50%;
    animation: rotateAstro 75s linear infinite;
  }

  :global([data-theme="light"]) .dial-outer-orbit {
    border-color: rgba(180, 83, 9, 0.45);
  }

  .dial-zodiac-ring {
    position: absolute;
    inset: 12%;
    border: 1px solid rgba(168, 85, 247, 0.35);
    border-radius: 50%;
    animation: rotateAstroReverse 55s linear infinite;
  }

  :global([data-theme="light"]) .dial-zodiac-ring {
    border-color: rgba(124, 58, 237, 0.35);
  }

  .zodiac-node {
    position: absolute;
    font-size: 11px;
    font-weight: 850;
    color: var(--celestial-gold-bright);
    text-shadow: 0 0 8px var(--celestial-gold-glow);
  }

  :global([data-theme="light"]) .zodiac-node {
    color: #3b0764;
    text-shadow: 0 1px 1px rgba(255, 255, 255, 0.9);
    font-size: 11.5px;
    font-weight: 900;
  }

  .pos-0 { top: 4px; left: calc(50% - 8px); }
  .pos-1 { top: 12%; right: 22%; }
  .pos-2 { top: 26%; right: 8%; }
  .pos-3 { top: calc(50% - 8px); right: 2px; }
  .pos-4 { bottom: 26%; right: 8%; }
  .pos-5 { bottom: 12%; right: 22%; }
  .pos-6 { bottom: 4px; left: calc(50% - 8px); }
  .pos-7 { bottom: 12%; left: 22%; }
  .pos-8 { bottom: 26%; left: 8%; }
  .pos-9 { top: calc(50% - 8px); left: 2px; }
  .pos-10 { top: 26%; left: 8%; }
  .pos-11 { top: 12%; left: 22%; }

  .dial-inner-core {
    position: absolute;
    inset: 28%;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background: radial-gradient(circle, #2a1f42 0%, #0e0a1b 100%);
    border: 2px solid rgba(212, 175, 55, 0.6);
    box-shadow: inset 0 0 24px rgba(212, 175, 55, 0.45), 0 0 35px rgba(168, 85, 247, 0.35);
  }

  :global([data-theme="light"]) .dial-inner-core {
    border-color: rgba(180, 83, 9, 0.6);
  }

  .taiji-symbol {
    position: relative;
    width: 54px;
    height: 54px;
    border-radius: 50%;
    background: linear-gradient(180deg, #ffd700 50%, #150f29 50%);
    border: 1.5px solid rgba(212, 175, 55, 0.8);
    box-shadow: 0 0 20px rgba(212, 175, 55, 0.6);
    animation: rotateAstro 25s linear infinite;
  }

  :global([data-theme="light"]) .taiji-symbol {
    border-color: rgba(180, 83, 9, 0.8);
    box-shadow: 0 0 16px rgba(180, 83, 9, 0.35);
  }

  .taiji-dot {
    position: absolute;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    left: calc(50% - 3.5px);
  }

  .dot-top {
    top: 11px;
    background: #150f29;
  }

  .dot-bottom {
    bottom: 11px;
    background: #ffd700;
  }

  @keyframes rotateAstro {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @keyframes rotateAstroReverse {
    from { transform: rotate(360deg); }
    to { transform: rotate(0deg); }
  }

  .orbit-hud-tag {
    position: absolute;
    z-index: 2;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    background: var(--celestial-hud-bg);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid var(--celestial-hud-border);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);
    font-size: 11px;
    font-weight: 750;
    color: var(--celestial-hud-text);
  }

  .hud-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--celestial-gold-bright);
    box-shadow: 0 0 8px var(--celestial-gold-bright);
  }

  .tag-menh { top: 6%; left: 8%; color: #ffd700; }
  .tag-quan { top: 10%; right: 4%; color: #c084fc; }
  .tag-tai { bottom: 8%; left: 10%; color: #38bdf8; }
  .tag-di { bottom: 12%; right: 6%; color: #10b981; }

  :global([data-theme="light"]) .tag-menh { color: #92400e; }
  :global([data-theme="light"]) .tag-quan { color: #6d28d9; }
  :global([data-theme="light"]) .tag-tai { color: #0284c7; }
  :global([data-theme="light"]) .tag-di { color: #059669; }

  .dial-features-bar {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    width: min(100%, 390px);
  }

  .feat-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: var(--radius-md);
    background: var(--celestial-hud-bg);
    border: 1px solid var(--celestial-hud-border);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
  }

  .feat-info {
    display: flex;
    flex-direction: column;
  }

  .feat-info strong {
    font-size: 11px;
    font-weight: 750;
    color: var(--color-text-primary);
  }

  :global([data-theme="light"]) .feat-info strong {
    color: #1e1b4b;
    font-weight: 800;
  }

  .feat-info small {
    font-size: 10px;
    color: var(--color-text-muted);
  }

  :global([data-theme="light"]) .feat-info small {
    color: #4b5563;
    font-weight: 500;
  }

  /* ---------------------------------------------------------------------------
     TẦNG 2: BENTO GRID AI TOOLS
     --------------------------------------------------------------------------- */
  .bento-section {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .section-title-wrap {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .section-title-wrap.text-center {
    align-items: center;
    text-align: center;
  }

  .eyebrow-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 850;
    letter-spacing: 0.06em;
    color: var(--celestial-gold-text);
    text-transform: uppercase;
  }

  .eyebrow-tag.center {
    justify-content: center;
  }

  .section-heading {
    margin: 0;
    font-family: var(--font-serif);
    font-size: clamp(26px, 3.4vw, 36px);
    font-weight: 850;
    color: var(--color-text-primary);
  }

  .section-subtext {
    margin: 0;
    max-width: 620px;
    font-size: 15px;
    color: var(--color-text-secondary);
  }

  .bento-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }

  .bento-card-celestial {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 200px;
    padding: 24px;
    border-radius: 20px;
    background: rgba(24, 18, 44, 0.72);
    backdrop-filter: blur(20px) saturate(170%);
    -webkit-backdrop-filter: blur(20px) saturate(170%);
    border: 1px solid rgba(212, 175, 55, 0.22);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
    text-decoration: none;
    color: var(--color-text-primary);
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  :global([data-theme="light"]) .bento-card-celestial {
    background: #ffffff;
    border-color: var(--celestial-border-gold);
    box-shadow: 0 10px 28px rgba(180, 83, 9, 0.08);
  }

  .bento-card-celestial:hover {
    transform: translateY(-4px);
    border-color: var(--celestial-border-gold-strong);
    box-shadow: 0 18px 40px rgba(0, 0, 0, 0.5), 0 0 25px var(--celestial-gold-glow);
  }

  :global([data-theme="light"]) .bento-card-celestial:hover {
    box-shadow: 0 16px 36px rgba(180, 83, 9, 0.16);
  }

  .bento-highlight {
    border-color: rgba(255, 215, 0, 0.35);
    background: radial-gradient(circle at 100% 0%, rgba(255, 215, 0, 0.12), transparent 50%), rgba(24, 18, 44, 0.8);
  }

  :global([data-theme="light"]) .bento-highlight {
    background: radial-gradient(circle at 100% 0%, rgba(254, 243, 199, 0.6), transparent 50%), #ffffff;
    border-color: rgba(180, 83, 9, 0.35);
  }

  .bento-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .bento-badge {
    font-size: 10px;
    font-weight: 850;
    padding: 3px 8px;
    border-radius: var(--radius-pill);
    letter-spacing: 0.06em;
  }

  .badge-gold {
    background: var(--celestial-badge-bg);
    color: var(--celestial-badge-text);
    border: 1px solid var(--celestial-badge-border);
  }

  .badge-purple {
    background: rgba(168, 85, 247, 0.15);
    color: #c084fc;
    border: 1px solid rgba(168, 85, 247, 0.35);
  }

  :global([data-theme="light"]) .badge-purple {
    background: rgba(243, 232, 255, 0.9);
    color: #6d28d9;
    border-color: rgba(124, 58, 237, 0.35);
  }

  .badge-blue {
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.35);
  }

  :global([data-theme="light"]) .badge-blue {
    background: rgba(224, 242, 254, 0.9);
    color: #0369a1;
    border-color: rgba(2, 132, 199, 0.35);
  }

  .badge-emerald {
    background: rgba(16, 185, 129, 0.16);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.4);
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.15);
  }

  :global([data-theme="light"]) .badge-emerald {
    background: rgba(209, 250, 229, 0.95);
    color: #047857;
    border-color: rgba(5, 150, 105, 0.4);
    font-weight: 800;
  }

  .bento-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid rgba(212, 175, 55, 0.25);
    color: var(--celestial-gold-icon);
  }

  :global([data-theme="light"]) .bento-icon-box {
    background: rgba(254, 243, 199, 0.7);
    border-color: rgba(180, 83, 9, 0.25);
    color: #b45309;
  }

  .bento-card-body {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin: 16px 0;
  }

  .bento-title {
    margin: 0;
    font-size: 20px;
    font-weight: 850;
  }

  :global([data-theme="light"]) .bento-title {
    color: #111827;
  }

  .bento-desc {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  :global([data-theme="light"]) .bento-desc {
    color: #374151;
  }

  .bento-card-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
    font-size: 13px;
    font-weight: 750;
    color: var(--celestial-gold-text);
  }

  :global([data-theme="light"]) .bento-card-footer {
    color: #b45309;
    font-weight: 800;
  }

  .bento-footer-label {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .bento-price-pill {
    font-size: 10px;
    font-weight: 800;
    padding: 2px 7px;
    border-radius: var(--radius-pill);
    letter-spacing: 0.03em;
  }

  .bento-price-pill.price-free {
    background: rgba(16, 185, 129, 0.16);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.4);
  }

  :global([data-theme="light"]) .bento-price-pill.price-free {
    background: #ecfdf5;
    color: #047857;
    border-color: rgba(5, 150, 105, 0.4);
  }

  .bento-price-pill.price-xu {
    background: rgba(245, 158, 11, 0.16);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.4);
  }

  :global([data-theme="light"]) .bento-price-pill.price-xu {
    background: #fffbeb;
    color: #b45309;
    border-color: rgba(217, 119, 6, 0.4);
  }

  .arrow-icon {
    transition: transform 0.2s ease;
  }

  .bento-card-celestial:hover .arrow-icon {
    transform: translateX(4px);
  }

  /* ---------------------------------------------------------------------------
     TẦNG 3: THIỆP VÀNG HOÀNG GIA (CONVERSION TEASER PAYWALL)
     --------------------------------------------------------------------------- */
  .vip-conversion-section {
    position: relative;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .royal-card {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: clamp(24px, 4vw, 36px);
    border-radius: 24px;
    background: linear-gradient(135deg, rgba(32, 24, 60, 0.85) 0%, rgba(18, 14, 34, 0.95) 100%);
    border: 1.5px solid rgba(255, 215, 0, 0.38);
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5), inset 0 0 24px rgba(212, 175, 55, 0.12);
  }

  :global([data-theme="light"]) .royal-card {
    background: linear-gradient(135deg, #fffdfa 0%, #f7f3e8 100%);
    border-color: rgba(180, 83, 9, 0.38);
    box-shadow: 0 16px 48px rgba(180, 83, 9, 0.12);
  }

  .royal-badge-wrap {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 4px 14px;
    border-radius: var(--radius-pill);
    background: var(--celestial-badge-bg);
    border: 1px solid var(--celestial-badge-border);
    font-size: 11px;
    font-weight: 850;
    letter-spacing: 0.06em;
    color: var(--celestial-badge-text);
    width: fit-content;
  }

  .royal-content {
    display: grid;
    grid-template-columns: minmax(0, 1.3fr) minmax(320px, 0.7fr);
    gap: 32px;
    align-items: center;
  }

  @media (max-width: 860px) {
    .royal-content {
      grid-template-columns: 1fr;
    }
  }

  .royal-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: clamp(22px, 3vw, 30px);
    font-weight: 850;
    background: linear-gradient(135deg, #ffffff 0%, #ffd700 80%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  :global([data-theme="light"]) .royal-title {
    background: linear-gradient(135deg, #110d22 0%, #92400e 80%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .royal-sub {
    margin: 8px 0 16px;
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text-secondary);
  }

  .royal-sub strong {
    color: var(--celestial-gold-text);
  }

  :global([data-theme="light"]) .royal-sub strong {
    color: #92400e;
  }

  .vip-pathways-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 12px;
    margin-bottom: 18px;
  }

  .pathway-card {
    padding: 14px;
    border-radius: 14px;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid rgba(212, 175, 55, 0.25);
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  :global([data-theme="light"]) .pathway-card {
    background: rgba(180, 83, 9, 0.04);
    border-color: rgba(180, 83, 9, 0.2);
  }

  .pathway-card.highlight-ref {
    border-color: rgba(192, 132, 252, 0.35);
    background: rgba(192, 132, 252, 0.05);
  }

  .pathway-badge {
    font-size: 10px;
    font-weight: 800;
    letter-spacing: 0.06em;
    color: #ffd700;
  }

  .pathway-badge.free-badge {
    color: #c084fc;
  }

  :global([data-theme="light"]) .pathway-badge {
    color: #b45309;
  }

  :global([data-theme="light"]) .pathway-badge.free-badge {
    color: #7e22ce;
  }

  .pathway-title {
    font-size: 14px;
    font-weight: 750;
    color: var(--color-text-primary);
  }

  .pathway-desc {
    font-size: 12px;
    line-height: 1.45;
    color: var(--color-text-secondary);
    margin: 0;
  }

  .royal-perks-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .perk-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .royal-action-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 24px;
    border-radius: 18px;
    background: rgba(14, 10, 26, 0.85);
    border: 1px solid rgba(212, 175, 55, 0.3);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
  }

  :global([data-theme="light"]) .royal-action-card {
    background: #ffffff;
    border-color: rgba(180, 83, 9, 0.28);
    box-shadow: 0 8px 24px rgba(180, 83, 9, 0.08);
  }

  .action-card-header {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .action-card-header strong {
    display: block;
    font-size: 15px;
    font-weight: 800;
    color: var(--color-text-primary);
  }

  .action-card-header small {
    display: block;
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .action-buttons-group {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .btn-royal-deposit {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 44px;
    border-radius: var(--radius-pill);
    background: var(--celestial-gradient-gold);
    color: #100c22;
    font-size: 14px;
    font-weight: 850;
    text-decoration: none;
    box-shadow: 0 6px 18px var(--celestial-gold-glow);
    transition: all 0.2s ease;
  }

  .btn-royal-deposit:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 24px var(--celestial-gold-glow);
  }

  .btn-royal-checkin {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 42px;
    border-radius: var(--radius-pill);
    background: var(--celestial-badge-bg);
    border: 1px solid var(--celestial-badge-border);
    color: var(--celestial-gold-text);
    font-size: 13px;
    font-weight: 750;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .btn-royal-checkin:hover {
    background: var(--celestial-border-gold);
    border-color: var(--celestial-gold);
  }

  .secure-note {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-size: 11px;
    color: var(--color-text-muted);
  }

  /* ---------------------------------------------------------------------------
     TẦNG 4: WORKSPACE & UNIVERSE HUB
     --------------------------------------------------------------------------- */
  .workspace-section {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(360px, 1.1fr);
    gap: 28px;
    align-items: start;
  }

  @media (max-width: 980px) {
    .workspace-section {
      grid-template-columns: 1fr;
    }
  }

  .quickform-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 32px;
    border-radius: 24px;
    background: rgba(24, 18, 44, 0.75);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(212, 175, 55, 0.25);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  }

  :global([data-theme="light"]) .quickform-container {
    background: rgba(255, 255, 255, 0.85);
  }

  .quickform-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .quickform-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: 14px;
    background: rgba(212, 175, 55, 0.15);
    border: 1px solid rgba(212, 175, 55, 0.35);
    flex-shrink: 0;
  }

  .quickform-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 24px;
    font-weight: 850;
  }

  .quickform-sub {
    margin: 4px 0 0;
    font-size: 14px;
    color: var(--color-text-secondary);
  }

  .quickform-action-box {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 24px;
    border-radius: 16px;
    background: rgba(14, 10, 26, 0.6);
    border: 1px solid rgba(212, 175, 55, 0.18);
  }

  :global([data-theme="light"]) .quickform-action-box {
    background: rgba(245, 242, 237, 0.7);
  }

  .quickform-action-text {
    margin: 0;
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }

  /* UNIVERSE HUB (3 NHÓM PHỄU) */
  .universe-hub-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 32px;
    border-radius: 24px;
    background: rgba(24, 18, 44, 0.75);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(212, 175, 55, 0.25);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.35);
  }

  :global([data-theme="light"]) .universe-hub-container {
    background: rgba(255, 255, 255, 0.85);
  }

  .universe-hub-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .universe-hub-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 22px;
    font-weight: 850;
  }

  .universe-hub-sub {
    margin: 4px 0 0;
    font-size: 13px;
    color: var(--color-text-secondary);
  }

  .universe-groups-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .group-accordion-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px;
    border-radius: 16px;
    background: rgba(14, 10, 26, 0.55);
    border: 1px solid rgba(212, 175, 55, 0.16);
  }

  :global([data-theme="light"]) .group-accordion-card {
    background: rgba(250, 248, 244, 0.8);
    border-color: rgba(180, 83, 9, 0.18);
  }

  .group-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .group-header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .group-title {
    margin: 0;
    font-size: 15px;
    font-weight: 800;
  }

  .group-desc {
    display: block;
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .group-badge {
    font-size: 10px;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: var(--radius-pill);
    border: 1px solid;
    background: rgba(255, 255, 255, 0.04);
  }

  :global([data-theme="light"]) .group-badge {
    background: rgba(255, 255, 255, 0.9);
  }

  .group-items-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 8px;
  }

  .system-item-pill {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-radius: var(--radius-md);
    background: rgba(26, 20, 48, 0.6);
    border: 1px solid rgba(212, 175, 55, 0.15);
    text-decoration: none;
    color: var(--color-text-primary);
    transition: all 0.2s ease;
  }

  :global([data-theme="light"]) .system-item-pill {
    background: #ffffff;
    border-color: rgba(180, 83, 9, 0.18);
  }

  .system-item-pill:hover {
    background: rgba(212, 175, 55, 0.15);
    border-color: rgba(255, 215, 0, 0.45);
    transform: translateX(2px);
  }

  :global([data-theme="light"]) .system-item-pill:hover {
    background: rgba(254, 243, 199, 0.6);
    border-color: rgba(180, 83, 9, 0.45);
  }

  .item-text-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .item-label {
    font-size: 13px;
    font-weight: 750;
  }

  .item-desc {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .item-badge {
    font-size: 10px;
    font-weight: 750;
    padding: 2px 7px;
    border-radius: var(--radius-pill);
    background: var(--celestial-badge-bg);
    color: var(--celestial-badge-text);
    border: 1px solid var(--celestial-badge-border);
    white-space: nowrap;
    letter-spacing: 0.02em;
  }

  .item-badge.badge-free {
    background: rgba(16, 185, 129, 0.16);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.4);
    box-shadow: 0 0 8px rgba(16, 185, 129, 0.15);
  }

  :global([data-theme="light"]) .item-badge.badge-free {
    background: #ecfdf5;
    color: #047857;
    border-color: rgba(5, 150, 105, 0.4);
    font-weight: 800;
  }

  .item-badge.badge-xu {
    background: rgba(245, 158, 11, 0.16);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.4);
    box-shadow: 0 0 8px rgba(245, 158, 11, 0.15);
  }

  :global([data-theme="light"]) .item-badge.badge-xu {
    background: #fffbeb;
    color: #b45309;
    border-color: rgba(217, 119, 6, 0.4);
    font-weight: 800;
  }

  .sidebar-history-wrap {
    margin-top: 12px;
    padding-top: 16px;
    border-top: 1px solid rgba(212, 175, 55, 0.18);
  }

  /* ---------------------------------------------------------------------------
     TẦNG 5: PROMISE SECTION
     --------------------------------------------------------------------------- */
  .promise-section {
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .promise-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
  }

  .promise-glass-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 24px;
    border-radius: 20px;
    background: rgba(24, 18, 44, 0.72);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(212, 175, 55, 0.2);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
    transition: transform 0.2s ease;
  }

  :global([data-theme="light"]) .promise-glass-card {
    background: rgba(255, 255, 255, 0.9);
    border-color: rgba(180, 83, 9, 0.2);
    box-shadow: 0 8px 24px rgba(180, 83, 9, 0.08);
  }

  .promise-glass-card:hover {
    transform: translateY(-2px);
    border-color: rgba(255, 215, 0, 0.4);
  }

  :global([data-theme="light"]) .promise-glass-card:hover {
    border-color: rgba(180, 83, 9, 0.4);
  }

  .promise-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(212, 175, 55, 0.14);
    border: 1px solid rgba(212, 175, 55, 0.25);
  }

  :global([data-theme="light"]) .promise-icon-wrap {
    background: rgba(254, 243, 199, 0.7);
    border-color: rgba(180, 83, 9, 0.25);
  }

  .promise-card-title {
    margin: 0;
    font-size: 18px;
    font-weight: 800;
  }

  .promise-card-desc {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  /* ---------------------------------------------------------------------------
     FOOTER
     --------------------------------------------------------------------------- */
  .footer-celestial {
    padding-top: 24px;
    border-top: 1px solid rgba(212, 175, 55, 0.2);
  }

  .footer-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    font-size: 13px;
    color: var(--color-text-muted);
  }

  @media (min-width: 768px) {
    .footer-inner {
      flex-direction: row;
      justify-content: space-between;
    }
  }

  .footer-brand-summary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
  }

  .footer-links {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .footer-links a {
    color: var(--color-text-secondary);
    text-decoration: none;
    transition: color 0.15s ease;
  }

  .footer-links a:hover {
    color: var(--celestial-gold-text);
  }

  .sep {
    color: rgba(212, 175, 55, 0.3);
  }

  .text-celestial-gold { color: var(--celestial-gold-icon); }
  .text-celestial-purple { color: var(--celestial-purple-accent); }

  @media (max-width: 640px) {
    .shell {
      padding: var(--space-sm) var(--space-sm) 40px;
      gap: 36px;
    }

    .hero-title {
      font-size: clamp(26px, 6.5vw, 36px);
    }

    .hero-cta-group {
      width: 100%;
    }

    .btn-cta-gold-luxury,
    .btn-cta-secondary {
      width: 100%;
      justify-content: center;
      text-align: center;
    }

    .hero-trust-list {
      flex-direction: column;
      gap: 10px;
      align-items: flex-start;
      width: 100%;
    }

    .dial-features-bar {
      display: flex;
      flex-direction: column;
      width: 100%;
      gap: 8px;
    }

    .bento-grid {
      grid-template-columns: 1fr;
    }

    .royal-card {
      padding: 24px 18px;
    }

    .royal-action-card {
      padding: 18px 14px;
    }

    .btn-royal-deposit,
    .btn-royal-checkin {
      width: 100%;
      justify-content: center;
    }

    .quickform-container,
    .universe-hub-container {
      padding: 20px 16px;
    }

    .group-items-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 480px) {
    .topbar-celestial {
      padding: 8px 12px;
    }

    .user-email-tag {
      display: none;
    }

    .wallet-pill-luxury {
      padding: 6px 10px;
      font-size: 12px;
    }
  }

  @media (max-width: 374px) {
    .shell {
      padding: 8px 8px 36px;
      gap: 28px;
    }

    .topbar-celestial {
      padding: 6px 8px;
    }

    .vios-badge {
      display: none;
    }

    .wallet-text {
      display: none;
    }

    .wallet-pill-luxury {
      padding: 6px 8px;
      gap: 4px;
    }

    .btn-signin-luxury {
      padding: 6px 10px;
      font-size: 12px;
    }

    .hero-eyebrow-pill {
      font-size: 10px;
      padding: 3px 8px;
      letter-spacing: 0.03em;
      max-width: 100%;
      white-space: normal;
      text-align: center;
    }

    .hero-title {
      font-size: 24px;
    }

    .hero-description {
      font-size: 13.5px;
      line-height: 1.5;
    }

    .btn-cta-gold-luxury {
      font-size: 13px;
      padding: 0 12px;
      min-height: 46px;
    }

    .btn-cta-secondary {
      font-size: 13px;
      padding: 0 12px;
      min-height: 46px;
    }

    .celestial-astro-dial {
      width: 100%;
      max-width: 290px;
    }

    .orbit-hud-tag {
      font-size: 9.5px;
      padding: 2px 7px;
      gap: 4px;
    }

    .hud-dot {
      width: 5px;
      height: 5px;
    }

    .tag-menh { top: 4%; left: 4%; }
    .tag-quan { top: 6%; right: 2%; }
    .tag-tai { bottom: 4%; left: 4%; }
    .tag-di { bottom: 6%; right: 2%; }

    .zodiac-node {
      font-size: 10px;
    }

    .royal-card {
      padding: 16px 12px;
      gap: 14px;
    }

    .royal-title {
      font-size: 19px;
    }

    .royal-sub {
      font-size: 13px;
    }

    .perk-item {
      font-size: 12px;
      gap: 6px;
    }

    .royal-action-card {
      padding: 14px 10px;
      gap: 12px;
    }

    .bento-card-celestial {
      padding: 16px 14px;
    }

    .bento-title {
      font-size: 16px;
    }

    .bento-desc {
      font-size: 12.5px;
    }

    .quickform-container,
    .universe-hub-container {
      padding: 16px 12px;
    }

    .quickform-title,
    .universe-hub-title {
      font-size: 18px;
    }

    .group-card-header {
      padding: 12px 10px;
    }

    .group-title {
      font-size: 14px;
    }

    .group-desc {
      font-size: 11px;
    }

    .system-item-pill {
      padding: 10px 10px;
    }
  }
</style>

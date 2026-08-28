<script lang="ts">
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { fetchFeatures } from '$lib/api-client/system';
  import { PrimaryButton, ThemeToggle, ViOSLogo, MobileBottomNav } from '$lib/components/ui';
  import { viCopy } from '$lib/i18n/vi';
  import { createDashboardModel } from '$lib/features/dashboard/dashboard-model.svelte';
  import { sheetStore } from '$lib/stores/sheet.svelte';
  import BirthForm from '$lib/features/dashboard/BirthForm.svelte';
  import DashboardSidebar from '$lib/features/dashboard/DashboardSidebar.svelte';
  import WalletBalance from '$lib/features/payment/WalletBalance.svelte';
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
    Moon,
    Calendar,
    Settings,
    ArrowRight,
    CheckCircle2,
    Shield,
    Bot
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

  // 12 Hệ Thuật Số được phân nhóm theo 4 Đại Danh Mục (Universe Hub)
  const systemCategories = [
    {
      category: 'Mệnh Lý & Chiêm Tinh',
      icon: Compass,
      color: '#d4af37',
      items: [
        { route: '/charts' as const, label: 'Tử Vi Đẩu Số', badge: 'Chính Tông', desc: '12 Cung & Tinh Bàn Vận Hạn' },
        { route: '/bazi' as const, label: 'Bát Tự Hà Lạc', badge: 'Tứ Trụ', desc: 'Can Chi & Ngũ Hành Thịnh Suy' },
        { route: '/numerology' as const, label: 'Thần Số Học', badge: 'Pythagoras', desc: 'Con Số Chủ Đạo & Sứ Mệnh' },
        { route: '/hepan' as const, label: 'Hợp Hôn So Mệnh', badge: 'Duyên Phận', desc: 'Tương Hợp Vợ Chồng & Đối Tác' }
      ]
    },
    {
      category: 'Bói Dịch & Quẻ Linh',
      icon: CoinsIcon,
      color: '#c084fc',
      items: [
        { route: '/liuyao' as const, label: 'Kinh Dịch Lục Hào', badge: '3 Đồng Xu', desc: 'Dự Báo Vận Thời & Biến Dịch' },
        { route: '/meihua' as const, label: 'Mai Hoa Dịch Số', badge: 'Tâm Dịch', desc: 'Bấm Quẻ Theo Thời Khắc' },
        { route: '/qimen' as const, label: 'Kỳ Môn Độn Giáp', badge: 'Trận Đồ', desc: 'Bố Trận Thời Vị Thắng Cảnh' },
        { route: '/daliuren' as const, label: 'Đại Lục Nhâm', badge: 'Cổ Điển', desc: 'Thần Toán Tam Thức' }
      ]
    },
    {
      category: 'Trực Giác & Bài Học',
      icon: Layers,
      color: '#38bdf8',
      items: [
        { route: '/tarot' as const, label: 'Rút Bài Tarot AI', badge: '78 Lá', desc: 'Chiêm Nghiệm 1 Lá / 3 Lá' },
        { route: '/vision-tarot' as const, label: 'Đọc Trải Bài Ảnh', badge: 'AI Scan', desc: 'Chụp Trải Bài Thực Tế' },
        { route: '/lenormand' as const, label: 'Bài Lenormand', badge: '36 Lá', desc: 'Tiên Tri Sự Kiện Đời Thường' },
        { route: '/dream' as const, label: 'Giải Mộng Triêm Bốc', badge: 'Giấc Mơ', desc: 'Giải Mã Giấc Mơ Ẩn Ý' }
      ]
    },
    {
      category: 'Sinh Trắc AI & Dân Gian',
      icon: Eye,
      color: '#10b981',
      items: [
        { route: '/face' as const, label: 'Nhân Tướng Học AI', badge: 'Vision AI', desc: 'Quét Ngũ Quan & Khí Sắc' },
        { route: '/palm' as const, label: 'Xem Chỉ Tay AI', badge: 'Biometrics', desc: 'Nhận Diện 3 Đường Chính' },
        { route: '/stick' as const, label: 'Xin Xăm Quán Âm', badge: '100 Thẻ', desc: 'Cầu Linh Ứng & Hóa Giải' },
        { route: '/almanac' as const, label: 'Lịch Vạn Niên', badge: 'Hoàng Đạo', desc: 'Chọn Giờ Lành Xuất Hành' }
      ]
    }
  ];

  // AI Tools Bento Grid
  const bentoTools = [
    {
      route: '/face' as const,
      flag: 'face' as keyof FeaturesResponse,
      badge: 'AI VISION SCAN',
      badgeColor: 'gold',
      icon: Eye,
      title: viCopy.dashboard.toolFaceTitle,
      desc: viCopy.dashboard.toolFaceDescription,
      highlight: true
    },
    {
      route: '/palm' as const,
      flag: 'palm' as keyof FeaturesResponse,
      badge: 'BIOMETRIC SCAN',
      badgeColor: 'green',
      icon: Hand,
      title: viCopy.dashboard.toolPalmTitle,
      desc: viCopy.dashboard.toolPalmDescription,
      highlight: true
    },
    {
      route: '/tarot' as const,
      flag: 'tarot' as keyof FeaturesResponse,
      badge: '78 LÁ RIDER-WAITE',
      badgeColor: 'purple',
      icon: Layers,
      title: viCopy.dashboard.toolTarotTitle,
      desc: viCopy.dashboard.toolTarotDescription,
      highlight: false
    },
    {
      route: '/vision-tarot' as const,
      flag: 'tarot' as keyof FeaturesResponse,
      badge: 'PHOTO ORACLE',
      badgeColor: 'blue',
      icon: Camera,
      title: viCopy.dashboard.toolVisionTarotTitle,
      desc: viCopy.dashboard.toolVisionTarotDescription,
      highlight: false
    },
    {
      route: '/numerology' as const,
      flag: 'mbti' as keyof FeaturesResponse,
      badge: 'PYTHAGORAS MATRIX',
      badgeColor: 'gold',
      icon: Hash,
      title: 'Thần Số Học Toàn Diện',
      desc: 'Tính toán con số chủ đạo, kim tự tháp đỉnh cao cuộc đời và biểu đồ ngày sinh.',
      highlight: false
    },
    {
      route: '/liuyao' as const,
      flag: 'mangpai' as keyof FeaturesResponse,
      badge: '64 QUẺ KINH DỊCH',
      badgeColor: 'purple',
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
      description: 'Theo dõi đại vận, lưu niên, lưu nguyệt và lưu nhật cập nhật chuẩn xác từng giờ.'
    },
    {
      icon: Compass,
      title: 'Lá Số 12 Cung Bản Vị',
      description: 'An sao chuẩn xác theo ngày giờ sinh, hiển thị thế đứng tinh bàn và cung Vô Chính Diệu.'
    },
    {
      icon: Flame,
      title: 'Hợp Hôn So Mệnh',
      description: 'Đối sánh hai bản đồ mệnh lý để xem độ tương hợp tình duyên, gia đạo và kinh doanh.'
    },
    {
      icon: Bot,
      title: 'AI Luận Giải Tiếng Việt',
      description: 'Phân tích lá số bằng AI thông minh, bám sát các bộ sao chính tinh và cảnh báo rủi ro.'
    }
  ] as const;
</script>

<svelte:head>
  <title>Tử Vi Toàn Tập (ViOS) - Không Gian Thuật Số Toàn Diện Đẳng Cấp AI</title>
</svelte:head>

<main class="dashboard-page">
  <div class="shell">
    <!-- Top Navigation HUD Bar -->
    <header class="topbar-glass">
      <a class="brand-link" href={resolve('/')}>
        <ViOSLogo size="sm" showTagline={false} />
        <span class="version-tag">AI v2.5</span>
      </a>

      <nav class="top-links" aria-label="Điều hướng chính">
        <a href="#quick-create" class="nav-btn">Lập Lá Số</a>
        <a href="#ai-tools" class="nav-btn">AI Tools</a>
        <a href="#universe-hub" class="nav-btn">12 Hệ Thuật Số</a>
        {#if isMember}
          <a href={resolve('/history')} class="nav-btn">Lịch Sử</a>
        {/if}
      </nav>

      <div class="session-actions">
        <ThemeToggle />
        <a class="wallet-pill" href={resolve('/wallet')}>
          <CoinsIcon size={14} class="text-gold" />
          <span>Ví & Điểm Danh</span>
        </a>

        {#if !isMember}
          <a class="btn-signin" href={resolve('/sign-in')}>Đăng Nhập</a>
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

    <!-- HERO SECTION: Celestial Astro Wheel & Value Proposition -->
    <section class="hero-section" aria-labelledby="hero-heading">
      <div class="hero-content">
        <div class="hero-badge">
          <Sparkles size={14} class="text-gold" />
          <span>VIOS CELESTIAL INTELLIGENCE PLATFORM</span>
        </div>

        <h1 id="hero-heading" class="hero-title">
          {viCopy.dashboard.heroTitle}
        </h1>

        <p class="hero-description">
          {viCopy.dashboard.heroSubtitle}
        </p>

        <div class="hero-cta-group">
          <button class="btn-hero-primary" onclick={openBirthForm}>
            <Sparkles size={18} />
            <span>{viCopy.dashboard.createChart}</span>
          </button>
          <a class="btn-hero-secondary" href="#universe-hub">
            <span>Khám Phá 12 Thuật Số</span>
            <ArrowRight size={16} />
          </a>
        </div>

        <div class="hero-trust-list">
          <div class="trust-item">
            <CheckCircle2 size={15} class="text-gold" />
            <span>An Sao Chuẩn Thiên Văn</span>
          </div>
          <div class="trust-item">
            <Shield size={15} class="text-gold" />
            <span>Bảo Mật Riêng Tư 100%</span>
          </div>
          <div class="trust-item">
            <Bot size={15} class="text-purple" />
            <span>AI Đa Tầng Không Ảo Giác</span>
          </div>
        </div>
      </div>

      <!-- CELESTIAL ASTRO DIAL (Thiên Bàn 12 Cung & Bát Quái Xoay Phát Sáng) -->
      <div class="hero-dial-wrapper">
        <div class="celestial-astro-dial">
          <div class="dial-outer-ring"></div>
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
            <div class="taiji-symbol"></div>
          </div>

          <!-- Floating Orbit Highlights -->
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

        <!-- 3 Quick Features Mini Grid -->
        <div class="dial-features-bar">
          <div class="feat-pill">
            <strong>12 Cung Số</strong>
            <span>Thiên bàn cá nhân</span>
          </div>
          <div class="feat-pill">
            <strong>AI Luận Giải</strong>
            <span>Giải mã vận trình</span>
          </div>
          <div class="feat-pill">
            <strong>Lưu Hồ Sơ</strong>
            <span>Xem lại bất kỳ lúc nào</span>
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION 2: BENTO GRID AI MYSTICAL TOOLS -->
    <section class="bento-section" id="ai-tools">
      <div class="section-title-wrap">
        <div class="eyebrow-tag">
          <Eye size={14} class="text-gold" />
          <span>BỘ CÔNG CỤ SINH TRẮC & TRỰC GIÁC AI</span>
        </div>
        <h2 class="section-heading">{viCopy.dashboard.toolSectionTitle}</h2>
        <p class="section-subtext">{viCopy.dashboard.toolSectionDescription}</p>
      </div>

      <div class="bento-grid tool-grid">
        {#each visibleBentoTools as tool (tool.route)}
          <a href={resolve(tool.route as any)} class="bento-card {tool.highlight ? 'bento-highlight' : ''}">
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
              <span>Trải nghiệm ngay</span>
              <ArrowRight size={14} class="arrow-icon" />
            </div>
          </a>
        {/each}
      </div>
    </section>

    <!-- SECTION 3: INLINE QUICK-FORM & UNIVERSE HUB (12 HỆ THUẬT SỐ) -->
    <section class="workspace-section" id="quick-create">
      <!-- Cột Trái: Interactive Quick Form Card -->
      <div class="quickform-container" id="create-chart">
        <div class="quickform-header">
          <Compass size={22} class="text-gold" />
          <div>
            <h2 class="quickform-title">Khởi Tạo Lá Số Tử Vi</h2>
            <p class="quickform-sub">Nhập thông tin ngày giờ sinh để an sao và tạo bản đồ vận mệnh tức thì.</p>
          </div>
        </div>

        <div class="quickform-action-box">
          <p class="quickform-action-text">
            Hỗ trợ đầy đủ lịch Dương & Âm, tự động tính giờ Sóc, giờ Tý chuyển ngày và xác định chính xác múi giờ Việt Nam (GMT+7).
          </p>
          <PrimaryButton
            label="Nhập Thông Tin & Lập Lá Số Ngay"
            onclick={openBirthForm}
          />
        </div>
      </div>

      <!-- Cột Phải: UNIVERSE HUB 12 HỆ THUẬT SỐ -->
      <div class="universe-hub-container" id="universe-hub">
        <div class="universe-hub-header">
          <BookOpen size={20} class="text-purple" />
          <h2 class="universe-hub-title">Ma Trận 12 Bộ Môn Thuật Số</h2>
        </div>

        <div class="universe-categories-grid">
          {#each systemCategories as cat (cat.category)}
            <div class="category-block">
              <div class="category-header">
                <cat.icon size={16} style="color: {cat.color};" />
                <span class="category-name">{cat.category}</span>
              </div>
              <div class="category-links">
                {#each cat.items as item (item.route)}
                  <a href={resolve(item.route as any)} class="system-item-pill">
                    <div class="item-text-group">
                      <span class="item-label">{item.label}</span>
                      <small class="item-desc">{item.desc}</small>
                    </div>
                    <span class="item-badge">{item.badge}</span>
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

    <!-- SECTION 4: 4 LỚP LUẬN GIẢI CHUYÊN SÂU -->
    <section class="promise-section">
      <div class="section-title-wrap text-center">
        <div class="eyebrow-tag center">
          <Layers size={14} class="text-gold" />
          <span>PHƯƠNG PHÁP LUẬN ĐA TẦNG</span>
        </div>
        <h2 class="section-heading">Bốn Trọng Tâm Phân Tích Mệnh Lý</h2>
      </div>

      <div class="promise-cards-grid">
        {#each promiseCards as card (card.title)}
          <div class="promise-glass-card">
            <div class="promise-icon-wrap">
              <card.icon size={24} class="text-gold" />
            </div>
            <h3 class="promise-card-title">{card.title}</h3>
            <p class="promise-card-desc">{card.description}</p>
          </div>
        {/each}
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer-glass">
      <div class="footer-inner">
        <div class="footer-links">
          <a href={resolve('/terms')}>Điều Khoản Dịch Vụ</a>
          <span class="sep">•</span>
          <a href={resolve('/privacy')}>Chính Sách Bảo Mật</a>
          <span class="sep">•</span>
          <a href={resolve('/wallet')}>Quy Chế Ví XU</a>
        </div>
        <div class="footer-copy">
          &copy; {new Date().getFullYear()} Tử Vi Toàn Tập (ViOS). All rights reserved.
        </div>
      </div>
    </footer>
  </div>

  <MobileBottomNav />
</main>

<style>
  .dashboard-page {
    min-height: 100dvh;
    background:
      radial-gradient(ellipse 70% 45% at 12% 0%, rgba(212, 175, 55, 0.08), transparent 58%),
      radial-gradient(ellipse 55% 40% at 88% 8%, rgba(192, 132, 252, 0.1), transparent 52%),
      linear-gradient(180deg, #120f20 0%, #090810 100%);
    color: var(--color-text-primary);
    overflow-x: hidden;
  }

  :global([data-theme="light"]) .dashboard-page {
    background:
      radial-gradient(ellipse 70% 45% at 12% 0%, rgba(212, 175, 55, 0.06), transparent 58%),
      radial-gradient(ellipse 55% 40% at 88% 8%, rgba(192, 132, 252, 0.05), transparent 52%),
      linear-gradient(180deg, #faf9f6 0%, #f3f0e8 100%);
  }

  .shell {
    box-sizing: border-box;
    width: min(100%, 1240px);
    margin: 0 auto;
    padding: var(--space-md) var(--space-lg) 80px;
    display: flex;
    flex-direction: column;
    gap: 48px;
  }

  /* TOP NAVIGATION HUD */
  .topbar-glass {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px var(--space-lg);
    background: var(--glass-bg);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid var(--overlay-border);
    border-radius: var(--radius-pill);
    box-shadow: var(--shadow-card);
  }

  .brand-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    text-decoration: none;
  }

  .version-tag {
    font-size: 11px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: var(--radius-pill);
    background: rgba(212, 175, 55, 0.15);
    color: #d4af37;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .top-links {
    display: none;
    align-items: center;
    gap: 6px;
  }

  @media (min-width: 768px) {
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
    background: var(--overlay-ink-wash);
    color: var(--color-text-primary);
  }

  .session-actions {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .wallet-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 14px;
    border-radius: var(--radius-pill);
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid rgba(212, 175, 55, 0.25);
    color: #d4af37;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    transition: transform 0.15s ease;
  }

  .wallet-pill:hover {
    transform: translateY(-1px);
  }

  .btn-signin {
    padding: 6px 16px;
    border-radius: var(--radius-pill);
    background: var(--color-accent-primary);
    color: var(--color-text-on-primary);
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
  }

  .user-email-tag {
    max-width: 140px;
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
    color: var(--color-text-primary);
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

  /* HERO SECTION */
  .hero-section {
    display: grid;
    grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
    gap: clamp(32px, 5vw, 64px);
    align-items: center;
    padding: 20px 0;
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

  .hero-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: var(--radius-pill);
    background: rgba(212, 175, 55, 0.12);
    border: 1px solid rgba(212, 175, 55, 0.25);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.05em;
    color: #d4af37;
  }

  .hero-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: clamp(34px, 4.5vw, 54px);
    font-weight: 800;
    line-height: 1.12;
    letter-spacing: -0.01em;
  }

  .gradient-gold {
    background: linear-gradient(135deg, #fce99f 0%, #d4af37 60%, #b8860b 100%);
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .hero-description {
    margin: 0;
    max-width: 580px;
    font-size: 16px;
    line-height: 1.6;
    color: var(--color-text-secondary);
  }

  .hero-cta-group {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 14px;
    margin-top: 6px;
  }

  .btn-hero-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 0 24px;
    border-radius: var(--radius-pill);
    background: linear-gradient(135deg, #fce99f 0%, #d4af37 100%);
    color: #0f0c1b;
    border: 1px solid rgba(255, 255, 255, 0.3);
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 8px 24px rgba(212, 175, 55, 0.35);
    transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .btn-hero-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px rgba(212, 175, 55, 0.5);
  }

  .btn-hero-secondary {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 48px;
    padding: 0 20px;
    border-radius: var(--radius-pill);
    background: var(--glass-bg);
    border: 1px solid var(--overlay-border);
    color: var(--color-text-primary);
    font-size: 14px;
    font-weight: 700;
    text-decoration: none;
    transition: all 0.2s ease;
  }

  .btn-hero-secondary:hover {
    background: var(--overlay-ink-wash);
    border-color: var(--overlay-border-strong);
    transform: translateY(-1px);
  }

  .hero-trust-list {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    margin-top: 8px;
    padding-top: 18px;
    border-top: 1px solid var(--overlay-border);
  }

  .trust-item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }

  /* CELESTIAL ASTRO DIAL */
  .hero-dial-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .celestial-astro-dial {
    position: relative;
    width: min(100%, 380px);
    aspect-ratio: 1;
    display: grid;
    place-items: center;
    border-radius: 50%;
    background:
      radial-gradient(circle at center, rgba(212, 175, 55, 0.15) 0%, rgba(192, 132, 252, 0.08) 45%, transparent 70%);
    box-shadow: 0 0 50px rgba(212, 175, 55, 0.12);
  }

  .dial-outer-ring {
    position: absolute;
    inset: 0;
    border: 2px dashed rgba(212, 175, 55, 0.35);
    border-radius: 50%;
    animation: rotateAstro 80s linear infinite;
  }

  .dial-zodiac-ring {
    position: absolute;
    inset: 12%;
    border: 1px solid rgba(192, 132, 252, 0.3);
    border-radius: 50%;
    animation: rotateAstroReverse 60s linear infinite;
  }

  .zodiac-node {
    position: absolute;
    font-size: 11px;
    font-weight: 800;
    color: #d4af37;
    text-shadow: 0 0 8px rgba(212, 175, 55, 0.6);
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
    background: radial-gradient(circle, #251d38 0%, #0d0a17 100%);
    border: 2px solid rgba(212, 175, 55, 0.5);
    box-shadow: inset 0 0 20px rgba(212, 175, 55, 0.4), 0 0 30px rgba(192, 132, 252, 0.3);
  }

  .taiji-symbol {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: linear-gradient(180deg, #fce99f 50%, #120f20 50%);
    border: 1px solid rgba(212, 175, 55, 0.6);
    box-shadow: 0 0 16px rgba(212, 175, 55, 0.5);
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
    background: var(--glass-bg-strong);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    border: 1px solid var(--overlay-border-strong);
    box-shadow: var(--shadow-card);
    font-size: 11px;
  }

  .hud-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #d4af37;
    box-shadow: 0 0 6px #d4af37;
  }

  .tag-menh { top: 6%; left: 8%; color: #d4af37; }
  .tag-quan { top: 10%; right: 4%; color: #c084fc; }
  .tag-tai { bottom: 8%; left: 10%; color: #38bdf8; }
  .tag-di { bottom: 12%; right: 6%; color: #10b981; }

  .dial-features-bar {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    width: min(100%, 380px);
  }

  .feat-pill {
    display: flex;
    flex-direction: column;
    padding: 8px 12px;
    border-radius: var(--radius-md);
    background: var(--glass-bg);
    border: 1px solid var(--overlay-border);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  .feat-pill strong {
    font-size: 12px;
    color: var(--color-text-primary);
  }

  .feat-pill span {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  /* SECTION 2: BENTO GRID AI TOOLS */
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
    font-weight: 800;
    letter-spacing: 0.06em;
    color: #d4af37;
    text-transform: uppercase;
  }

  .section-heading {
    margin: 0;
    font-family: var(--font-serif);
    font-size: clamp(26px, 3.5vw, 36px);
    font-weight: 800;
    color: var(--color-text-primary);
  }

  .section-subtext {
    margin: 0;
    max-width: 600px;
    font-size: 15px;
    color: var(--color-text-secondary);
  }

  .bento-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }

  .bento-card {
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 200px;
    padding: 24px;
    border-radius: 20px;
    background: var(--glass-bg);
    backdrop-filter: blur(18px) saturate(170%);
    -webkit-backdrop-filter: blur(18px) saturate(170%);
    border: 1px solid var(--overlay-border);
    box-shadow: var(--shadow-card);
    text-decoration: none;
    color: var(--color-text-primary);
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  }

  .bento-card:hover {
    transform: translateY(-4px);
    border-color: rgba(212, 175, 55, 0.4);
    box-shadow: 0 16px 36px -8px rgba(0, 0, 0, 0.4), 0 0 20px rgba(212, 175, 55, 0.15);
  }

  .bento-highlight {
    border-color: rgba(212, 175, 55, 0.25);
    background: radial-gradient(circle at 100% 0%, rgba(212, 175, 55, 0.08), transparent 50%), var(--glass-bg);
  }

  .bento-card-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .bento-badge {
    font-size: 10px;
    font-weight: 800;
    padding: 3px 8px;
    border-radius: var(--radius-pill);
    letter-spacing: 0.05em;
  }

  .badge-gold {
    background: rgba(212, 175, 55, 0.15);
    color: #d4af37;
    border: 1px solid rgba(212, 175, 55, 0.3);
  }

  .badge-purple {
    background: rgba(192, 132, 252, 0.15);
    color: #c084fc;
    border: 1px solid rgba(192, 132, 252, 0.3);
  }

  .badge-green {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .badge-blue {
    background: rgba(56, 189, 248, 0.15);
    color: #38bdf8;
    border: 1px solid rgba(56, 189, 248, 0.3);
  }

  .bento-icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: var(--overlay-ink-wash);
    color: #d4af37;
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
    font-weight: 800;
  }

  .bento-desc {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  .bento-card-footer {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 700;
    color: #d4af37;
  }

  .arrow-icon {
    transition: transform 0.2s ease;
  }

  .bento-card:hover .arrow-icon {
    transform: translateX(4px);
  }

  /* SECTION 3: WORKSPACE & UNIVERSE HUB */
  .workspace-section {
    display: grid;
    grid-template-columns: minmax(0, 0.95fr) minmax(360px, 1.05fr);
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
    background: var(--glass-bg);
    backdrop-filter: blur(18px) saturate(170%);
    -webkit-backdrop-filter: blur(18px) saturate(170%);
    border: 1px solid var(--overlay-border);
    box-shadow: var(--shadow-card);
  }

  .quickform-header {
    display: flex;
    align-items: flex-start;
    gap: 12px;
  }

  .quickform-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 24px;
    font-weight: 800;
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
    background: var(--overlay-ink-wash);
    border: 1px solid var(--overlay-border);
  }

  .quickform-action-text {
    margin: 0;
    font-size: 14px;
    color: var(--color-text-secondary);
    line-height: 1.6;
  }

  /* UNIVERSE HUB */
  .universe-hub-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 32px;
    border-radius: 24px;
    background: var(--glass-bg);
    backdrop-filter: blur(18px) saturate(170%);
    -webkit-backdrop-filter: blur(18px) saturate(170%);
    border: 1px solid var(--overlay-border);
    box-shadow: var(--shadow-card);
  }

  .universe-hub-header {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .universe-hub-title {
    margin: 0;
    font-family: var(--font-serif);
    font-size: 22px;
    font-weight: 800;
  }

  .universe-categories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 16px;
  }

  .category-block {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .category-header {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
  }

  .category-links {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .system-item-pill {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    border-radius: var(--radius-md);
    background: var(--glass-bg);
    border: 1px solid var(--overlay-border);
    text-decoration: none;
    color: var(--color-text-primary);
    transition: all 0.2s ease;
  }

  .system-item-pill:hover {
    background: var(--overlay-ink-wash);
    border-color: rgba(212, 175, 55, 0.4);
    transform: translateX(2px);
  }

  .item-text-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .item-label {
    font-size: 13px;
    font-weight: 700;
  }

  .item-desc {
    font-size: 11px;
    color: var(--color-text-muted);
  }

  .item-badge {
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: var(--radius-pill);
    background: var(--overlay-ink-wash);
    color: var(--color-text-secondary);
  }

  .sidebar-history-wrap {
    margin-top: 12px;
    padding-top: 16px;
    border-top: 1px solid var(--overlay-border);
  }

  /* SECTION 4: PROMISES */
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
    background: var(--glass-bg);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid var(--overlay-border);
    box-shadow: var(--shadow-card);
    transition: transform 0.2s ease;
  }

  .promise-glass-card:hover {
    transform: translateY(-2px);
    border-color: var(--overlay-border-strong);
  }

  .promise-icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    background: rgba(212, 175, 55, 0.12);
  }

  .promise-card-title {
    margin: 0;
    font-size: 18px;
    font-weight: 750;
  }

  .promise-card-desc {
    margin: 0;
    font-size: 13px;
    color: var(--color-text-secondary);
    line-height: 1.5;
  }

  /* FOOTER */
  .footer-glass {
    padding-top: 24px;
    border-top: 1px solid var(--overlay-border);
  }

  .footer-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: var(--color-text-muted);
  }

  @media (min-width: 640px) {
    .footer-inner {
      flex-direction: row;
      justify-content: space-between;
    }
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
    color: #d4af37;
  }

  .sep {
    color: var(--overlay-border-strong);
  }

  .text-gold { color: #d4af37; }
  .text-purple { color: #c084fc; }

  @media (max-width: 640px) {
    .shell {
      padding: var(--space-sm) var(--space-sm) 100px;
      gap: 36px;
    }

    .hero-title {
      font-size: 32px;
    }

    .bento-grid {
      grid-template-columns: 1fr;
    }

    .quickform-container,
    .universe-hub-container {
      padding: 20px;
    }
  }
</style>

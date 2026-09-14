<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { AppScaffold } from '$lib/components/ui';
  import { getAuthStore } from '$lib/auth/auth-context';
  import { getWalletStore } from '$lib/features/payment/wallet-context';
  import {
    XU_PACKAGES,
    FEATURE_COSTS,
    formatVnd,
    type XuPackage
  } from '$lib/features/payment/pricing-config';
  import {
    Coins,
    Sparkles,
    Zap,
    CheckCircle2,
    Gift,
    CreditCard,
    ArrowRight,
    ShieldCheck,
    Clock,
    Users,
    Flame,
    Lock,
    Building2,
    FileText,
    Crown
  } from 'lucide-svelte';

  const auth = getAuthStore();
  const wallet = getWalletStore();

  const costIconMap: Record<string, any> = {
    deep_explanation: Sparkles,
    face_palm_vision: Zap,
    iching_divination: CreditCard,
    tarot_lenormand: Gift,
    chart_creation: CheckCircle2,
    annual_report: Sparkles
  };

  function handleSelectPackage(pkg: XuPackage) {
    goto(resolve('/wallet') + '?package=' + pkg.xu);
  }

  function handleGoToWallet() {
    goto(resolve('/wallet'));
  }
</script>

<AppScaffold
  eyebrow="BẢNG GIÁ MINH BẠCH"
  title="Bảng Giá Dịch Vụ & Gói Nạp XU"
  subtitle="Nạp XU một lần, tự do khai mở mọi thuật số: Tử Vi, Tứ Trụ, Kinh Dịch, Nhân Tướng và Tarot mà không phát sinh phụ phí ẩn."
>
  <div class="pricing-container">
    <!-- Mini Wallet Status Bar -->
    <section class="wallet-status-bar pricing-card">
      <div class="status-left">
        <div class="wallet-icon-ring">
          <Coins size={22} class="gold-icon" />
        </div>
        <div class="status-info">
          <div class="status-label">
            <span>Ví XU hiện tại</span>
            {#if auth.isAnonymous}
              <span class="user-tier-tag anon"><Lock size={12} /> Tài khoản vãng lai</span>
            {:else}
              <span class="user-tier-tag member"><ShieldCheck size={12} /> Thành viên Email</span>
            {/if}
          </div>
          <div class="status-balance">
            {#if wallet.isLoading}
              <span class="balance-num">Đang tải...</span>
            {:else}
              <span class="balance-num">{wallet.balance}</span>
              <span class="balance-unit">XU</span>
            {/if}
          </div>
        </div>
      </div>
      <div class="status-right">
        <button type="button" class="wallet-link-btn" onclick={handleGoToWallet}>
          <span>Đến Ví XU & Điểm danh</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </section>

    <!-- Royal Packages Section -->
    <section class="packages-section">
      <div class="section-heading">
        <div class="heading-badge">GÓI NẠP TỰ ĐỘNG</div>
        <h2>Các Gói Nạp XU Hoàng Gia</h2>
        <p>Nạp tự động qua VietQR liên ngân hàng MBBank/SePay, cộng XU ngay lập tức sau 3-5 giây.</p>
      </div>

      <div class="packages-grid">
        {#each XU_PACKAGES as pkg (pkg.xu)}
          <div
            class="package-card pricing-card"
            class:popular={pkg.popular}
            class:seasonal={pkg.seasonal}
            class:b2b={pkg.b2b}
          >
            {#if pkg.badge}
              <div
                class="pkg-top-badge"
                class:popular-badge={pkg.popular}
                class:seasonal-badge={pkg.seasonal}
                class:b2b-badge={pkg.b2b}
              >
                {#if pkg.seasonal}
                  <Sparkles size={13} class="text-white" />
                {:else if pkg.b2b}
                  <Crown size={13} class="text-white" />
                {:else if pkg.popular}
                  <Flame size={13} />
                {/if}
                <span>{pkg.badge}</span>
              </div>
            {/if}

            <div class="pkg-header">
              <h3 class="pkg-title">{pkg.label}</h3>
              <div class="pkg-xu">
                <span class="xu-val">{pkg.xu}</span>
                <span class="xu-label">XU</span>
              </div>
              <div class="pkg-price">
                <span class="price-val">{formatVnd(pkg.price)}</span>
                <span class="price-curr">VNĐ</span>
              </div>
              <div class="pkg-unit-price">
                <span>{pkg.unitPrice}</span>
              </div>
            </div>

            <div class="pkg-divider"></div>

            <div class="pkg-benefits">
              <div class="pkg-equivalence-tag">
                <Sparkles size={12} class="text-gold" />
                <span>{pkg.valueEquivalence}</span>
              </div>
              <p class="pkg-desc">{pkg.desc}</p>
              {#if pkg.bonusXu}
                <div class="bonus-tag">
                  <Gift size={14} class="bonus-icon" />
                  <span>Đã bao gồm <strong>+{pkg.bonusXu} XU</strong> thưởng</span>
                </div>
              {/if}
            </div>

            <div class="pkg-action">
              <button
                type="button"
                class="cta-btn"
                class:primary-cta={pkg.popular}
                onclick={() => handleSelectPackage(pkg)}
              >
                <span>Nạp Gói Này</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- Gói B2B Bất Động Sản, Xây Dựng & Doanh Nghiệp -->
    <section class="b2b-pricing-banner pricing-card">
      <div class="b2b-banner-inner">
        <div class="b2b-banner-badge">
          <Building2 size={15} class="text-indigo-400" />
          <span>GIẢI PHÁP ĐẶC QUYỀN DOANH NGHIỆP & BĐS</span>
        </div>
        <div class="b2b-banner-content">
          <div class="b2b-banner-text">
            <h3>Gói Chuyên Viên Bất Động Sản, Xây Dựng & Doanh Nghiệp (1.000 XU)</h3>
            <p>
              Tối ưu cho nhu cầu tư vấn phong thủy động thổ, khai móng, chọn ngày nhập trạch và xuất 20 cuốn <strong>Hồ Sơ Mệnh Lý Hoàng Gia 19 Trang PDF</strong> in ấn A4 làm quà tặng cao cấp trao tay khách hàng khi bàn giao nhà đất, chốt hợp đồng tiền tỷ.
            </p>
            <div class="b2b-perks-pills">
              <span class="b2b-pill"><CheckCircle2 size={14} class="text-emerald-400" /> Tiết kiệm 50% (Chỉ 790đ/XU)</span>
              <span class="b2b-pill"><CheckCircle2 size={14} class="text-emerald-400" /> Xuất 20 Hồ Sơ Hoàng Gia PDF</span>
              <span class="b2b-pill"><CheckCircle2 size={14} class="text-emerald-400" /> Không giới hạn thời hạn XU</span>
            </div>
          </div>
          <div class="b2b-banner-action">
            <div class="b2b-price-box">
              <span class="b2b-price-val">790.000</span>
              <span class="b2b-price-curr">VNĐ</span>
            </div>
            <button
              type="button"
              class="b2b-buy-btn"
              onclick={() => goto(resolve('/wallet') + '?package=1000')}
            >
              <Crown size={16} />
              <span>Nạp Ngay 1.000 XU</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Feature Cost Matrix Section -->
    <section class="matrix-section pricing-card">
      <div class="section-heading">
        <div class="heading-badge">MINH BẠCH CHI PHÍ</div>
        <h2>Bảng Phí Khai Mở Các Hệ Thuật Số</h2>
        <p>Chi phí sử dụng được tính theo từng lượt tạo hoặc phân tích, không có phí duy trì định kỳ.</p>
      </div>

      <div class="matrix-grid">
        {#each FEATURE_COSTS as item (item.id)}
          {@const Icon = costIconMap[item.id] || Sparkles}
          <div class="matrix-item">
            <div class="item-icon-box" class:is-free={item.xuCost === 0}>
              <Icon size={20} />
            </div>
            <div class="item-content">
              <div class="item-top">
                <h4 class="item-title">{item.name}</h4>
                <div class="item-cost-badge" class:free-badge={item.xuCost === 0}>
                  {item.cost}
                </div>
              </div>
              <p class="item-desc">{item.desc}</p>
              <div class="item-tag-row">
                <span class="item-sub-tag">{item.tag}</span>
              </div>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- Royal Perks & Transparency -->
    <section class="perks-section">
      <div class="perk-card pricing-card">
        <div class="perk-icon-ring">
          <Zap size={22} class="gold-icon" />
        </div>
        <div class="perk-info">
          <h4>Nạp Tự Động 24/7</h4>
          <p>Tích hợp SePay VietQR ngân hàng quân đội MBBank, đối soát và cộng XU tức thì sau vài giây.</p>
        </div>
      </div>

      <div class="perk-card pricing-card">
        <div class="perk-icon-ring">
          <Gift size={22} class="gold-icon" />
        </div>
        <div class="perk-info">
          <h4>Điểm Danh Nhận XU</h4>
          <p>Mỗi ngày vào Ví XU điểm danh nhận ngay +1 XU miễn phí (thưởng Jackpot +3 XU ngày 7) để trải nghiệm các tính năng AI.</p>
        </div>
      </div>

      <div class="perk-card pricing-card">
        <div class="perk-icon-ring">
          <Clock size={22} class="gold-icon" />
        </div>
        <div class="perk-info">
          <h4>Bảo Lưu Vĩnh Viễn</h4>
          <p>XU đã nạp không có hạn sử dụng. Bạn có thể sử dụng bất cứ lúc nào cho bất kỳ thuật số nào.</p>
        </div>
      </div>

      <div class="perk-card pricing-card">
        <div class="perk-icon-ring">
          <Users size={22} class="gold-icon" />
        </div>
        <div class="perk-info">
          <h4>Thưởng Giới Thiệu</h4>
          <p>Mời bạn bè cùng trải nghiệm để nhận ngay +50 XU thưởng mỗi khi có người đăng ký qua link của bạn.</p>
        </div>
      </div>
    </section>

    <!-- Bottom Action Card -->
    <section class="action-card">
      <div class="action-content">
        <h3>Sẵn Sàng Khai Mở Vận Mệnh?</h3>
        <p>Vào Ví XU ngay để quét mã nạp tiền tự động hoặc nhận điểm danh miễn phí hôm nay.</p>
      </div>
      <div class="action-buttons">
        <button type="button" class="btn-primary" onclick={handleGoToWallet}>
          <Coins size={18} />
          <span>Vào Ví & Nạp XU</span>
        </button>
      </div>
    </section>
  </div>
</AppScaffold>

<style>
  .pricing-container {
    display: flex;
    flex-direction: column;
    gap: 32px;
    max-width: 1100px;
    margin: 0 auto;
    padding-bottom: 64px;
  }

  /* Universal Pricing Card supporting Light & Dark Themes seamlessly */
  .pricing-card {
    background: var(--color-bg-surface, #ffffff);
    border: 1px solid var(--color-border-hairline, #e2e8f0);
    border-radius: var(--radius-xl, 20px);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
    transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  }

  :global([data-theme="dark"]) .pricing-card {
    background: rgba(22, 24, 34, 0.75);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border-color: rgba(255, 255, 255, 0.12);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35);
  }

  /* Status Bar */
  .wallet-status-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 24px;
    flex-wrap: wrap;
    gap: 16px;
    border-color: rgba(217, 119, 6, 0.25);
  }

  :global([data-theme="dark"]) .wallet-status-bar {
    border-color: rgba(245, 158, 11, 0.3);
  }

  .status-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .wallet-icon-ring {
    width: 46px;
    height: 46px;
    border-radius: 50%;
    background: rgba(245, 158, 11, 0.12);
    border: 1px solid rgba(245, 158, 11, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  :global(.gold-icon) {
    color: #d97706;
  }
  :global([data-theme="dark"]) :global(.gold-icon) {
    color: #f59e0b;
  }

  .status-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .status-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-secondary, #475569);
  }

  .user-tier-tag {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    padding: 2px 8px;
    border-radius: var(--radius-pill, 9999px);
    font-weight: 600;
  }

  .user-tier-tag.anon {
    background: rgba(148, 163, 184, 0.15);
    color: #475569;
    border: 1px solid rgba(148, 163, 184, 0.3);
  }
  :global([data-theme="dark"]) .user-tier-tag.anon {
    color: #cbd5e1;
  }

  .user-tier-tag.member {
    background: rgba(16, 185, 129, 0.15);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }
  :global([data-theme="dark"]) .user-tier-tag.member {
    color: #34d399;
  }

  .status-balance {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .balance-num {
    font-size: 26px;
    font-weight: 900;
    color: #d97706;
  }
  :global([data-theme="dark"]) .balance-num {
    color: #fbbf24;
  }

  .balance-unit {
    font-size: 13px;
    font-weight: 700;
    color: #b45309;
  }
  :global([data-theme="dark"]) .balance-unit {
    color: #f59e0b;
  }

  .wallet-link-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 9px 18px;
    border-radius: var(--radius-pill, 9999px);
    background: #fffbeb;
    border: 1px solid #fde68a;
    color: #b45309;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .wallet-link-btn:hover {
    background: #fef3c7;
    transform: translateX(2px);
  }

  :global([data-theme="dark"]) .wallet-link-btn {
    background: rgba(245, 158, 11, 0.15);
    border-color: rgba(245, 158, 11, 0.4);
    color: #fbbf24;
  }
  :global([data-theme="dark"]) .wallet-link-btn:hover {
    background: rgba(245, 158, 11, 0.25);
  }

  /* Section Headings */
  .section-heading {
    text-align: center;
    margin-bottom: 24px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .heading-badge {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #b45309;
    background: rgba(217, 119, 6, 0.1);
    border: 1px solid rgba(217, 119, 6, 0.25);
    padding: 3px 12px;
    border-radius: var(--radius-pill, 9999px);
  }

  :global([data-theme="dark"]) .heading-badge {
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.15);
    border-color: rgba(245, 158, 11, 0.35);
  }

  .section-heading h2 {
    font-family: var(--font-serif);
    font-size: clamp(24px, 3vw, 32px);
    font-weight: 800;
    color: var(--color-text-primary, #111111);
    margin: 0;
  }

  .section-heading p {
    font-size: 15px;
    color: var(--color-text-secondary, #475569);
    max-width: 600px;
    margin: 0;
    line-height: 1.5;
  }

  /* Packages Grid */
  .packages-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 18px;
  }

  @media (min-width: 640px) {
    .packages-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .packages-grid {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .package-card {
    position: relative;
    display: flex;
    flex-direction: column;
    padding: 28px 20px 20px;
    border-radius: var(--radius-xl, 20px);
  }

  .package-card:hover {
    transform: translateY(-4px);
    border-color: #f59e0b;
    box-shadow: 0 12px 28px rgba(217, 119, 6, 0.12);
  }

  .package-card.popular {
    border: 2px solid #f59e0b;
    background: linear-gradient(180deg, #fffcf0 0%, #ffffff 100%);
    box-shadow: 0 8px 30px rgba(245, 158, 11, 0.15);
  }

  :global([data-theme="dark"]) .package-card.popular {
    border-color: rgba(245, 158, 11, 0.7);
    background: linear-gradient(180deg, rgba(40, 32, 60, 0.85) 0%, rgba(20, 16, 36, 0.95) 100%);
    box-shadow: 0 0 28px rgba(245, 158, 11, 0.2);
  }

  .package-card.seasonal {
    border: 2px solid #ef4444;
    background: linear-gradient(180deg, #fff5f5 0%, #ffffff 100%);
    box-shadow: 0 8px 30px rgba(239, 68, 68, 0.15);
  }

  :global([data-theme="dark"]) .package-card.seasonal {
    border-color: rgba(239, 68, 68, 0.8);
    background: linear-gradient(180deg, rgba(60, 20, 25, 0.85) 0%, rgba(26, 12, 16, 0.95) 100%);
    box-shadow: 0 0 28px rgba(239, 68, 68, 0.25);
  }

  .package-card.b2b {
    border: 2px solid #6366f1;
    background: linear-gradient(180deg, #f5f7ff 0%, #ffffff 100%);
    box-shadow: 0 8px 30px rgba(99, 102, 241, 0.15);
  }

  :global([data-theme="dark"]) .package-card.b2b {
    border-color: rgba(99, 102, 241, 0.8);
    background: linear-gradient(180deg, rgba(30, 27, 75, 0.85) 0%, rgba(15, 13, 45, 0.95) 100%);
    box-shadow: 0 0 28px rgba(99, 102, 241, 0.25);
  }

  .pkg-top-badge {
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 12px;
    border-radius: var(--radius-pill, 9999px);
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.05em;
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    color: #475569;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .pkg-top-badge.popular-badge {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: #ffffff;
    border: none;
    font-weight: 850;
    box-shadow: 0 2px 12px rgba(217, 119, 6, 0.35);
  }

  .pkg-top-badge.seasonal-badge {
    background: linear-gradient(135deg, #ef4444 0%, #b91c1c 100%);
    color: #ffffff;
    border: 1px solid #fecaca;
    font-weight: 850;
    box-shadow: 0 2px 12px rgba(239, 68, 68, 0.4);
  }

  .pkg-top-badge.b2b-badge {
    background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%);
    color: #ffffff;
    border: 1px solid #c7d2fe;
    font-weight: 850;
    box-shadow: 0 2px 12px rgba(99, 102, 241, 0.4);
  }

  :global([data-theme="dark"]) .pkg-top-badge:not(.popular-badge):not(.seasonal-badge):not(.b2b-badge) {
    background: rgba(30, 41, 59, 0.95);
    border-color: rgba(245, 158, 11, 0.4);
    color: #fbbf24;
  }

  .pkg-header {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .pkg-title {
    font-size: 16px;
    font-weight: 750;
    color: var(--color-text-primary, #111111);
    margin: 0;
  }

  .pkg-xu {
    display: flex;
    align-items: baseline;
    gap: 4px;
    margin: 4px 0;
  }

  .xu-val {
    font-size: 40px;
    font-weight: 900;
    color: #d97706;
    line-height: 1;
    letter-spacing: -0.02em;
  }
  :global([data-theme="dark"]) .xu-val {
    color: #fbbf24;
  }

  .xu-label {
    font-size: 16px;
    font-weight: 800;
    color: #b45309;
  }
  :global([data-theme="dark"]) .xu-label {
    color: #f59e0b;
  }

  .pkg-price {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .price-val {
    font-size: 19px;
    font-weight: 800;
    color: var(--color-text-primary, #111111);
  }

  .price-curr {
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-muted, #64748b);
  }

  .pkg-unit-price {
    font-size: 12px;
    color: var(--color-text-secondary, #475569);
    background: rgba(0, 0, 0, 0.04);
    padding: 3px 10px;
    border-radius: var(--radius-pill, 9999px);
    border: 1px solid rgba(0, 0, 0, 0.06);
    margin-top: 2px;
  }
  :global([data-theme="dark"]) .pkg-unit-price {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(255, 255, 255, 0.1);
    color: #94a3b8;
  }

  .pkg-divider {
    height: 1px;
    background: var(--color-border-hairline, #e2e8f0);
    margin: 18px 0;
  }
  :global([data-theme="dark"]) .pkg-divider {
    background: rgba(255, 255, 255, 0.1);
  }

  .pkg-benefits {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }

  .pkg-desc {
    font-size: 13px;
    line-height: 1.45;
    color: var(--color-text-secondary, #475569);
    margin: 0;
  }

  .pkg-equivalence-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    font-size: 11.5px;
    font-weight: 600;
    color: #b45309;
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid rgba(245, 158, 11, 0.25);
    padding: 4px 8px;
    border-radius: var(--radius-sm, 8px);
    margin-bottom: 2px;
    line-height: 1.35;
  }
  :global([data-theme="dark"]) .pkg-equivalence-tag {
    color: #fef08a;
    background: rgba(217, 119, 6, 0.18);
    border-color: rgba(245, 158, 11, 0.35);
  }

  .bonus-tag {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    font-size: 12px;
    color: #b45309;
    background: #fffbeb;
    border: 1px solid #fde68a;
    padding: 5px 10px;
    border-radius: var(--radius-md, 10px);
    margin-top: 4px;
  }
  :global(.bonus-icon) {
    color: #d97706;
  }

  :global([data-theme="dark"]) .bonus-tag {
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.15);
    border-color: rgba(245, 158, 11, 0.35);
  }
  :global([data-theme="dark"]) :global(.bonus-icon) {
    color: #fbbf24;
  }

  .pkg-action {
    margin-top: 20px;
  }

  .cta-btn {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 11px 16px;
    border-radius: var(--radius-lg, 12px);
    background: #f8fafc;
    border: 1px solid #cbd5e1;
    color: var(--color-text-primary, #0f172a);
    font-size: 14px;
    font-weight: 750;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .cta-btn:hover {
    background: #f1f5f9;
    border-color: #94a3b8;
  }

  :global([data-theme="dark"]) .cta-btn {
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(245, 158, 11, 0.35);
    color: #fbbf24;
  }
  :global([data-theme="dark"]) .cta-btn:hover {
    background: rgba(245, 158, 11, 0.2);
    border-color: rgba(245, 158, 11, 0.6);
  }

  .cta-btn.primary-cta {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    border: none;
    color: #ffffff;
    box-shadow: 0 4px 16px rgba(217, 119, 6, 0.3);
  }

  .cta-btn.primary-cta:hover {
    box-shadow: 0 6px 20px rgba(217, 119, 6, 0.45);
    transform: translateY(-1px);
  }

  /* Matrix Section */
  .matrix-section {
    padding: 32px 24px;
  }

  .matrix-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 14px;
  }

  @media (min-width: 768px) {
    .matrix-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .matrix-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px;
    background: #f8fafc;
    border: 1px solid var(--color-border-hairline, #e2e8f0);
    border-radius: var(--radius-lg, 16px);
    transition: all 0.2s ease;
  }

  .matrix-item:hover {
    background: #fffbeb;
    border-color: #fde68a;
  }

  :global([data-theme="dark"]) .matrix-item {
    background: rgba(255, 255, 255, 0.03);
    border-color: rgba(255, 255, 255, 0.08);
  }
  :global([data-theme="dark"]) .matrix-item:hover {
    background: rgba(245, 158, 11, 0.08);
    border-color: rgba(245, 158, 11, 0.35);
  }

  .item-icon-box {
    width: 42px;
    height: 42px;
    border-radius: var(--radius-md, 12px);
    background: #fef3c7;
    border: 1px solid #fde68a;
    color: #d97706;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  :global([data-theme="dark"]) .item-icon-box {
    background: rgba(245, 158, 11, 0.15);
    border-color: rgba(245, 158, 11, 0.35);
    color: #fbbf24;
  }

  .item-icon-box.is-free {
    background: #dcfce7;
    border-color: #bbf7d0;
    color: #16a34a;
  }
  :global([data-theme="dark"]) .item-icon-box.is-free {
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.35);
    color: #34d399;
  }

  .item-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .item-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .item-title {
    font-size: 15px;
    font-weight: 750;
    color: var(--color-text-primary, #111111);
    margin: 0;
  }

  .item-cost-badge {
    font-size: 12px;
    font-weight: 800;
    color: #92400e;
    background: #fef3c7;
    border: 1px solid #fde68a;
    padding: 3px 8px;
    border-radius: var(--radius-sm, 6px);
    white-space: nowrap;
  }

  :global([data-theme="dark"]) .item-cost-badge {
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.15);
    border-color: rgba(245, 158, 11, 0.35);
  }

  .item-cost-badge.free-badge {
    color: #166534;
    background: #dcfce7;
    border-color: #bbf7d0;
  }
  :global([data-theme="dark"]) .item-cost-badge.free-badge {
    color: #34d399;
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.35);
  }

  .item-desc {
    font-size: 13px;
    line-height: 1.45;
    color: var(--color-text-secondary, #475569);
    margin: 0;
  }

  .item-tag-row {
    margin-top: 2px;
  }

  .item-sub-tag {
    font-size: 11px;
    font-weight: 600;
    color: var(--color-text-muted, #64748b);
  }

  /* Perks Section */
  .perks-section {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  @media (min-width: 640px) {
    .perks-section {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (min-width: 1024px) {
    .perks-section {
      grid-template-columns: repeat(4, 1fr);
    }
  }

  .perk-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding: 20px;
  }

  .perk-icon-ring {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: #fef3c7;
    border: 1px solid #fde68a;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  :global([data-theme="dark"]) .perk-icon-ring {
    background: rgba(245, 158, 11, 0.15);
    border-color: rgba(245, 158, 11, 0.35);
  }

  .perk-info h4 {
    font-size: 15px;
    font-weight: 750;
    color: var(--color-text-primary, #111111);
    margin: 0 0 4px;
  }

  .perk-info p {
    font-size: 13px;
    line-height: 1.45;
    color: var(--color-text-secondary, #475569);
    margin: 0;
  }

  /* Bottom Action Card (Always Royal High-Contrast) */
  .action-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28px 32px;
    border-radius: var(--radius-xl, 20px);
    flex-wrap: wrap;
    gap: 20px;
    background: linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%);
    border: 1px solid rgba(245, 158, 11, 0.35);
    box-shadow: 0 10px 30px rgba(15, 23, 42, 0.25);
    color: #ffffff;
  }

  .action-content h3 {
    font-family: var(--font-serif);
    font-size: 22px;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 4px;
  }

  .action-content p {
    font-size: 14px;
    color: #cbd5e1;
    margin: 0;
  }

  .btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: var(--radius-pill, 9999px);
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    border: none;
    color: #ffffff;
    font-size: 15px;
    font-weight: 800;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(217, 119, 6, 0.35);
    transition: all 0.2s ease;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(217, 119, 6, 0.5);
  }

  /* B2B PRICING BANNER */
  .b2b-pricing-banner {
    background: linear-gradient(135deg, rgba(30, 27, 75, 0.75) 0%, rgba(15, 23, 42, 0.85) 100%);
    border: 1px solid rgba(129, 140, 248, 0.35);
    border-radius: 20px;
    padding: 32px 28px;
    margin-bottom: 32px;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.3);
  }

  .b2b-banner-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(99, 102, 241, 0.18);
    border: 1px solid rgba(129, 140, 248, 0.4);
    color: #c7d2fe;
    padding: 4px 12px;
    border-radius: 999px;
    font-size: 11.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    margin-bottom: 16px;
  }

  .b2b-banner-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 28px;
    flex-wrap: wrap;
  }

  .b2b-banner-text {
    flex: 1;
    min-width: 300px;
  }

  .b2b-banner-text h3 {
    font-size: 20px;
    font-weight: 800;
    color: #ffffff;
    margin: 0 0 8px;
    line-height: 1.3;
  }

  .b2b-banner-text p {
    font-size: 13.5px;
    line-height: 1.6;
    color: #94a3b8;
    margin: 0 0 16px;
  }

  .b2b-perks-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .b2b-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #cbd5e1;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.08);
    padding: 4px 10px;
    border-radius: 8px;
  }

  .b2b-banner-action {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 10px;
  }

  .b2b-price-box {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .b2b-price-val {
    font-size: 28px;
    font-weight: 900;
    color: #ffffff;
    letter-spacing: -0.02em;
  }

  .b2b-price-curr {
    font-size: 13px;
    font-weight: 600;
    color: #94a3b8;
  }

  .b2b-buy-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
    color: #ffffff;
    font-size: 14px;
    font-weight: 700;
    border-radius: 12px;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(99, 102, 241, 0.35);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }

  .b2b-buy-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(168, 85, 247, 0.45);
  }

  @media (max-width: 768px) {
    .b2b-banner-action {
      align-items: flex-start;
      width: 100%;
    }

    .b2b-buy-btn {
      width: 100%;
      justify-content: center;
    }
  }
</style>

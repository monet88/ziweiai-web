<script lang="ts">
  import MarkdownView from './MarkdownView.svelte';
  import AuspiciousSummaryCard from './AuspiciousSummaryCard.svelte';
  import ExplanationToolbar from './ExplanationToolbar.svelte';
  import {
    Crown,
    Sparkles,
    Lock,
    Shield,
    Zap,
    RefreshCw,
    Eye
  } from 'lucide-svelte';

  interface SummaryItem {
    label: string;
    value: string;
  }

  interface Props {
    markdown: string | null;
    chartSystem: string | null;
    snapshot: any;
    pageTitle: string;
    isUnlocked: boolean;
    isPending: boolean;
    isStreaming: boolean;
    isBlocked?: boolean;
    userBalance: number;
    summaryItems?: SummaryItem[];
    onUnlock: () => void;
    onAbort?: () => void;
    onOpenRoyalPdfModal?: () => void;
  }

  let {
    markdown,
    chartSystem,
    snapshot,
    pageTitle,
    isUnlocked,
    isPending,
    isStreaming,
    isBlocked = false,
    userBalance,
    summaryItems = [],
    onUnlock,
    onAbort,
    onOpenRoyalPdfModal
  }: Props = $props();

  // Tạo nội dung phân tích thông minh 20% mở đầu dựa trên snapshot nếu chưa có markdown
  function buildSyntheticTeaser(): { teaser: string; blurred: string } {
    if (chartSystem === 'ba-zi') {
      const bazi = snapshot?.bazi;
      const dayMaster = bazi?.dayMaster || snapshot?.pillars?.[2]?.can || 'Giáp Mộc';
      const yearCanChi = `${snapshot?.pillars?.[0]?.can || ''} ${snapshot?.pillars?.[0]?.chi || ''}`.trim() || 'Bản mệnh';
      
      const teaser = `### ✦ TỨ TRỤ TINH HOA: KHÍ VẬN BẢN NGUYÊN (XEM TRƯỚC 20%)\n\n` +
        `**Nhật Chủ ${dayMaster}** sinh năm **${yearCanChi}**, định hình chân mệnh có căn cơ vững chãi, nội lực thâm sâu. ` +
        `Thiên Can Địa Chi phối hợp hài hòa, mang khí chất độc lập, tư duy nhạy bén và có tầm nhìn chiến lược vượt trội.\n\n` +
        `Bản mệnh sở hữu khả năng thích ứng linh hoạt trước thời cuộc, thường gặp cơ duyên chuyển mình lớn khi bước vào chu kỳ ngũ hành tương sinh. ` +
        `Tuy nhiên, trong tiền vận vẫn tiềm ẩn một số xung khắc can chi cần được tiết chế đúng thời điểm để tránh hao tổn chân khí.`;

      const blurred = `### ✦ ĐẠI VẬN 10 NĂM HOÀNG KIM (CƠ HỘI PHÁT TÀI & SỰ NGHIỆP BỨT PHÁ)\n\n` +
        `Giai đoạn chuyển đại vận sắp tới kích hoạt Dụng Thần tương trợ cung Tài Bạch và Quan Lộc. ` +
        `Các năm đại cát sẽ mang lại bước nhảy vọt về tài chính, danh tiếng và vị thế xã hội vượt bậc...\n\n` +
        `### ✦ TIỂU HẠN LƯU NIÊN: CƠ BIẾN TỪNG THÁNG & ĐIỂM BÙNG NỔ\n\n` +
        `Lưu niên Thái Tuế chiếu mệnh, cảnh báo các tháng 4 và tháng 8 âm lịch cần thận trọng trong giao dịch hợp đồng lớn, ` +
        `trong khi tháng 6 và tháng 10 là thời điểm hoàng kim để thâu tóm cơ hội đầu tư mang lại nguồn lợi nhuận dồi dào...\n\n` +
        `### ✦ PHƯƠNG PHÁP HÓA GIẢI HUNG SÁT & VƯỢNG KHÍ TRỌN ĐỜI\n\n` +
        `Chi tiết màu sắc ngũ hành tương vượng, phương vị quý nhân kích tài lộc và cách thức bố trí môi trường sống giúp bảo toàn nguyên khí.`;

      return { teaser, blurred };
    }

    if (chartSystem === 'liu-yao' || chartSystem === 'mei-hua-yi-shu') {
      const hexagram = snapshot?.divinationContext?.question 
        ? `Sự vụ: "${snapshot.divinationContext.question}"` 
        : 'Quẻ Dịch Khởi Vận';

      const teaser = `### ✦ ĐẠI TƯỢNG QUẺ TRỜI: LINH KHÍ KHỞI NGUYÊN (XEM TRƯỚC 20%)\n\n` +
        `**${hexagram}** — Quẻ tượng cho thấy khí vận đang ở thời điểm chuyển giao then chốt. Thoán từ chỉ rõ: Thiên thời tương hợp, cơ duyên hé mở nhưng vạn sự khởi đầu nan, đòi hỏi sự kiên định và mưu lược vững vàng.\n\n` +
        `Thế và Ứng có mối liên kết chặt chẽ, người hỏi quẻ đang nắm giữ thế chủ động nhưng cần chú ý thời điểm xuất chiêu để đón trọn luồng vượng khí trời ban.`;

      const blurred = `### ✦ PHÂN TÍCH LỤC HÀO CHUYÊN SÂU: THẾ - ỨNG & BIẾN HÀO\n\n` +
        `Hào Động phát động báo hiệu bước ngoặt bất ngờ trong công việc hoặc tài chính vào trung tuần tới. ` +
        `Quan Quỷ thoái vị nhường chỗ cho Phụ Mẫu và Thê Tài vượng tướng, mở lối cho thành công ngoài mong đợi...\n\n` +
        `### ✦ THỜI ĐIỂM ỨNG NGHIỆM CHÍNH XÁC & CÁCH HÓA NGUY THÀNH AN\n\n` +
        `Chi tiết ngày giờ ứng nghiệm, phương vị quý nhân xuất hiện giúp giải trừ trở ngại và hướng dẫn hành động cụ thể để đạt kết quả viên mãn nhất.`;

      return { teaser, blurred };
    }

    // Mặc định: Tử Vi Đẩu Số
    const palaces = snapshot?.palaces || [];
    const menhPalace = palaces.find((p: any) => p.nameKey === 'soulPalace' || p.name === 'Mệnh') || palaces[0];
    const menhStars = menhPalace?.majorStars?.map((s: any) => s.name).join(', ') || 'Tử Vi, Thiên Phủ';
    const cucName = snapshot?.astronomicalParameters?.bureau || 'Thủy Nhị Cục';

    const teaser = `### ✦ THIÊN CƠ BẢN MỆNH: CỐT CÁCH & KHỞI VẬN (XEM TRƯỚC 20%)\n\n` +
      `Bản mệnh an tại cung **${menhPalace?.name || 'Mệnh'}**, cục diện thuộc **${cucName}**. Chính tinh tọa thủ hội tụ **${menhStars}**, chủ về người mang cốt cách phi phàm, túc trí đa mưu, có chí lớn và bản lĩnh vững vàng trước phong ba bão táp.\n\n` +
      `Trong tiền vận, cung Mệnh hội chiếu tam phương tứ chính tạo thế chân vạc vững chắc, báo hiệu cuộc đời có nhiều thời cơ phát tích vang dội, hậu vận đại phú đại quý nếu biết nắm bắt vận hội.`;

    const blurred = `### ✦ ĐẠI VẬN 10 NĂM HOÀNG KIM (GIAI ĐOẠN ĐỘT PHÁ SỰ NGHIỆP)\n\n` +
      `Đại hạn 10 năm bước vào cung Quan Lộc và Tài Bạch gặp Hóa Lộc, Hóa Quyền đồng độ. ` +
      `Đây là thời điểm vượng khí đạt đỉnh cao nhất trong đời, mở ra cơ hội xây dựng cơ đồ, thăng quan tiến chức và tích lũy điền sản vượt bậc...\n\n` +
      `### ✦ TIỂU HẠN LƯU NIÊN NĂM NAY: BIẾN CỐ & THỜI ĐIỂM TÀI LỘC\n\n` +
      `Lưu niên Thái Tuế kích hoạt cung Tài Bạch, các tháng 3, 7 và 11 âm lịch là thời khắc then chốt. ` +
      `Cần đề phòng tiểu nhân quấy phá vào tháng 5 âm lịch, nhưng quý nhân phương Nam sẽ tương trợ mạnh mẽ vào cuối năm...\n\n` +
      `### ✦ DIỆU KẾ HÓA GIẢI HUNG SÁT & BẢO TOÀN KHÍ SỐ\n\n` +
      `Phương pháp kích hoạt cung Phúc Đức, phong thủy phương vị phòng làm việc và bài trí tài lộc giúp hóa hung thành cát trọn vẹn 12 tháng.`;

    return { teaser, blurred };
  }

  // Tách markdown nếu đã có kết quả
  const parsedContent = $derived.by(() => {
    if (!markdown || typeof markdown !== 'string' || markdown.trim().length === 0) {
      return buildSyntheticTeaser();
    }

    const trimmed = markdown.trim();
    const lines = trimmed.split('\n');

    // Tìm điểm cắt 20% (sau heading 2 đầu tiên hoặc sau khoảng 3-4 đoạn văn)
    let splitIdx = -1;
    let headingCount = 0;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('## ') || lines[i].startsWith('### ')) {
        headingCount++;
        if (headingCount === 2) {
          splitIdx = i;
          break;
        }
      }
    }

    // Nếu không tìm thấy heading 2, cắt theo tỷ lệ ký tự (~20%)
    if (splitIdx === -1) {
      const targetLength = Math.max(300, Math.floor(trimmed.length * 0.22));
      let currentLen = 0;
      for (let i = 0; i < lines.length; i++) {
        currentLen += lines[i].length + 1;
        if (currentLen >= targetLength && lines[i].trim() === '') {
          splitIdx = i;
          break;
        }
      }
    }

    if (splitIdx !== -1 && splitIdx < lines.length - 1) {
      return {
        teaser: lines.slice(0, splitIdx).join('\n'),
        blurred: lines.slice(splitIdx).join('\n')
      };
    }

    // Fallback: nếu markdown quá ngắn
    return {
      teaser: trimmed,
      blurred: buildSyntheticTeaser().blurred
    };
  });
</script>

<div class="blur-teaser-wrapper">
  {#if isUnlocked}
    <!-- GIAO DIỆN ĐÃ MỞ KHÓA TOÀN BỘ (100% UNBLURRED) -->
    <div class="unlocked-content-container">
      <!-- Bản Sớ Header (In ấn / PDF) -->
      <header class="print-so-header">
        <div class="so-emblem">✦ VIOS KHÂM THIÊN GIÁM ✦</div>
        <h1 class="so-title">BẢN SỚ TỬ VI ĐẠI THÀNH LUẬN GIẢI</h1>
        <div class="so-subtitle">{pageTitle}</div>
        <div class="so-meta-grid">
          {#each summaryItems as item (item.label)}
            <div class="so-meta-item">
              <span class="lbl">{item.label}:</span>
              <span class="val">{item.value}</span>
            </div>
          {/each}
        </div>
        <div class="so-seal-row">
          <span class="so-seal-text">BẢO CHỨNG BỞI HỆ THỐNG TỬ VI TOÀN TẬP — VIOS ENGINE</span>
          <span class="so-date-text">XUẤT BẢN NGÀY: {new Date().toLocaleDateString('vi-VN')}</span>
        </div>
      </header>

      {#if markdown}
        <AuspiciousSummaryCard {markdown} />
        {#if onOpenRoyalPdfModal}
          <ExplanationToolbar
            {markdown}
            chartTitle={pageTitle}
            birthInfo={summaryItems.map((i) => `${i.label}: ${i.value}`).join(' · ')}
            {onOpenRoyalPdfModal}
          />
        {/if}
      {/if}

      <article class="result surface-glass printable-content full-reading">
        {#if markdown}
          <MarkdownView {markdown} />
        {:else}
          <MarkdownView markdown={parsedContent.teaser + '\n\n' + parsedContent.blurred} />
        {/if}
        {#if isPending || isStreaming}
          <span class="live-streaming-cursor">▍</span>
        {/if}
      </article>
    </div>
  {:else}
    <!-- GIAO DIỆN FREEMIUM BLUR TEASER (20% RÕ NÉT + 80% LÀM MỜ KÈM NÚT HOÀNG GIA) -->
    <div class="teaser-container">
      <!-- Header Phân Tách: 20% Mở Đầu Sắc Bén -->
      <div class="teaser-badge-bar">
        <div class="teaser-tag">
          <Sparkles size={14} class="text-celestial-gold" />
          <span>PHÂN TÍCH KHỞI VẬN SẮC BÉN · XEM TRƯỚC 20%</span>
        </div>
        <div class="freemium-hint">
          <Eye size={13} />
          <span>80% vận hạn chuyên sâu ẩn bên dưới</span>
        </div>
      </div>

      <!-- Phần 20% mở đầu rõ nét -->
      <article class="result surface-glass teaser-crisp-section">
        <MarkdownView markdown={parsedContent.teaser} />
      </article>

      <!-- Phần 80% làm mờ kèm CTA Card hoàng gia đè lên -->
      <div class="blurred-curtain-stage">
        <!-- Nội dung giả lập / thật bị làm mờ 8px -->
        <div class="blurred-markdown-view" aria-hidden="true">
          <MarkdownView markdown={parsedContent.blurred} />
        </div>

        <!-- Lớp phủ vương giả (Celestial Frosted Glass Overlay) -->
        <div class="paywall-overlay">
          <div class="royal-unlock-card celestial-glass">
            <div class="card-crown-wrap">
              <Crown size={28} class="crown-icon glow-anim" />
              <span class="royal-tag">THIÊN CƠ CHƯA KHAI MỞ</span>
            </div>

            <h3 class="unlock-title">Mở Khóa Toàn Bộ Thiên Cơ Vận Mệnh</h3>
            
            <p class="unlock-desc">
              Khai mở 80% phần luận giải bí truyền: <strong>Đại Vận 10 Năm Hoàng Kim</strong>, 
              <strong>Biến Cố Tiểu Hạn Từng Tháng</strong>, cùng <strong>Diệu Kế Hóa Giải Hung Sát</strong> 
              và sách lược kích tài vượng khí trọn đời.
            </p>

            <div class="unlock-perks-row">
              <span class="perk-chip"><Sparkles size={13} class="text-gold" /> Đại Vận 10 Năm</span>
              <span class="perk-chip"><Zap size={13} class="text-gold" /> Hạn Năm Lưu Niên</span>
              <span class="perk-chip"><Shield size={13} class="text-gold" /> Hóa Giải Vận Hạn</span>
            </div>

            <button
              type="button"
              class="btn-royal-unlock"
              onclick={onUnlock}
              disabled={isPending || isBlocked}
            >
              {#if isPending}
                <RefreshCw size={16} class="spin-icon" />
                <span>Đang kết nối Khâm Thiên Giám...</span>
              {:else}
                <Lock size={16} class="lock-icon" />
                <span>Mở Khóa Toàn Bộ Thiên Cơ — 10 XU (Chỉ 10k)</span>
              {/if}
            </button>

            <div class="unlock-footer-notes">
              <span class="note-item">✦ 1 chạm trừ 10 XU trực tiếp từ ví</span>
              <span class="note-item">✦ Lưu vĩnh viễn không mất phí xem lại</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .blur-teaser-wrapper {
    position: relative;
    width: 100%;
  }

  /* Teaser 20% Bar */
  .teaser-badge-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 12px;
    padding: 6px 12px;
    background: rgba(212, 175, 55, 0.08);
    border: 1px solid rgba(212, 175, 55, 0.25);
    border-radius: var(--radius-md, 10px);
  }

  .teaser-tag {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 11.5px;
    font-weight: 750;
    letter-spacing: 0.04em;
    color: #fef08a;
    text-transform: uppercase;
  }

  :global([data-theme="light"]) .teaser-tag {
    color: #92400e;
  }

  .freemium-hint {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11.5px;
    color: var(--color-text-muted, #94a3b8);
    font-style: italic;
  }

  .teaser-crisp-section {
    margin-bottom: 16px;
    padding: 18px 22px;
    border-radius: var(--radius-lg, 16px);
    border-left: 3px solid #f59e0b;
  }

  /* Blurred Stage 80% */
  .blurred-curtain-stage {
    position: relative;
    border-radius: var(--radius-lg, 16px);
    overflow: hidden;
    min-height: 380px;
    background: rgba(15, 12, 35, 0.4);
    border: 1px solid rgba(212, 175, 55, 0.2);
  }

  :global([data-theme="light"]) .blurred-curtain-stage {
    background: rgba(254, 243, 199, 0.25);
    border-color: rgba(180, 83, 9, 0.2);
  }

  .blurred-markdown-view {
    padding: 22px;
    filter: blur(8px);
    -webkit-filter: blur(8px);
    user-select: none;
    pointer-events: none;
    opacity: 0.55;
    max-height: 480px;
    overflow: hidden;
  }

  /* Celestial Glass Paywall Overlay */
  .paywall-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: linear-gradient(
      180deg,
      rgba(10, 8, 22, 0.3) 0%,
      rgba(10, 8, 22, 0.85) 45%,
      rgba(10, 8, 22, 0.95) 100%
    );
    z-index: 10;
  }

  :global([data-theme="light"]) .paywall-overlay {
    background: linear-gradient(
      180deg,
      rgba(255, 255, 255, 0.3) 0%,
      rgba(255, 255, 255, 0.88) 45%,
      rgba(255, 255, 255, 0.96) 100%
    );
  }

  .royal-unlock-card {
    max-width: 540px;
    width: 100%;
    padding: 28px 24px;
    text-align: center;
    background: linear-gradient(135deg, rgba(30, 20, 60, 0.85) 0%, rgba(15, 10, 35, 0.92) 100%);
    border: 1.5px solid rgba(245, 158, 11, 0.45);
    border-radius: 20px;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.5), 0 0 30px rgba(245, 158, 11, 0.15);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    animation: fadeInScale 0.3s ease-out;
  }

  :global([data-theme="light"]) .royal-unlock-card {
    background: linear-gradient(135deg, #ffffff 0%, #fffbeb 100%);
    border-color: #f59e0b;
    box-shadow: 0 16px 40px rgba(217, 119, 6, 0.18);
  }

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.96);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .card-crown-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  :global(.crown-icon) {
    color: #fbbf24;
    filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.6));
  }

  .royal-tag {
    font-size: 11px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #fbbf24;
    background: rgba(245, 158, 11, 0.15);
    border: 1px solid rgba(245, 158, 11, 0.35);
    padding: 3px 10px;
    border-radius: 9999px;
  }

  .unlock-title {
    font-size: 20px;
    font-weight: 800;
    color: #fef08a;
    margin: 0 0 10px 0;
    text-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
  }

  :global([data-theme="light"]) .unlock-title {
    color: #78350f;
    text-shadow: none;
  }

  .unlock-desc {
    font-size: 13.5px;
    line-height: 1.55;
    color: #d1d5db;
    margin: 0 0 16px 0;
  }

  :global([data-theme="light"]) .unlock-desc {
    color: #4b5563;
  }

  .unlock-perks-row {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
  }

  .perk-chip {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11.5px;
    font-weight: 600;
    color: #fde047;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 4px 10px;
    border-radius: 9999px;
  }

  :global([data-theme="light"]) .perk-chip {
    color: #92400e;
    background: rgba(245, 158, 11, 0.12);
    border-color: rgba(245, 158, 11, 0.25);
  }

  .btn-royal-unlock {
    width: 100%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 13px 22px;
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.02em;
    color: #1a0f02;
    background: linear-gradient(135deg, #fbbf24 0%, #d97706 100%);
    border: 1px solid #fef08a;
    border-radius: 14px;
    cursor: pointer;
    box-shadow: 0 6px 24px rgba(217, 119, 6, 0.45);
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .btn-royal-unlock:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(217, 119, 6, 0.6);
    background: linear-gradient(135deg, #fde047 0%, #f59e0b 100%);
  }

  .btn-royal-unlock:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
  }

  .unlock-footer-notes {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-wrap: wrap;
    gap: 14px;
    margin-top: 14px;
    font-size: 11px;
    color: #9ca3af;
  }

  :global([data-theme="light"]) .unlock-footer-notes {
    color: #6b7280;
  }

  :global(.spin-icon) {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  /* Full Reading */
  .full-reading {
    border-radius: var(--radius-lg, 16px);
    padding: 24px;
    animation: unblurReveal 0.5s ease-out;
  }

  @keyframes unblurReveal {
    from {
      filter: blur(6px);
      opacity: 0.8;
    }
    to {
      filter: blur(0);
      opacity: 1;
    }
  }

  .print-so-header {
    display: none;
  }

  /* Print Styles */
  @media print {
    .teaser-badge-bar,
    .paywall-overlay {
      display: none !important;
    }

    .print-so-header {
      display: block !important;
      text-align: center;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #b45309;
      page-break-after: avoid;
      break-after: avoid;
    }

    .so-emblem {
      font-size: 10.5pt;
      letter-spacing: 3px;
      font-weight: 700;
      color: #92400e;
      margin-bottom: 4px;
    }

    .so-title {
      font-size: 19pt;
      font-weight: 800;
      color: #78350f;
      margin: 0 0 6px 0;
      letter-spacing: 0.5px;
    }

    .so-subtitle {
      font-size: 12pt;
      font-weight: 600;
      color: #451a03;
      margin-bottom: 12px;
    }

    .so-meta-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px 12px;
      background: #fdfaf3;
      border: 1px solid #e7d8b8;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: 8px;
      text-align: left;
      font-size: 9.5pt;
    }

    .so-meta-item .lbl {
      color: #78350f;
      font-weight: 600;
      margin-right: 4px;
    }

    .so-meta-item .val {
      color: #111827;
      font-weight: 700;
    }

    .so-seal-row {
      display: flex;
      justify-content: space-between;
      font-size: 8pt;
      color: #6b7280;
      font-style: italic;
      padding: 0 4px;
    }

    .blurred-markdown-view {
      filter: none !important;
      user-select: auto !important;
      pointer-events: auto !important;
      opacity: 1 !important;
    }
  }
</style>

<script lang="ts">
  import { Sparkles, AlertTriangle, ShieldCheck } from 'lucide-svelte';

  interface Props {
    markdown: string;
  }

  let { markdown }: Props = $props();

  interface SummaryItem {
    text: string;
  }

  interface CatHungAnalysis {
    fortuneTier: 'dai_cat' | 'binh_hoa' | 'tiet_che';
    tierLabel: string;
    tierSubtitle: string;
    auspiciousPoints: SummaryItem[];
    inauspiciousPoints: SummaryItem[];
  }

  const analysis = $derived.by<CatHungAnalysis>(() => {
    if (!markdown || typeof markdown !== 'string') {
      return {
        fortuneTier: 'binh_hoa',
        tierLabel: 'Bình Hòa An Định',
        tierSubtitle: 'Vận số cân bằng, giữ tâm an định ắt gặp quý nhân',
        auspiciousPoints: [],
        inauspiciousPoints: [],
      };
    }

    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const auspiciousList: string[] = [];
    const inauspiciousList: string[] = [];

    const auspiciousKeywords = [
      'thuận lợi', 'tài lộc', 'quý nhân', 'may mắn', 'cát tinh', 'đắc địa',
      'miếu địa', 'vượng', 'phúc thọ', 'thăng tiến', 'hanh thông', 'cơ hội',
      'điểm mạnh', 'ưu thế', 'đại cát', 'cát', 'thành công', 'phát đạt'
    ];

    const inauspiciousKeywords = [
      'cẩn trọng', 'đề phòng', 'lưu ý', 'hao tài', 'thị phi', 'trở ngại',
      'trắc trở', 'xung khắc', 'hãm địa', 'hung tinh', 'kỵ', 'rủi ro',
      'tiểu nhân', 'kiêng cữ', 'họa', 'bệnh tật', 'bất lợi', 'điểm yếu'
    ];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#') || line.startsWith('>') || line.startsWith('|')) continue;

      // Bỏ qua các dòng tiêu đề đánh số (vd: "1. Tổng quan...", "2. Phân tích chi tiết...")
      if (/^[0-9]+[.)]\s+/.test(line)) continue;

      // Chuẩn hóa line nếu là bullet item
      let cleanLine = line.replace(/^[-*•]\s+/, '').replace(/\*\*/g, '').trim();
      if (cleanLine.length < 8) continue;

      // Nếu là đoạn văn dài lê thê, trích câu ngắn đầu tiên có nghĩa để làm điểm tóm tắt
      if (cleanLine.length > 120) {
        const firstSentence = cleanLine.split(/[.?!]\s+/)[0];
        if (firstSentence && firstSentence.length >= 10 && firstSentence.length <= 120) {
          cleanLine = firstSentence + '.';
        } else {
          cleanLine = cleanLine.slice(0, 110).trim() + '...';
        }
      }

      const lower = cleanLine.toLowerCase();
      const hasAuspicious = auspiciousKeywords.some((kw) => lower.includes(kw));
      const hasInauspicious = inauspiciousKeywords.some((kw) => lower.includes(kw));

      if (hasAuspicious && !hasInauspicious && auspiciousList.length < 4) {
        auspiciousList.push(cleanLine);
      } else if (hasInauspicious && inauspiciousList.length < 4) {
        inauspiciousList.push(cleanLine);
      }
    }

    // Xác định vận khí
    let tier: 'dai_cat' | 'binh_hoa' | 'tiet_che' = 'binh_hoa';
    let label = 'Bình Hòa Vận Thế';
    let sub = 'Cát hung cân bằng, cần kiên trì tu dưỡng và nắm bắt thời cơ.';

    if (auspiciousList.length > inauspiciousList.length) {
      tier = 'dai_cat';
      label = 'Cát Khí Hội Tụ (Đại Cát)';
      sub = 'Vận thế hanh thông, thiên thời địa lợi hỗ trợ bản mệnh.';
    } else if (inauspiciousList.length > auspiciousList.length + 1) {
      tier = 'tiet_che';
      label = 'Tiết Chế Tu Thân (Cần Phòng Tránh)';
      sub = 'Gặp một số trở ngại/sao hãm, cẩn trọng lời ăn tiếng nói và tài chính.';
    }

    // Fallback nếu bài luận quá ngắn hoặc văn xuôi
    if (auspiciousList.length === 0 && inauspiciousList.length === 0) {
      auspiciousList.push('Bản mệnh có căn cơ vững vàng, cốt cách độc lập.');
      inauspiciousList.push('Cần chú ý giữ nhịp sinh hoạt và cân bằng cảm xúc.');
    }

    return {
      fortuneTier: tier,
      tierLabel: label,
      tierSubtitle: sub,
      auspiciousPoints: auspiciousList.map((text) => ({ text })),
      inauspiciousPoints: inauspiciousList.map((text) => ({ text })),
    };
  });
</script>

<div class="auspicious-summary celestial-card-glass">
  <!-- Header: Vận Khí Badge -->
  <div class="summary-header">
    <div class="tier-badge {analysis.fortuneTier}">
      <span class="badge-icon">
        {#if analysis.fortuneTier === 'dai_cat'}
          <Sparkles size={16} />
        {:else if analysis.fortuneTier === 'tiet_che'}
          <AlertTriangle size={16} />
        {:else}
          <ShieldCheck size={16} />
        {/if}
      </span>
      <span class="badge-text">{analysis.tierLabel}</span>
    </div>
    <p class="tier-sub">{analysis.tierSubtitle}</p>
  </div>

  <!-- 2-Column Grid Cát vs Hung -->
  <div class="summary-grid">
    <!-- Cột Cát Lành -->
    <div class="column auspicious-col">
      <div class="col-title text-gold">
        <Sparkles size={16} />
        <h4>Điểm Cát Lành & Vượng Khí</h4>
      </div>
      <ul class="points-list">
        {#each analysis.auspiciousPoints as pt (pt.text)}
          <li class="point-item">
            <span class="bullet-gem gold">✦</span>
            <span>{pt.text}</span>
          </li>
        {/each}
      </ul>
    </div>

    <!-- Cột Cần Phòng Tránh -->
    <div class="column inauspicious-col">
      <div class="col-title text-amber">
        <AlertTriangle size={16} />
        <h4>Điểm Cần Lưu Ý & Phòng Tránh</h4>
      </div>
      <ul class="points-list">
        {#each analysis.inauspiciousPoints as pt (pt.text)}
          <li class="point-item">
            <span class="bullet-gem amber">✧</span>
            <span>{pt.text}</span>
          </li>
        {/each}
      </ul>
    </div>
  </div>
</div>

<style>
  .auspicious-summary {
    background: linear-gradient(135deg, rgba(26, 18, 52, 0.75) 0%, rgba(14, 10, 30, 0.85) 100%);
    border: 1px solid rgba(212, 175, 55, 0.3);
    border-radius: 16px;
    padding: 20px;
    margin-bottom: 20px;
    backdrop-filter: blur(12px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), inset 0 0 20px rgba(212, 175, 55, 0.05);
  }

  .summary-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 8px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(212, 175, 55, 0.15);
    margin-bottom: 16px;
  }

  .tier-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 16px;
    border-radius: 9999px;
    font-size: 14.5px;
    font-weight: 700;
    letter-spacing: 0.02em;
    text-transform: uppercase;
  }

  .tier-badge.dai_cat {
    background: linear-gradient(135deg, rgba(217, 119, 6, 0.25) 0%, rgba(245, 158, 11, 0.35) 100%);
    border: 1px solid #fbbf24;
    color: #fef08a;
    box-shadow: 0 0 16px rgba(245, 158, 11, 0.3);
  }

  .tier-badge.binh_hoa {
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(96, 165, 250, 0.5);
    color: #bfdbfe;
  }

  .tier-badge.tiet_che {
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid rgba(248, 113, 113, 0.5);
    color: #fecaca;
  }

  .tier-sub {
    margin: 0;
    font-size: 13.5px;
    color: #d1d5db;
    font-style: italic;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 16px;
  }

  @media (min-width: 768px) {
    .summary-grid {
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
  }

  .column {
    padding: 14px 16px;
    border-radius: 12px;
    background: rgba(10, 8, 22, 0.5);
    border: 1px solid rgba(255, 255, 255, 0.06);
  }

  .auspicious-col {
    border-left: 3px solid #fbbf24;
  }

  .inauspicious-col {
    border-left: 3px solid #f97316;
  }

  .col-title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .col-title h4 {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
  }

  .text-gold {
    color: #fde047;
  }

  .text-amber {
    color: #fdba74;
  }

  .points-list {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .point-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 14px;
    line-height: 1.6;
    color: #e5e7eb;
  }

  .bullet-gem {
    font-size: 12px;
    line-height: 1.5;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .bullet-gem.gold {
    color: #fbbf24;
    text-shadow: 0 0 6px rgba(251, 191, 36, 0.6);
  }

  .bullet-gem.amber {
    color: #f97316;
    text-shadow: 0 0 6px rgba(249, 115, 22, 0.6);
  }

  /* Dual-Theme: Light Mode */
  :global([data-theme="light"]) .auspicious-summary {
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(254, 243, 199, 0.7) 100%);
    border-color: rgba(180, 83, 9, 0.25);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
  }

  :global([data-theme="light"]) .summary-header {
    border-bottom-color: rgba(180, 83, 9, 0.15);
  }

  :global([data-theme="light"]) .tier-sub {
    color: #4b5563;
  }

  :global([data-theme="light"]) .tier-badge.dai_cat {
    background: #fef3c7;
    border-color: #d97706;
    color: #92400e;
    box-shadow: 0 0 10px rgba(217, 119, 6, 0.2);
  }

  :global([data-theme="light"]) .tier-badge.binh_hoa {
    background: #eff6ff;
    border-color: #3b82f6;
    color: #1e40af;
  }

  :global([data-theme="light"]) .tier-badge.tiet_che {
    background: #fef2f2;
    border-color: #ef4444;
    color: #991b1b;
  }

  :global([data-theme="light"]) .column {
    background: #ffffff;
    border-color: rgba(180, 83, 9, 0.12);
  }

  :global([data-theme="light"]) .col-title.text-gold {
    color: #92400e;
  }

  :global([data-theme="light"]) .col-title.text-amber {
    color: #c2410c;
  }

  :global([data-theme="light"]) .point-item {
    color: #374151;
  }

  :global([data-theme="light"]) .bullet-gem.gold {
    color: #b45309;
    text-shadow: none;
  }

  :global([data-theme="light"]) .bullet-gem.amber {
    color: #ea580c;
    text-shadow: none;
  }
</style>

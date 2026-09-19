<script lang="ts">
  import { Sparkles, Compass, ShieldCheck, Sun } from 'lucide-svelte';

  interface Props {
    score: number; // 0 -> 100
  }

  let { score }: Props = $props();

  const ratingLabel = $derived.by(() => {
    if (score >= 90) return { label: 'Đại Cát Tương Hợp', color: 'text-emerald-400', border: 'border-emerald-500/40' };
    if (score >= 80) return { label: 'Thiên Địa Giao Hòa', color: 'text-amber-400', border: 'border-amber-500/40' };
    if (score >= 70) return { label: 'Âm Dương Cân Bằng', color: 'text-blue-400', border: 'border-blue-500/40' };
    return { label: 'Tương Khắc Cần Hóa Giải', color: 'text-rose-400', border: 'border-rose-500/40' };
  });
</script>

<div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-stone-900 via-stone-950 to-stone-900 border {ratingLabel.border} p-5 text-stone-100 shadow-xl">
  <!-- Nền ánh sáng hoàng gia -->
  <div class="absolute -top-12 -right-12 w-36 h-36 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>

  <div class="flex flex-col sm:flex-row items-center justify-between gap-5">
    <!-- Cột Điểm Số -->
    <div class="flex items-center gap-4 text-center sm:text-left">
      <div class="relative w-20 h-20 rounded-full bg-stone-950 border-2 border-amber-500/50 flex flex-col items-center justify-center shadow-lg shadow-amber-950/60">
        <span class="font-serif text-2xl font-black text-amber-300">{score}%</span>
        <span class="text-[9px] uppercase tracking-wider text-stone-400">Đồng Thuận</span>
      </div>

      <div class="space-y-1">
        <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-stone-900 {ratingLabel.color} border border-current/30">
          <Sparkles size={12} /> {ratingLabel.label}
        </div>
        <h4 class="font-serif text-base font-bold text-stone-200">
          Chỉ Số Khí Vận "Tam Tài Đồng Quy"
        </h4>
        <p class="text-xs text-stone-400 max-w-sm leading-relaxed">
          Mức độ cộng hưởng và bổ trợ lẫn nhau giữa Thiên Mệnh (Tử Vi), Địa Mệnh (Bát Tự) và Nhân Tâm (Thần Số Học).
        </p>
      </div>
    </div>

    <!-- 3 Trụ Cột Tóm Tắt -->
    <div class="grid grid-cols-3 gap-2 sm:gap-3 w-full sm:w-auto">
      <div class="flex flex-col items-center p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 text-center">
        <Sun size={18} class="text-amber-400 mb-1" />
        <span class="text-[10px] text-stone-400">Thiên Đạo</span>
        <span class="font-serif text-xs font-bold text-amber-200">Tử Vi</span>
      </div>
      <div class="flex flex-col items-center p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 text-center">
        <Compass size={18} class="text-emerald-400 mb-1" />
        <span class="text-[10px] text-stone-400">Địa Đạo</span>
        <span class="font-serif text-xs font-bold text-emerald-200">Bát Tự</span>
      </div>
      <div class="flex flex-col items-center p-2.5 rounded-xl bg-stone-900/60 border border-stone-800 text-center">
        <ShieldCheck size={18} class="text-blue-400 mb-1" />
        <span class="text-[10px] text-stone-400">Nhân Đạo</span>
        <span class="font-serif text-xs font-bold text-blue-200">Thần Số</span>
      </div>
    </div>
  </div>
</div>

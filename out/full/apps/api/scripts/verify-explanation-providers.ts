/**
 * Script xác minh end-to-end: gọi provider AI thật (DeepSeek + OpenAI-compat)
 * để sinh luận giải cho 3 hệ còn nợ proof (Bát Tự, Mai Hoa, Lục Hào).
 *
 * Mục đích: đóng nợ "explanation E2E" cho Phase 3/4/5 của plan
 * 260611-2309-multi-system-deep-polish-review mà không cần dựng Supabase local.
 * Provider chỉ phụ thuộc apiEnv (module-level) nên khởi tạo trực tiếp được.
 *
 * Chạy: pnpm --filter @ziweiai/api exec tsx scripts/verify-explanation-providers.ts
 */
import { containsCjkText } from '@ziweiai/core';
import { LunarJavascriptBaziAdapter } from '../../../packages/astro-engine/src/adapters/lunar-javascript-bazi-adapter';
import { MeiHuaAdapter } from '../../../packages/astro-engine/src/adapters/meihua-adapter';
import { LiuyaoAdapter } from '../../../packages/astro-engine/src/adapters/liuyao-adapter';
import { DeepseekExplanationProvider } from '../src/providers/ai/deepseek-explanation-provider';
import { OpenAiCompatibleExplanationProvider } from '../src/providers/ai/openai-compatible-explanation-provider';
import type { ExplanationPromptPayload } from '../src/providers/ai/ai-explanation-provider';
import type { BirthInput, ChartSnapshot } from '@ziweiai/contracts';

const baseBirth = {
  calendar: 'gregorian' as const,
  place: {
    label: 'Manual entry',
    manual: { latitude: 10.8231, longitude: 106.6297, timezone: 'Asia/Ho_Chi_Minh' },
  },
  locale: 'vi-VN',
  source: 'test-fixture' as const,
};

const baziBirth: BirthInput = {
  ...baseBirth,
  date: { year: 2005, month: 12, day: 23, isLeapMonth: null },
  time: { hour: 8, minute: 37, isUnknown: false },
  sexOrGenderForChart: 'female',
};

const meihuaBirth: BirthInput = {
  ...baseBirth,
  date: { year: 2026, month: 6, day: 12, isLeapMonth: null },
  time: { hour: 9, minute: 15, isUnknown: false },
  sexOrGenderForChart: 'female',
};

const liuyaoBirth: BirthInput = {
  ...baseBirth,
  date: { year: 2024, month: 1, day: 1, isLeapMonth: null },
  time: { hour: 8, minute: 0, isUnknown: false },
  sexOrGenderForChart: 'male',
};

function buildPayload(snapshot: ChartSnapshot): ExplanationPromptPayload {
  return {
    chartSnapshot: snapshot,
    explanationKind: 'overview',
    explanationContext: {
      chartSystem: snapshot.chartSystem,
      visibleMessageKeys: snapshot.calculationConfidence.visibleMessageKey
        ? [snapshot.calculationConfidence.visibleMessageKey]
        : [],
      confidence: snapshot.calculationConfidence,
      sourceLabel: snapshot.ruleSource.canonicalLibrary.name,
    },
  };
}

async function run(): Promise<number> {
  const deepseek = new DeepseekExplanationProvider();
  const openai = new OpenAiCompatibleExplanationProvider();

  // Đếm số case thất bại (vi phạm CJK hoặc lỗi gọi provider) để script
  // báo lỗi thật sự thay vì luôn exit 0 — nếu không, xác minh là vô nghĩa.
  let failureCount = 0;

  const cases: Array<{ system: string; snapshot: ChartSnapshot }> = [
    { system: 'ba-zi', snapshot: await new LunarJavascriptBaziAdapter().calculateChart(baziBirth) },
    { system: 'mei-hua-yi-shu', snapshot: await new MeiHuaAdapter().calculateChart(meihuaBirth) },
    { system: 'liu-yao', snapshot: await new LiuyaoAdapter().calculateChart(liuyaoBirth) },
  ];

  for (const provider of [deepseek, openai]) {
    console.log(`\n${'='.repeat(70)}\nPROVIDER: ${provider.providerName} (available=${provider.isAvailable()})\n${'='.repeat(70)}`);
    if (!provider.isAvailable()) {
      console.log('  -> SKIP: chưa cấu hình key.');
      continue;
    }

    for (const testCase of cases) {
      const payload = buildPayload(testCase.snapshot);
      try {
        const result = await provider.generateExplanation(payload);
        const hasCjk = containsCjkText(result.renderedMarkdown);
        console.log(`\n--- [${provider.providerName}] hệ ${testCase.system} | model=${result.providerMetadata.model} | tokens=${result.providerMetadata.totalTokens} | CJK=${hasCjk ? 'CÓ (LỖI!)' : 'không'} ---`);
        console.log(result.renderedMarkdown);
        if (hasCjk) {
          failureCount += 1;
          console.error(`!!! CẢNH BÁO: output hệ ${testCase.system} chứa ký tự CJK — vi phạm bất biến.`);
        }
      } catch (error) {
        failureCount += 1;
        console.error(`\n--- [${provider.providerName}] hệ ${testCase.system}: THẤT BẠI ---`);
        console.error(error instanceof Error ? `${error.name}: ${error.message}` : String(error));
      }
    }
  }

  return failureCount;
}

run().then(
  (failureCount) => {
    if (failureCount > 0) {
      console.error(`\nXÁC MINH THẤT BẠI: ${failureCount} case vi phạm (CJK hoặc lỗi provider).`);
    }
    process.exit(failureCount > 0 ? 1 : 0);
  },
  (error) => {
    console.error(error);
    process.exit(1);
  },
);

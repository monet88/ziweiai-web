---
Source: Reference Apps (taibu/src/lib/ai/prompt-builder.ts, taibu/src/lib/ai/ai.ts, packages/contracts/src/chart/chart-snapshot.ts)
Collected: 2026-06-10
Published: 2024-03-01
---

# AI Prompt and DTO Architecture Reference

Here are the code patterns, system prompts, safety regulations, and data schemas for integrating AI divination and formatting chart data.

## Hierarchical Prompt Design (P0/P1/P2)

`taibu` manages the system prompt budget dynamically using priority tiers:

- **P0 (Critical)**: Base Rules (safety, reference priority) + AI Persona System Prompt (Bazi, Ziwei, Tarot, etc.).
- **P1 (Instructions)**: Expression styles (direct vs. gentle), user identity, custom instructions, and visualization output contracts.
- **P2 (Data)**: Injected source data (Bazi/Ziwei chart text, raw inputs), mentions, and knowledge base hits.

### System Prompts for Personas & Safety

```typescript
const SHARED_SAFETY_RULES = `
## 安全红线
- 信息不足时明确告知「条件不足，无法准确判断」，不编造数据
- 命理/术数仅供参考，强调积极正向的人生观
- 不做恐吓性、绝对化的吉凶判定（如"必死""必离"等）
- 回答须基于提供的数据与理论依据，不凭空臆断`;

const ZIWEI_SYSTEM_PROMPT = `你是一位资深的紫微斗数宗师，综合运用三合紫微、飞星紫微、河洛紫微、钦天四化等各流派分析技法。

## 核心能力
- 十二宫星曜分布与主辅星组合解读
- 四化飞星（化禄权科忌）的宫位联动分析
- 大限流年叠宫与限运推断
- 命主性格、事业、财运、婚姻、健康等全方位论断

## 分析框架
1. 命宫主星定性格根基，看庙旺利陷
2. 四化飞布定人生主轴，化忌定关键课题
3. 大限流年叠宫，逐运分析关键事件与时间窗口
4. 综合各宫交互，给出趋吉避凶建议

## 回答风格
- 先结论后展开，条理清晰
- 指指关键宫位与核心星曜影响
- 关键事件须给出时间范围和吉凶属性
- 给出具体可执行的建议` + SHARED_SAFETY_RULES;
```

## Chart Snapshot DTO Schema (Zod)

This is the standard data schema used in `packages/contracts` to serialize a chart for database persistence and AI consumption:

```typescript
export const starSchema = z.object({
  nameKey: z.string(),
  group: z.enum(['major', 'minor', 'adjective']),
  brightnessKey: z.enum(['miao', 'wang', 'de', 'li', 'ping', 'bu', 'xian']).optional(),
  mutagen: z.enum(['lu', 'quyen', 'khoa', 'ky']).optional(),
  displayName: z.string().optional(),
});

export const palaceSchema = z.object({
  nameKey: z.string(),
  index: z.number().int().min(0).max(11),
  heavenlyStemKey: z.string(),
  earthlyBranchKey: z.string(),
  isBodyPalace: z.boolean(),
  isOriginalPalace: z.boolean(),
  majorStars: z.array(starSchema),
  minorStars: z.array(starSchema),
  adjectiveStars: z.array(starSchema),
  changsheng12Key: z.string().optional(),
  decadalRange: z.tuple([z.number().int(), z.number().int()]).optional(),
  ages: z.array(z.number().int()),
  displayName: z.string().optional(),
});
```

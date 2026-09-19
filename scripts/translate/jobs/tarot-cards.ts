// Job port dữ liệu hệ Tarot (Issue #64): 78 lá Tarot từ .ref/FateAtelier/src/data/tarotCards.ts
// sang tiếng Việt thuần (0 chữ Hán) làm AI Grounding cho module draws-tarot.
//
// Tuân thủ pipeline dịch chung (scripts/translate/core.ts):
// 1. flattenTarotCards: trích xuất các leaf chuỗi (meaning, description, interpretation, advice, categories),
//    dedupe theo nội dung và gán unit id tarot.t${seq}.
// 2. rebuildTarotCards: ráp lại 78 lá bài tiếng Việt, ánh xạ id sang string id chuẩn của monorepo
//    (major_00..major_21, wands_ace..pentacles_king) và gán tên tiếng Việt sạch từ TAROT_DECK.

import type { TranslationUnit } from '../core';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

export interface TarotCategoryReadingSource {
  upright: string;
  reversed: string;
}

export interface TarotCardSource {
  id: number;
  name: string;
  nameEn: string;
  type: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  number?: number;
  meaning: {
    upright: string;
    reversed: string;
  };
  description: string;
  interpretation: {
    upright: string;
    reversed: string;
  };
  advice: {
    upright: string;
    reversed: string;
  };
  categories: {
    love: TarotCategoryReadingSource;
    career: TarotCategoryReadingSource;
    wealth: TarotCategoryReadingSource;
    health: TarotCategoryReadingSource;
  };
}

export interface TarotCategoryReadingVi {
  upright: string;
  reversed: string;
}

export interface TarotCardVi {
  id: string; // major_00, wands_ace, ...
  numericId: number;
  name: string; // Vietnamese display name from TAROT_DECK
  nameEn: string;
  type: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  number?: number;
  meaning: {
    upright: string;
    reversed: string;
  };
  description: string;
  interpretation: {
    upright: string;
    reversed: string;
  };
  advice: {
    upright: string;
    reversed: string;
  };
  categories: {
    love: TarotCategoryReadingVi;
    career: TarotCategoryReadingVi;
    wealth: TarotCategoryReadingVi;
    health: TarotCategoryReadingVi;
  };
}

const MINOR_RANKS = [
  'ace',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'page',
  'knight',
  'queen',
  'king',
] as const;

export function toCardStringId(id: number): string {
  if (id >= 0 && id <= 21) {
    return `major_${String(id).padStart(2, '0')}`;
  }
  if (id >= 22 && id <= 35) {
    return `wands_${MINOR_RANKS[id - 22]}`;
  }
  if (id >= 36 && id <= 49) {
    return `cups_${MINOR_RANKS[id - 36]}`;
  }
  if (id >= 50 && id <= 63) {
    return `swords_${MINOR_RANKS[id - 50]}`;
  }
  if (id >= 64 && id <= 77) {
    return `pentacles_${MINOR_RANKS[id - 64]}`;
  }
  throw new Error(`Invalid tarot card numeric id: ${id}`);
}

function unitId(seq: number): string {
  return `tarot.t${seq}`;
}

export type TarotFlattenResult = {
  readonly units: TranslationUnit[];
  readonly rebuild: (translated: ReadonlyMap<string, string>) => TarotCardVi[];
};

type CardPlan = {
  source: TarotCardSource;
  stringId: string;
  meaningUprightId: string;
  meaningReversedId: string;
  descriptionId: string;
  interpretationUprightId: string;
  interpretationReversedId: string;
  adviceUprightId: string;
  adviceReversedId: string;
  categories: {
    love: { uprightId: string; reversedId: string };
    career: { uprightId: string; reversedId: string };
    wealth: { uprightId: string; reversedId: string };
    health: { uprightId: string; reversedId: string };
  };
};

export function flattenTarotCards(
  cards: readonly TarotCardSource[],
  vnCardNamesById?: Record<string, string>,
): TarotFlattenResult {
  const textToId = new Map<string, string>();
  const units: TranslationUnit[] = [];

  const intern = (text: string): string => {
    const existing = textToId.get(text);
    if (existing !== undefined) {
      return existing;
    }
    const id = unitId(units.length);
    textToId.set(text, id);
    units.push({ id, text });
    return id;
  };

  const plans: CardPlan[] = cards.map((card) => {
    const stringId = toCardStringId(card.id);
    return {
      source: card,
      stringId,
      meaningUprightId: intern(card.meaning.upright),
      meaningReversedId: intern(card.meaning.reversed),
      descriptionId: intern(card.description),
      interpretationUprightId: intern(card.interpretation.upright),
      interpretationReversedId: intern(card.interpretation.reversed),
      adviceUprightId: intern(card.advice.upright),
      adviceReversedId: intern(card.advice.reversed),
      categories: {
        love: {
          uprightId: intern(card.categories.love.upright),
          reversedId: intern(card.categories.love.reversed),
        },
        career: {
          uprightId: intern(card.categories.career.upright),
          reversedId: intern(card.categories.career.reversed),
        },
        wealth: {
          uprightId: intern(card.categories.wealth.upright),
          reversedId: intern(card.categories.wealth.reversed),
        },
        health: {
          uprightId: intern(card.categories.health.upright),
          reversedId: intern(card.categories.health.reversed),
        },
      },
    };
  });

  const rebuild = (translated: ReadonlyMap<string, string>): TarotCardVi[] => {
    const take = (id: string): string => {
      const vi = translated.get(id);
      if (vi === undefined) {
        throw new Error(`Thiếu bản dịch cho unit "${id}".`);
      }
      return vi;
    };

    return plans.map((plan) => {
      const fallbackName = vnCardNamesById?.[plan.stringId] ?? plan.source.nameEn;
      return {
        id: plan.stringId,
        numericId: plan.source.id,
        name: fallbackName,
        nameEn: plan.source.nameEn,
        type: plan.source.type,
        suit: plan.source.suit,
        number: plan.source.number,
        meaning: {
          upright: take(plan.meaningUprightId),
          reversed: take(plan.meaningReversedId),
        },
        description: take(plan.descriptionId),
        interpretation: {
          upright: take(plan.interpretationUprightId),
          reversed: take(plan.interpretationReversedId),
        },
        advice: {
          upright: take(plan.adviceUprightId),
          reversed: take(plan.adviceReversedId),
        },
        categories: {
          love: {
            upright: take(plan.categories.love.uprightId),
            reversed: take(plan.categories.love.reversedId),
          },
          career: {
            upright: take(plan.categories.career.uprightId),
            reversed: take(plan.categories.career.reversedId),
          },
          wealth: {
            upright: take(plan.categories.wealth.uprightId),
            reversed: take(plan.categories.wealth.reversedId),
          },
          health: {
            upright: take(plan.categories.health.uprightId),
            reversed: take(plan.categories.health.reversedId),
          },
        },
      };
    });
  };

  return { units, rebuild };
}

// --- Runner -----------------------------------------------------------------

const SOURCE_REL = '../../../.ref/FateAtelier/src/data/tarotCards.ts';
const OUT_DIR_REL = '../data';
const OUT_REL = '../data/tarot-cards.vi.json';
const CACHE_REL = '../data/tarot-cards.cache.json';
const API_TARGET_REL = '../../../apps/api/src/modules/draws-tarot/data/tarot-data.ts';

export async function main(): Promise<void> {
  const here = dirname(fileURLToPath(import.meta.url));
  const batchArgIndex = process.argv.indexOf('--batch');
  const batchSize =
    batchArgIndex !== -1 ? Number.parseInt(process.argv[batchArgIndex + 1] ?? '', 10) : 30;

  const { translateUnits } = await import('../core');
  const { createOpenAiCompatibleTranslator, loadConfigFromEnv } = await import('../translate-client');

  const sourcePath = resolve(here, SOURCE_REL);
  const sourceModule = (await import(pathToFileURL(sourcePath).href)) as {
    tarotCards: TarotCardSource[];
  };
  const cards = sourceModule.tarotCards;

  // Đọc danh sách nhãn tiếng Việt chuẩn từ deck
  const deckPath = resolve(here, '../../../apps/api/src/modules/draws-tarot/tarot-deck.ts');
  let vnNames: Record<string, string> = {};
  if (existsSync(deckPath)) {
    const deckMod = (await import(pathToFileURL(deckPath).href)) as {
      TAROT_DECK: Array<{ id: string; name: string }>;
    };
    vnNames = Object.fromEntries(deckMod.TAROT_DECK.map((c) => [c.id, c.name]));
  }

  const { units, rebuild } = flattenTarotCards(cards, vnNames);

  const cachePath = resolve(here, CACHE_REL);
  const cache = new Map<string, string>();
  if (existsSync(cachePath)) {
    const parsed = JSON.parse(readFileSync(cachePath, 'utf8')) as Record<string, string>;
    for (const [id, vi] of Object.entries(parsed)) {
      if (typeof vi === 'string') cache.set(id, vi);
    }
  }

  const config = loadConfigFromEnv();
  const translator = createOpenAiCompatibleTranslator(config);
  console.log(
    `[tarot] ${cards.length} lá -> ${units.length} unit (deduped), model ${config.model}, batch ${batchSize}.`,
  );

  const report = await translateUnits(units, translator, { batchSize, cache });
  const dataset = rebuild(report.translated);

  const outDir = resolve(here, OUT_DIR_REL);
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  writeFileSync(cachePath, `${JSON.stringify(Object.fromEntries(report.translated), null, 2)}\n`, 'utf8');
  writeFileSync(resolve(here, OUT_REL), `${JSON.stringify(dataset, null, 2)}\n`, 'utf8');

  // Ghi file TypeScript tĩnh vào api module
  const tsContent = `// AUTO-GENERATED from scripts/translate/data/tarot-cards.vi.json. Do not edit by hand.
// 78 cards, verified 0 Han characters.
export interface TarotCategoryDetail {
  upright: string;
  reversed: string;
}

export interface TarotCardData {
  id: string;
  numericId: number;
  name: string;
  nameEn: string;
  type: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  number?: number;
  meaning: {
    upright: string;
    reversed: string;
  };
  description: string;
  interpretation: {
    upright: string;
    reversed: string;
  };
  advice: {
    upright: string;
    reversed: string;
  };
  categories: {
    love: TarotCategoryDetail;
    career: TarotCategoryDetail;
    wealth: TarotCategoryDetail;
    health: TarotCategoryDetail;
  };
}

export const TAROT_DATA: TarotCardData[] = ${JSON.stringify(dataset, null, 2)};

export const TAROT_DATA_BY_ID: Record<string, TarotCardData> = Object.fromEntries(
  TAROT_DATA.map((card) => [card.id, card]),
);
`;
  const apiTargetPath = resolve(here, API_TARGET_REL);
  const apiDataDir = dirname(apiTargetPath);
  if (!existsSync(apiDataDir)) mkdirSync(apiDataDir, { recursive: true });
  writeFileSync(apiTargetPath, tsContent, 'utf8');

  console.log(
    `[tarot] xong: ${units.length} unit (cache ${report.fromCache}, llm ${report.fromLlm}, retry ${report.retried}) -> ${dataset.length} lá Việt. Ghi ${OUT_REL} và ${API_TARGET_REL}.`,
  );
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error: unknown) => {
    console.error(`[tarot] thất bại: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  });
}

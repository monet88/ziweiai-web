import type { LenormandSpread } from '@ziweiai/contracts';
import { LENORMAND_CARDS, LENORMAND_SPREADS, type LenormandDataCard, type LenormandDataSpread } from './lenormand-data';

// US-037 (backlog #45): bộ 36 lá Lenormand + 5 bộ trải bài, đã dịch sẵn sang tiếng Việt qua
// pipeline B6-0 (scripts/translate/jobs/lenormand.ts). Dữ liệu nhúng dạng TS module
// (lenormand-data.ts, auto-generated) thay vì đọc JSON lúc chạy: api build ra CommonJS qua
// nest build nên import.meta + copy asset .json không khả dụng — khuôn này khớp tarot-deck.ts.
// Rút lá deterministic theo seed; bài đọc do LLM sinh ở service.
//
// Dataset KHÔNG chứa chữ Hán (đã qua Han-scan ở pipeline); lenormand-deck.test.ts chốt lại bất
// biến này để chặn hồi quy nếu dataset bị thay.

export type LenormandDeckCard = LenormandDataCard;
export type LenormandSpreadDef = LenormandDataSpread;
export type LenormandCardDraw = LenormandDeckCard & { reversed: boolean };

export const LENORMAND_DECK: readonly LenormandDeckCard[] = LENORMAND_CARDS;

const spreadByKey = new Map<string, LenormandSpreadDef>(LENORMAND_SPREADS.map((spread) => [spread.key, spread]));

export function getLenormandSpread(spread: LenormandSpread): LenormandSpreadDef {
  const def = spreadByKey.get(spread);
  if (!def) {
    // Spread key đến từ enum đã validate ở contract; thiếu trong dataset là lỗi dữ liệu thật.
    throw new Error(`Không tìm thấy bố cục Lenormand "${spread}" trong dataset.`);
  }
  return def;
}

const RANDOM_UINT32_BOUND = 0x100000000;
const FALLBACK_XORSHIFT_STATE = 0x9e3779b9;

function hashSeed(seed: string): number {
  if (typeof seed !== 'string') {
    return 0;
  }
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function nextRandom(state: number): { value: number; state: number } {
  let nextState = state;
  nextState ^= nextState << 13;
  nextState ^= nextState >>> 17;
  nextState ^= nextState << 5;
  return { value: (nextState >>> 0) / RANDOM_UINT32_BOUND, state: nextState >>> 0 };
}

// Rút deterministic theo seed (cùng pattern tarot-deck): không trùng lá trong một lượt; mỗi lá
// có 1/3 khả năng ngược. Seed rỗng → sinh seed ngẫu nhiên (mỗi lượt một quẻ mới).
export function drawLenormandDeterministic(seed: string | undefined, count: number): LenormandCardDraw[] {
  const trimmedSeed = typeof seed === 'string' ? seed.trim() : undefined;
  const effectiveSeed = trimmedSeed ? trimmedSeed : `${Date.now()}-${Math.random()}`;
  let state = hashSeed(effectiveSeed) || FALLBACK_XORSHIFT_STATE;
  const deck = [...LENORMAND_DECK];
  const result: LenormandCardDraw[] = [];
  const drawCount = Math.min(Math.max(count, 0), deck.length);

  for (let index = 0; index < drawCount; index += 1) {
    const cardRandom = nextRandom(state);
    state = cardRandom.state;
    const cardIndex = Math.floor(cardRandom.value * deck.length);
    const [card] = deck.splice(cardIndex, 1);

    const reversedRandom = nextRandom(state);
    state = reversedRandom.state;
    result.push({ ...card, reversed: reversedRandom.value < 1 / 3 });
  }

  return result;
}

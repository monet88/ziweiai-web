import { divinationStickSchema, type DivinationStick } from '@ziweiai/contracts';
import { DIVINATION_STICKS } from './data/sticks-data';

// US-039 (backlog #47): bộ 100 quẻ xăm đã dịch sẵn sang tiếng Việt qua pipeline B6-0
// (scripts/translate/jobs/divination-sticks.ts). Dữ liệu nhúng dạng TS module (sticks-data.ts,
// auto-generated) thay vì đọc JSON lúc chạy: api build ra CommonJS qua nest build nên import.meta
// + copy asset .json không khả dụng — khuôn này khớp lenormand-data.ts / tarot-deck.ts.
// Rút 1 quẻ deterministic theo seed; bài luận do LLM sinh ở service.
//
// Dataset KHÔNG chứa chữ Hán (đã qua Han-scan ở pipeline); stick-deck.test.ts chốt lại bất biến
// này để chặn hồi quy nếu dataset bị thay.

// Parse data module qua contract schema một lần lúc khởi động: bắt sớm nếu dataset auto-gen lệch
// shape (vd thêm field, sai mức xếp hạng) thay vì để vỡ ngầm khi rút quẻ.
export const STICK_DECK: readonly DivinationStick[] = DIVINATION_STICKS.map((stick) =>
  divinationStickSchema.parse(stick),
);

export const STICK_COUNT = STICK_DECK.length;

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

// Rút 1 quẻ deterministic theo seed (cùng pattern tarot-deck). Seed rỗng → sinh seed ngẫu nhiên
// (mỗi lượt một quẻ mới). Xin xăm chỉ rút đúng 1 quẻ nên trả về một phần tử.
export function drawStickDeterministic(seed: string | undefined): DivinationStick {
  const trimmedSeed = typeof seed === 'string' ? seed.trim() : undefined;
  const effectiveSeed = trimmedSeed ? trimmedSeed : `${Date.now()}-${Math.random()}`;
  const state = hashSeed(effectiveSeed) || FALLBACK_XORSHIFT_STATE;
  const { value } = nextRandom(state);
  const index = Math.floor(value * STICK_DECK.length);
  return STICK_DECK[Math.min(index, STICK_DECK.length - 1)];
}

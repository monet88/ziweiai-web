import { z } from 'zod';

export const tarotCardIdSchema = z.string().min(1);

export interface TarotDeckCard {
  id: string;
  name: string;
  arcana: 'major' | 'minor';
}

export interface TarotCardDraw {
  id: string;
  name: string;
  reversed: boolean;
}

const MINOR_RANKS = [
  { id: 'ace', label: 'Át' },
  { id: 'two', label: 'Hai' },
  { id: 'three', label: 'Ba' },
  { id: 'four', label: 'Bốn' },
  { id: 'five', label: 'Năm' },
  { id: 'six', label: 'Sáu' },
  { id: 'seven', label: 'Bảy' },
  { id: 'eight', label: 'Tám' },
  { id: 'nine', label: 'Chín' },
  { id: 'ten', label: 'Mười' },
  { id: 'page', label: 'Tiểu Đồng' },
  { id: 'knight', label: 'Kỵ Sĩ' },
  { id: 'queen', label: 'Nữ Hoàng' },
  { id: 'king', label: 'Vua' },
] as const;

function buildMinorSuit(suitId: string, suitName: string): TarotDeckCard[] {
  return MINOR_RANKS.map((rank) => ({
    id: `${suitId}_${rank.id}`,
    name: `${suitName} ${rank.label}`,
    arcana: 'minor',
  }));
}

// Bộ 78 lá với nhãn Việt + tên chuẩn Rider-Waite trong ngoặc, không chứa chữ Hán.
export const TAROT_DECK: TarotDeckCard[] = [
  { id: 'major_00', name: 'Kẻ Khờ (The Fool)', arcana: 'major' },
  { id: 'major_01', name: 'Pháp Sư (The Magician)', arcana: 'major' },
  { id: 'major_02', name: 'Nữ Tư Tế (The High Priestess)', arcana: 'major' },
  { id: 'major_03', name: 'Nữ Hoàng (The Empress)', arcana: 'major' },
  { id: 'major_04', name: 'Hoàng Đế (The Emperor)', arcana: 'major' },
  { id: 'major_05', name: 'Giáo Hoàng (The Hierophant)', arcana: 'major' },
  { id: 'major_06', name: 'Người Yêu (The Lovers)', arcana: 'major' },
  { id: 'major_07', name: 'Chiến Xa (The Chariot)', arcana: 'major' },
  { id: 'major_08', name: 'Sức Mạnh (Strength)', arcana: 'major' },
  { id: 'major_09', name: 'Ẩn Sĩ (The Hermit)', arcana: 'major' },
  { id: 'major_10', name: 'Bánh Xe Vận Mệnh (Wheel of Fortune)', arcana: 'major' },
  { id: 'major_11', name: 'Công Lý (Justice)', arcana: 'major' },
  { id: 'major_12', name: 'Kẻ Treo Ngược (The Hanged Man)', arcana: 'major' },
  { id: 'major_13', name: 'Chuyển Hóa (Death)', arcana: 'major' },
  { id: 'major_14', name: 'Tiết Độ (Temperance)', arcana: 'major' },
  { id: 'major_15', name: 'Quỷ Dữ (The Devil)', arcana: 'major' },
  { id: 'major_16', name: 'Tòa Tháp (The Tower)', arcana: 'major' },
  { id: 'major_17', name: 'Ngôi Sao (The Star)', arcana: 'major' },
  { id: 'major_18', name: 'Mặt Trăng (The Moon)', arcana: 'major' },
  { id: 'major_19', name: 'Mặt Trời (The Sun)', arcana: 'major' },
  { id: 'major_20', name: 'Phán Xét (Judgement)', arcana: 'major' },
  { id: 'major_21', name: 'Thế Giới (The World)', arcana: 'major' },
  ...buildMinorSuit('wands', 'Gậy'),
  ...buildMinorSuit('cups', 'Cốc'),
  ...buildMinorSuit('swords', 'Kiếm'),
  ...buildMinorSuit('pentacles', 'Tiền'),
];

function hashSeed(seed: string): number {
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
  return { value: (nextState >>> 0) / 0xffffffff, state: nextState >>> 0 };
}

export function drawDeterministic(seed: string | undefined, count: number): TarotCardDraw[] {
  const effectiveSeed = seed ?? `${Date.now()}`;
  let state = hashSeed(effectiveSeed);
  const deck = [...TAROT_DECK];
  const result: TarotCardDraw[] = [];
  const drawCount = Math.min(Math.max(count, 0), deck.length);

  for (let index = 0; index < drawCount; index += 1) {
    const cardRandom = nextRandom(state);
    state = cardRandom.state;
    const cardIndex = Math.floor(cardRandom.value * deck.length);
    const [card] = deck.splice(cardIndex, 1);

    const reversedRandom = nextRandom(state);
    state = reversedRandom.state;
    result.push({
      id: card.id,
      name: card.name,
      reversed: reversedRandom.value < 1 / 3,
    });
  }

  return result;
}
